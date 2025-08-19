import React, { useState, useEffect } from "react";
import {
    Typography,
    Stack,
    Button,
    Avatar,
    Box,
    Paper,
    TextField,
} from "@mui/material";

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function AccountSelector({ onSelect, token }) {
    const [accounts, setAccounts] = useState([]);
    const [form, setForm] = useState({ name: "", birthday: null });
    const [icon, setIcon] = useState(null);
    const [iconPreview, setIconPreview] = useState(null);

    const fetchAccounts = () => {
        fetch('http://localhost:3001/api/accounts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            console.log('Accounts data:', data);
            setAccounts(Array.isArray(data) ? data : []);
        })
        .catch(error => {
            console.error('Error fetching accounts:', error);
            setAccounts([]);
        });
    };

    useEffect(() => {
        if (token) {
            fetchAccounts();
        }
    }, [token]);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDateChange = (newDate) => {
        setForm({ ...form, birthday: newDate });
    };

    const handleIconChange = e => {
        const file = e.target.files[0];
        setIcon(file);
        setIconPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSumbit = e => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", form.name);
        if (form.birthday) {
            const yyyy = form.birthday.getFullYear();
            const mm = String(form.birthday.getMonth() + 1).padStart(2, '0');
            const dd = String(form.birthday.getDate()).padStart(2, '0');
            formData.append("birthday", `${yyyy}-${mm}-${dd}`);
        }

        if (icon) formData.append("icon", icon);

        fetch("http://localhost:3001/api/accounts", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        }).then(res => res.json())
            .then(data => {
                setForm({ name: "", birthday: null });
                setIcon(null);
                setIconPreview(null);
                // 再取得
                fetchAccounts();
            })
            .catch(error => console.error('Error creating account:', error));
    };

    return (
        <Paper elevation={4} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h5" align="center" gutterBottom>
                アカウント登録
            </Typography>
            <Box component="form" onSubmit={handleSumbit}>
                <Stack spacing={2}>
                    <TextField label="子供の名前" name="name" value={form.name} onChange={handleChange} required />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker label="誕生日" value={form.birthday} onChange={handleDateChange}
                            slotProps={{
                                textField: { required: true, name: "birthday", fullWidth: true }
                            }}
                        />
                    </LocalizationProvider>
                    <Button variant="contained" component="label">
                        アイコン画像を選択
                        <input type="file" accept="image/*" onChange={handleIconChange} hidden />
                    </Button>
                    {iconPreview && <Avatar src={iconPreview} sx={{ width: 80, height: 80, mx: "auto" }} />}
                    <Button type="submit" variant="contained" color="primary">登録</Button>
                </Stack>
            </Box>
            <Box mt={4}>
                <Typography variant="h6">アカウント選択</Typography>
                <Stack direction="row" spacing={2}>
                    {Array.isArray(accounts) && accounts.length > 0 ? (
                        accounts.map(acc => (
                            <Button key={acc.id} onClick={() => onSelect(acc)}
                                startIcon={acc.icon && <Avatar src={`http://localhost:3001${acc.icon}`} />}
                                variant="outlined"
                            >
                                {acc.name}
                            </Button>
                        ))
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            まだアカウントがありません。上記のフォームで子供のアカウントを作成してください。
                        </Typography>
                    )}
                </Stack>
            </Box>
        </Paper>
    );

}

export default AccountSelector;
