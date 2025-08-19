import React, { useState, useEffect } from "react";
import Auth from './Auth';
import GrowthRecord from './GrowthRecord';
import UserProfile from './UserProfile';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Avatar, 
  Menu, 
  MenuItem, 
  Box,
  IconButton,
  Select,
  FormControl
} from "@mui/material";

function AppContent() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { t, changeLanguage, currentLanguage, languages } = useLanguage();

  useEffect(() => {
    // 既存の認証トークンをチェック
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setAnchorEl(null);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setIsHovered(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setIsHovered(false);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setAnchorEl(null);
  };

  const handleProfileClose = () => {
    setShowProfile(false);
  };

  if (!user || !token) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  if (showProfile) {
    return <UserProfile user={user} token={token} onClose={handleProfileClose} onUserUpdate={setUser} />;
  }

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={currentLanguage}
              onChange={(e) => changeLanguage(e.target.value)}
              displayEmpty
              sx={{ 
                color: '#5DADE2', 
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center', color: 'black' }}>
            {t('appTitle')}
          </Typography>
          <Box 
            sx={{ display: 'flex', alignItems: 'center' }}
            onMouseEnter={handleMenuClick}
            onMouseLeave={handleMenuClose}
          >
            <IconButton sx={{ p: 0, position: 'relative', zIndex: 1400 }}>
              <Avatar 
                src={user.avatar ? `http://localhost:3001${user.avatar}` : null}
                sx={{ 
                  width: isHovered ? 56 : 32, 
                  height: isHovered ? 56 : 32,
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  boxShadow: isHovered ? '0 4px 20px rgba(93, 173, 226, 0.4)' : 'none',
                  border: isHovered ? '3px solid #5DADE2' : 'none'
                }}
              >
                {user.username ? user.username.charAt(0) : 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              MenuListProps={{
                onMouseEnter: () => setAnchorEl(anchorEl),
                onMouseLeave: handleMenuClose,
              }}
              sx={{
                '& .MuiPaper-root': {
                  marginTop: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid #f0f0f0',
                  overflow: 'visible'
                }
              }}
            >
              <Box sx={{ px: 2, py: 2, pt: 4, borderBottom: '1px solid #f0f0f0', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                <Typography variant="body1" fontWeight="bold" color="#333">
                  {user.username}
                </Typography>
              </Box>
              <MenuItem onClick={handleProfileClick} sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(93, 173, 226, 0.04)' } }}>
                {t('profile')}
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.04)' }, color: '#f44336' }}>
                {t('logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container>
        <GrowthRecord token={token} />
      </Container>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;