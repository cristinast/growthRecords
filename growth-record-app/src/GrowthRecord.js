import React, { useState, useEffect } from "react";
import { useLanguage } from './contexts/LanguageContext';
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

function GrowthRecord({ token }) {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ date: null, height: "", weight: "", memo: "" });
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [page, setPage] = useState(1);
  const [accountId, setAccountId] = useState(null);
  const [editId, setEditId] = useState(null);

  const fetchAccount = () => {
    fetch('http://localhost:3001/api/accounts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAccountId(data[0].id);
        }
      })
      .catch(error => console.error('Account fetch error:', error));
  };

  const fetchRecords = () => {
    if (!accountId) return;
    fetch(`http://localhost:3001/api/records/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(error => console.error('Records fetch error:', error));
  };

  useEffect(() => {
    if (token) fetchAccount();
  }, [token]);

  useEffect(() => {
    if (accountId) fetchRecords();
  }, [accountId]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleDateChange = newDate => {
    setForm({ ...form, date: newDate });
  };

  const handlePhotoChange = e => {
    setPhoto(e.target.files[0]);
  };

  // 編集ボタン処理
  const handleEdit = (record) => {
    setEditId(record.id);
    setForm({
      date: record.date ? new Date(record.date) : null,
      height: record.height.toString(),
      weight: record.weight.toString(),
      memo: record.memo
    });
    setPhoto(null);
    setExistingPhoto(record.photo);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditId(null);
    setForm({ date: null, height: "", weight: "", memo: "" });
    setPhoto(null);
    setExistingPhoto(null);
  };

  // 削除ボタン処理
  const handleDelete = (id) => {
    fetch(`http://localhost:3001/api/records/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(() => {
      fetchRecords();
    }).catch(error => console.error('Record delete error:', error));
  };

  // 送信処理（新規追加 or 編集）
  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData();
    
    if (!editId) {
      formData.append('account_id', accountId);
    }
    
    if (form.date) {
      const yyyy = form.date.getFullYear();
      const mm = String(form.date.getMonth() + 1).padStart(2, '0');
      const dd = String(form.date.getDate()).padStart(2, '0');
      formData.append('date', `${yyyy}-${mm}-${dd}`);
    }
    formData.append('height', form.height);
    formData.append('weight', form.weight);
    formData.append('memo', form.memo);
    if (photo) {
      formData.append('photo', photo);
    } else if (editId && existingPhoto) {
      formData.append('existingPhoto', existingPhoto);
    }

    // 編集か新規かで処理を分岐
    if (editId) {
      // 編集
      fetch(`http://localhost:3001/api/records/${editId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }).then(() => {
        setEditId(null);
        setForm({ date: null, height: '', weight: '', memo: '' });
        setPhoto(null);
        setExistingPhoto(null);
        fetchRecords();
      }).catch(error => console.error('Record update error:', error));
    } else {
      // 新規追加
      fetch(`http://localhost:3001/api/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }).then(() => {
        setForm({ date: null, height: '', weight: '', memo: '' });
        setPhoto(null);
        fetchRecords();
      }).catch(error => console.error('Record add error:', error));
    }
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
          {t('growthRecord')}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data" sx={{ mt: 4 }}>
          <Stack spacing={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('date')}
                value={form.date ? new Date(form.date) : null}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    required: true,
                    name: "date",
                    fullWidth: true,
                  }
                }}
              />
            </LocalizationProvider>
            <TextField
              label={t('height')}
              name="height"
              type="number"
              inputProps={{ step: "0.1", min: "0" }}
              value={form.height}
              onChange={handleChange}
              required />
            <TextField
              label={t('weight')}
              name="weight"
              type="number"
              inputProps={{ step: "0.1", min: "0" }}
              value={form.weight}
              onChange={handleChange} required
            />
            <TextField
              label={t('memo')}
              name="memo"
              type="text"
              value={form.memo}
              onChange={handleChange}
              required
            />
            <Button variant="contained" component="label" sx={{ bgcolor: '#7FB3D3', '&:hover': { bgcolor: '#5499C7' } }}>
              {t('selectPhoto')}
              <input name="photo" type="file" accept="image/*" onChange={handlePhotoChange} hidden />
            </Button>
            {/* 画像プレビュー */}
            {(photo || (editId && existingPhoto)) && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="textSecondary">{t('currentPhoto')}:</Typography>
                <img 
                  src={photo ? URL.createObjectURL(photo) : `http://localhost:3001${existingPhoto}`} 
                  alt={t('photoPreview')}
                  style={{ width: "100px", borderRadius: "8px", border: "1px solid #ccc", marginTop: "8px" }}
                />
              </Box>
            )}
            {editId ? (
              <Stack direction="row" spacing={2}>
                <Button type="submit" variant="contained" size="large" sx={{ bgcolor: '#5DADE2', '&:hover': { bgcolor: '#5499C7' } }}>
                  {t('update')}
                </Button>
                <Button variant="outlined" onClick={handleCancelEdit} size="large" sx={{ color: '#5DADE2', borderColor: '#5DADE2', '&:hover': { borderColor: '#5499C7', color: '#5499C7' } }}>
                  {t('cancel')}
                </Button>
              </Stack>
            ) : (
              <Button type="submit" variant="contained" size="large" sx={{ bgcolor: '#5DADE2', '&:hover': { bgcolor: '#5499C7' } }}>
                {t('addRecord')}
              </Button>
            )}
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
                    <img src={`http://localhost:3001${r.photo}`} alt={t('recordPhoto')}
                      style={{ width: "80px", borderRadius: "8px", border: "1px solid #ccc" }}
                    />
                  </Box>
                )}
                <Box sx={{ ml: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleEdit(r)}
                    sx={{ 
                      mr: 1, 
                      color: '#5DADE2', 
                      borderColor: '#5DADE2', 
                      '&:hover': { borderColor: '#5499C7', color: '#5499C7', bgcolor: 'rgba(93, 173, 226, 0.04)' } 
                    }}
                  >
                    {t('edit')}
                  </Button>
                  <Button 
                    color="error" 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleDelete(r.id)}
                  >
                    {t('delete')}
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
        {pageCount > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination 
              count={pageCount} 
              page={page} 
              onChange={handlePageChange} 
              sx={{
                '& .MuiPaginationItem-root': {
                  color: '#5DADE2'
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  backgroundColor: '#5DADE2',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#5499C7'
                  }
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default GrowthRecord;
