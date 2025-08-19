const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;

const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// データベース接続
const db = new sqlite3.Database('./growth_records.db');

// 認証用ユーザーテーブル
db.run(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// アカウントテーブル
db.run(`CREATE TABLE IF NOT EXISTS accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    birthday TEXT,
    icon TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);
// 成長記録テーブル
db.run(`CREATE TABLE IF NOT EXISTS growth_records(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    date TEXT,
    height REAL,
    weight REAL,
    memo TEXT,
    photo TEXT,
    FOREIGN KEY(account_id) REFERENCES accounts(id)
)`);

// 既存のusersテーブルにavatarカラムを追加（存在しない場合）
db.run(`ALTER TABLE users ADD COLUMN avatar TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
        console.error('avatarカラム追加エラー:', err);
    } else if (!err) {
        console.log('avatarカラムを正常に追加しました');
    }
});

// テーブル作成後にデフォルトテストユーザーを作成
db.serialize(() => {
    db.get("SELECT * FROM users WHERE username = ?", ["カイト"], async (err, user) => {
        if (err) {
            console.error('テストユーザーの確認エラー:', err);
            return;
        }
        
        if (!user) {
            try {
                const hashedPassword = await bcrypt.hash("123456789", 10);
                db.run("INSERT INTO users(username, email, password_hash) VALUES (?, ?, ?)",
                    ["カイト", "kaito@test.com", hashedPassword],
                    function (err) {
                        if (err) {
                            console.error('テストユーザー作成エラー:', err);
                        } else {
                            console.log('テストユーザー "カイト" を正常に作成しました。パスワード: "123456789"');
                        }
                    });
            } catch (error) {
                console.error('テストユーザーパスワードハッシュ化エラー:', error);
            }
        } else {
            console.log('テストユーザー "カイト" は既に存在します');
        }
    });
});

// 写真アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'アクセストークンが必要です' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: '無効なトークンです' });
        req.user = user;
        next();
    });
};

// ユーザー登録
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run("INSERT INTO users(username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'ユーザー名またはメールアドレスは既に存在します' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                res.json({ 
                    message: 'ユーザー登録が正常に完了しました',
                    userId: this.lastID
                });
            });
    } catch (error) {
        res.status(500).json({ error: 'サーバーエラー' });
    }
});

// ユーザーログイン
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: '認証情報が無効です' });
        
        try {
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(400).json({ error: '認証情報が無効です' });
            }
            
            // ユーザーにデフォルトアカウントがあるかチェック、なければ作成
            db.get("SELECT * FROM accounts WHERE user_id = ?", [user.id], (err, account) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (!account) {
                    // ユーザー用のデフォルトアカウントを作成
                    db.run("INSERT INTO accounts(user_id, name, birthday, icon) VALUES (?, ?, ?, ?)",
                        [user.id, "子供", null, null],
                        function (err) {
                            if (err) return res.status(500).json({ error: err.message });
                            
                            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
                            res.json({ 
                                token,
                                user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
                            });
                        });
                } else {
                    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
                    res.json({ 
                        token,
                        user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
                    });
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'サーバーエラー' });
        }
    });
});

// アカウント登録（認証が必要）
app.post('/api/accounts', authenticateToken, upload.single('icon'), (req, res) => {
    const { name, birthday } = req.body;
    const icon = req.file ? `/uploads/${req.file.filename}` : null;
    const user_id = req.user.id;
    
    db.run("INSERT INTO accounts(user_id, name, birthday, icon) VALUES (?, ?, ?, ?)",
        [user_id, name, birthday, icon],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

// アカウント一覧取得（ユーザー固有）
app.get('/api/accounts', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    db.all("SELECT * FROM accounts WHERE user_id = ?", [user_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 成長記録登録
app.post('/api/records', authenticateToken, upload.single('photo'), (req, res) => {
    const { account_id, date, height, weight, memo } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run("INSERT INTO growth_records(account_id, date, height, weight, memo, photo) VALUES (?, ?, ?, ?, ?, ?)",
        [account_id, date, height, weight, memo, photo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

// 指定アカウントの成長記録取得
app.get('/api/records/:account_id', authenticateToken, (req, res) => {
    const account_id = req.params.account_id;
    db.all("SELECT * FROM growth_records WHERE account_id = ? ORDER BY date DESC",
        [account_id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
});

// 記録削除
app.delete('/api/records/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM growth_records WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ result: "削除完了" });
    })
});

// 記録更新
app.put('/api/records/:id', authenticateToken, upload.single('photo'), (req, res) => {
    const id = req.params.id;
    const { date, height, weight, memo, existingPhoto } = req.body;
    
    let photo;
    if (req.file) {
        // 新しい画像がアップロードされた場合
        photo = `/uploads/${req.file.filename}`;
    } else if (existingPhoto) {
        // 既存の画像を保持する場合
        photo = existingPhoto;
    } else {
        // 画像がない場合
        photo = null;
    }
    
    db.run("UPDATE growth_records SET date = ?, height = ?, weight = ?, memo = ?, photo = ? WHERE id = ?",
        [date, height, weight, memo, photo, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ result: "更新完了" });
        });
});

// プロフィール更新
app.put('/api/profile', authenticateToken, upload.single('avatar'), (req, res) => {
    const { username, email } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : null;
    const userId = req.user.id;
    
    // ユーザー名とメールアドレスの重複チェック（自分以外）
    db.get("SELECT * FROM users WHERE (username = ? OR email = ?) AND id != ?", 
        [username, email, userId], (err, existingUser) => {
            if (err) return res.status(500).json({ error: err.message });
            if (existingUser) {
                return res.status(400).json({ error: 'ユーザー名またはメールアドレスは既に使用されています' });
            }
            
            // アバター画像がアップロードされた場合の更新クエリ
            let query, params;
            if (avatar) {
                query = "UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?";
                params = [username, email, avatar, userId];
            } else {
                query = "UPDATE users SET username = ?, email = ? WHERE id = ?";
                params = [username, email, userId];
            }
            
            db.run(query, params, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                
                // 更新されたユーザー情報を返す
                db.get("SELECT id, username, email, avatar FROM users WHERE id = ?", [userId], (err, updatedUser) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    res.json({ 
                        message: 'プロフィールが正常に更新されました',
                        user: updatedUser
                    });
                });
            });
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});