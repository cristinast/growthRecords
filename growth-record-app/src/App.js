import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Stack,
  Paper,
  Pagination,
} from "@mui/material";

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const PAGE_SIZE = 10;

function App() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ date: "", height: "", weight: "", memo: "" });
  const [photo, setPhoto] = useState(null);
  const [page, setPage] = useState(1);

  const fetchRecords = () => {
    fetch('http://localhost:3001/api/records')
      .then(res => res.json())
      .then(data => setRecords(data));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (newDate) => {
    if (newDate) {
      const yyyy = newDate.getFullYear();
      const mm = String(newDate.getMonth() + 1).padStart(2, '0');
      const dd = String(newDate.getDate()).padStart(2, '0');
      setForm({ ...form, date: `${yyyy}-${mm}-${dd}` });
    } else {
      setForm({ ...form, date: "" });
    }
  };

  const handlePhotoChange = e => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('date', form.date);
    formData.append('height', form.height);
    formData.append('weight', form.weight);
    formData.append('memo', form.memo);
    if (photo) formData.append('photo', photo);

    fetch('http://localhost:3001/api/records', {
      method: 'POST',
      body: formData,
    }).then(() => {
      setForm({ date: '', height: '', weight: '', memo: '' });
      setPhoto(null);
      fetchRecords();
    });
  };


  // ページネーション計算
  const pageCount = Math.ceil(records.length / PAGE_SIZE);
  const paginateRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (event, value) => {
    setPage(value);
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          息子の成長記録
        </Typography>
        <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data" sx={{ mt: 4 }}>
          <Stack spacing={2}>
            {/* <TextField
              label="日付"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required /> */}

              <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="日付"
                value={form.date ? newDate(form.date) :null}
                onChange={handleChange}
                renderInput={(params) => <TextField {...params} required name="date"/>}
                inputFormat="yyyy-MM-dd"
                mask="____-__-__"
              />
              </LocalizationProvider>
            <TextField
              label="身長(cm)"
              name="height"
              type="number"
              value={form.height}
              onChange={handleChange}
              required />
            <TextField
              label="体重(kg)"
              name="weight"
              type="number"
              value={form.weight}
              onChange={handleChange} required
            />
            <TextField
              label="メモ"
              name="memo"
              type="text"
              value={form.memo}
              onChange={handleChange}
              required
            />
            <Button variant="contained" component="label">
              写真選択
              <input name="photo" type="file" accept="image/*" onChange={handlePhotoChange} hidden />
            </Button>
            <Button type="submit" variant="contained" color="primary" size="large">
              記録追加
            </Button>
          </Stack>
        </Box>
        <Box sx={{ maxHeight: 400, overflow: "auto", mt: 2 }}>
          <List>
            {paginateRecords.map(r => (
              <ListItem key={r.id} sx={{ mb: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                <ListItemText primary={`${r.date} - ${r.height}cm, ${r.weight}kg`}
                  secondary={r.memo} />
                {r.photo && (
                  <Box sx={{ ml: 2 }}>
                    <img src={`http://localhost:3001${r.photo}`} alt="記録写真"
                      style={{ width: "80px", borderRadius: "8px", border: "1px solid #ccc" }}
                    />
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
        {pageCount > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination count={pageCount} page={page} onChange={handlePageChange} color="primary" />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default App;
