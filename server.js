const express = require("express");
const cors = require("cors");
const req = require("express/lib/request");
const res = require("express/lib/response");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());


// データベース接続
const db = new sqlite3.Database('./growth_records.db');

// デーブル作成
db.run(`CREATE TABLE IF NOT EXISTS growth_records(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    height REAL,
    weight REAL,
    memo TEXT
)`);

// 記録取得
app.get('/api/records', (req, res) => {
    db.all("SELECT * FROM growth_records ORDER BY date DESC", [], (err, rows) => {
        res.json(rows);
    });
});

// 記録追加
app.post('/api/records', (req, res) => {
    const { date, height, weight, memo } = req.body;
    db.run("INSERT INTO growth_records(date, height, weight, memo) VALUES (?, ?, ?, ?)",
        [date, height, weight, memo], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});