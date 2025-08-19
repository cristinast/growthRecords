import React, { useState } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Avatar,
    Box,
    Stack,
    AppBar,
    Toolbar,
    IconButton,
    Alert
} from '@mui/material';
// import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function UserProfile({ user, token, onClose, onUserUpdate }) {
    const { t } = useLanguage();
    const [form, setForm] = useState({
        username: user.username || '',
        email: user.email || ''
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(
        user.avatar ? `http://localhost:3001${user.avatar}` : null
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        setAvatar(file);
        setAvatarPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('username', form.username);
            formData.append('email', form.email);
            if (avatar) formData.append('avatar', avatar);

            const response = await fetch('http://localhost:3001/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(t('profileUpdated'));
                // ローカルストレージのユーザー情報を更新
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                onUserUpdate(updatedUser);
            } else {
                setError(data.error || t('profileUpdateError'));
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setError(t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AppBar position="static" sx={{ bgcolor: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <Toolbar>
                    <IconButton onClick={onClose} sx={{ mr: 2, color: '#5DADE2', '&:hover': { bgcolor: 'rgba(93, 173, 226, 0.04)' } }}>
                        ←
                    </IconButton>
                    <Typography variant="h6" color="black">
                        {t('profileSettings')}
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Paper elevation={4} sx={{ p: 4 }}>
                    <Typography variant="h5" align="center" gutterBottom>
                        {t('userProfile')}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={3} alignItems="center">
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar 
                                    src={avatarPreview}
                                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                                >
                                    {form.username ? form.username.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                                <Button variant="contained" component="label" sx={{ bgcolor: '#7FB3D3', '&:hover': { bgcolor: '#5499C7' } }}>
                                    {t('selectAvatar')}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleAvatarChange} 
                                        hidden 
                                    />
                                </Button>
                            </Box>

                            <TextField
                                label={t('username')}
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                                fullWidth
                            />

                            <TextField
                                label={t('email')}
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                fullWidth
                            />

                            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    fullWidth
                                    sx={{ bgcolor: '#5DADE2', '&:hover': { bgcolor: '#5499C7' } }}
                                >
                                    {loading ? t('updating') : t('update')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={onClose}
                                    fullWidth
                                    sx={{ color: '#5DADE2', borderColor: '#5DADE2', '&:hover': { borderColor: '#5499C7', color: '#5499C7' } }}
                                >
                                    {t('cancel')}
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}

export default UserProfile;