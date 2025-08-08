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

// デーブル作成
db.run(`CREATE TABLE IF NOT EXISTS growth_records(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    height REAL,
    weight REAL,
    memo TEXT,
    photo TEXT
)`);

// 写真アップロードの設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file))
});

const upload = multer({ storage });

// 記録取得
app.get('/api/records', (req, res) => {
    db.all("SELECT * FROM growth_records ORDER BY date DESC", [], (err, rows) => {
        res.json(rows);
    });
});

// 記録追加
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});