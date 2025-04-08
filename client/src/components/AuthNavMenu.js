// client/src/components/AuthNavMenu.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip
} from '@mui/material';
import { Person, Login, Logout, AccountCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import VuiBox from './VuiBox';
import VuiTypography from './VuiTypography';

function AuthNavMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/authentication/sign-in');
  };

  const handleLogin = () => {
    handleClose();
    navigate('/authentication/sign-in');
  };

  const handleSignUp = () => {
    handleClose();
    navigate('/authentication/sign-up');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <VuiBox>
      <Tooltip title={isAuthenticated ? 'Account' : 'Login'}>
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{ color: 'white' }}
        >
          {isAuthenticated ? (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.875rem'
              }}
            >
              {user?.username?.charAt(0) || 'U'}
            </Avatar>
          ) : (
            <Person />
          )}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.dark',
            color: 'darkblue',
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              padding: 2
            }
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {isAuthenticated ? (
          <>
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <AccountCircle fontSize="small" sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText>
                <VuiTypography variant="button" color="white">
                  Profile
                </VuiTypography>
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText>
                <VuiTypography variant="button" color="white">
                  Logout
                </VuiTypography>
              </ListItemText>
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={handleLogin}>
              <ListItemIcon>
                <Login fontSize="small" sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText>
                <VuiTypography variant="button" color="white">
                  Login
                </VuiTypography>
              </ListItemText>
            </MenuItem>
            <MenuItem onClick={handleSignUp}>
              <ListItemIcon>
                <Person fontSize="small" sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText>
                <VuiTypography variant="button" color="white">
                  Sign Up
                </VuiTypography>
              </ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </VuiBox>
  );
}

export default AuthNavMenu;