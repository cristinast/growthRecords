import React, { useState } from 'react';
import { useLanguage } from './contexts/LanguageContext';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Tab,
    Tabs,
    Alert,
    Stack,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';

function Auth({ onAuthSuccess }) {
    const { t, changeLanguage, currentLanguage, languages } = useLanguage();
    const [tabValue, setTabValue] = useState(0);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ 
        username: '', 
        email: '', 
        password: '', 
        confirmPassword: '' 
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setError('');
        setSuccessMessage('');
    };

    const handleLoginChange = (e) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Attempting login with:', loginForm);
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginForm)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorData = await response.text();
                console.log('Error response:', errorData);
                try {
                    const jsonError = JSON.parse(errorData);
                    setError(jsonError.error || 'ログインに失敗しました');
                } catch {
                    setError(`サーバーエラー: ${response.status}`);
                }
                return;
            }

            const data = await response.json();
            console.log('Login successful:', data);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onAuthSuccess(data.user, data.token);
        } catch (error) {
            console.error('Login error:', error);
            setError(`${t('networkError')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (registerForm.password !== registerForm.confirmPassword) {
            setError(t('passwordMismatch'));
            setLoading(false);
            return;
        }

        if (registerForm.password.length < 6) {
            setError(t('passwordTooShort'));
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: registerForm.username,
                    email: registerForm.email,
                    password: registerForm.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 登録成功後にフォームをクリアしてログインタブに切り替え
                setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
                setTabValue(0); // ログインタブに切り替え
                setError(''); // エラーをクリア
                setSuccessMessage(t('registerSuccess'));
            } else {
                setError(data.error || t('registerError'));
            }
        } catch (error) {
            setError(t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            bgcolor: '#f5f5f5'
        }}>
            <Paper elevation={4} sx={{ p: 4, minWidth: 400, maxWidth: 500, position: 'relative' }}>
                {/* 语言选择器 */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select
                            value={currentLanguage}
                            onChange={(e) => changeLanguage(e.target.value)}
                            displayEmpty
                            sx={{ 
                                color: '#5DADE2', 
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#5DADE2' },
                                '& .MuiSelect-select': { py: 0.5 }
                            }}
                        >
                            {languages.map((lang) => (
                                <MenuItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                
                <Typography variant="h4" align="center" gutterBottom sx={{ mt: 2 }}>
                    {t('appTitle')}
                </Typography>
                
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label={t('login')} />
                    <Tab label={t('register')} />
                </Tabs>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

                {tabValue === 0 ? (
                    <Box component="form" onSubmit={handleLogin}>
                        <Stack spacing={2}>
                            <TextField
                                label={t('username')}
                                name="username"
                                value={loginForm.username}
                                onChange={handleLoginChange}
                                required
                                fullWidth
                            />
                            <TextField
                                label={t('password')}
                                name="password"
                                type="password"
                                value={loginForm.password}
                                onChange={handleLoginChange}
                                required
                                fullWidth
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary"
                                disabled={loading}
                                fullWidth
                                size="large"
                            >
                                {loading ? t('loggingIn') : t('loginButton')}
                            </Button>
                        </Stack>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleRegister}>
                        <Stack spacing={2}>
                            <TextField
                                label={t('username')}
                                name="username"
                                value={registerForm.username}
                                onChange={handleRegisterChange}
                                required
                                fullWidth
                            />
                            <TextField
                                label={t('email')}
                                name="email"
                                type="email"
                                value={registerForm.email}
                                onChange={handleRegisterChange}
                                required
                                fullWidth
                            />
                            <TextField
                                label={t('password')}
                                name="password"
                                type="password"
                                value={registerForm.password}
                                onChange={handleRegisterChange}
                                required
                                fullWidth
                                helperText={t('passwordTooShort')}
                            />
                            <TextField
                                label={t('confirmPassword')}
                                name="confirmPassword"
                                type="password"
                                value={registerForm.confirmPassword}
                                onChange={handleRegisterChange}
                                required
                                fullWidth
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary"
                                disabled={loading}
                                fullWidth
                                size="large"
                            >
                                {loading ? t('registering') : t('registerButton')}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

export default Auth;