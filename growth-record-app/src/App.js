import React, { useState, useEffect } from "react";

function App() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ date: '', height: '', weight: '', memo: '' });

  useEffect(() => {
    fetch('http://localhost:3001/api/records')
      .then(res => res.json())
      .then(data => setRecords(data));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSumbit = e => {
    e.preventDefault();
    fetch('http://localhost:3001/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(() => {
      setForm({ date: '', height: '', weight: '', memo: '' });
      fetch('http://localhost:3001/api/records')
        .then(res => res.json())
        .then(data => setRecords(data));
    });
  };

  return (
    <div>
      <h1>息子の成長記録</h1>
      <form onSubmit={handleSumbit}>
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
        <input name="height" type="number" placeholder="身長(cm)" value={form.height} onChange={handleChange} required />
        <input name="weight" type="number" placeholder="体重(kg)" value={form.weight} onChange={handleChange} required />
        <input name="memo" type="text" placeholder="メモ" value={form.memo} onChange={handleChange} required />
        <button type="sumbit">記録追加</button>
      </form>

      <ul> {records.map(r => (
        <li key={r.id}>
          {r.date} - {r.height}cm, {r.weight}kg, {r.memo}
        </li>
      ))}</ul>
    </div>
  );
}

export default App;
