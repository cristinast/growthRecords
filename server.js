const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3001;

app.use(cors());
app.use('/uploads', express.static('uploads'));


// データベース接続
const db = new sqlite3.Database('./growth_records.db');

// accounts table
db.run(`CREATE TABLE IF NOT EXISTS accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    birthday TEXT,
    icon TEXT
)`);
// growth_records table
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

// 写真アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// アカウント登録
app.post('/api/accounts', upload.single('icon'), (req, res) => {
    const { name, birthday } = req.body;
    const icon = req.file ? `/uploads/${req.file.filename}` : null;
    db.run("INSERT INTO accounts(name, birthday, icon) VALUES (?, ?, ?)",
        [name, birthday, icon],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});
// アカウント一覧取得
app.get('/api/accounts', (req, res) => {
    db.all("SELECT * FROM accounts", [], (err, rows) => {
        res.json(rows);
    });
});

// 成長記録登録
app.post('/api/records', upload.single('photo'), (req, res) => {
    const { date, height, weight, memo } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    db.run("INSERT INTO growth_records(date, height, weight, memo, photo) VALUES (?, ?, ?, ?, ?)",
        [date, height, weight, memo, photo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

// 指定アカウントの成長記録取得
app.get('/api/records/:account_id', (req, res) => {
    const account_id = req.params.account_id;
    db.all("SELECT * FROM growth_records WHERE account_id = ? ORDER BY date DESC",
        [account_id], (err, rows) => {
            res.json(rows);
        });
});



// 記録削除
app.delete('/api/records/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM growth_records WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ result: "deleted" });
    })
});

// 記録更新
app.put('/api/records', upload.single('photo'), (req, res) => {
    const id = req.params.id;
    const { date, height, weight, memo } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo || null;
    db.run("UPDATE growth_records SET date = ?, height = ?, weight = ?, memo = ?, photo = ? WHERE id = ?",
        [date, height, weight, memo, photo, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ result: "updated" });
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});