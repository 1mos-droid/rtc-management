import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  styled, 
  useTheme, 
  Avatar,
  Menu,
  MenuItem,
  Stack,
  alpha,
  Container,
  useMediaQuery,
  Drawer,
  List,
  Divider
} from '@mui/material';
import { Menu as MenuIcon, X, LogOut, Heart, User, Settings, Leaf, Sparkles, Terminal } from 'lucide-react';
import { useColorMode } from '../context/ColorModeContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

const FloatingNav = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1100,
  backgroundColor: alpha(theme.palette.background.default, 0.7),
  backdropFilter: 'blur(24px)',
  padding: '6px 8px',
  borderRadius: 100,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: '0 12px 32px -4px rgba(74, 103, 65, 0.15)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  width: 'max-content',
  maxWidth: '95vw',
}));

const NavPill = styled(Button)(({ theme, active }) => ({
  borderRadius: 100,
  padding: '8px 16px',
  color: active ? '#fff' : theme.palette.text.secondary,
  backgroundColor: active ? theme.palette.primary.main : 'transparent',
  fontWeight: 800,
  textTransform: 'none',
  fontSize: '0.8rem',
  minWidth: 'auto',
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.05),
    transform: active ? 'none' : 'translateY(-1px)',
  },
}));

const NAV_ITEMS = [
  { text: 'Pulse', path: '/' },
  { text: 'Family', path: '/members' },
  { text: 'Log', path: '/attendance' },
  { text: 'Finance', path: '/financials' },
  { text: 'Events', path: '/events' },
  { text: 'Library', path: '/bible-studies' },
];

const ADMIN_ITEMS = [
  { text: 'Access', path: '/user-management' },
  { text: 'Audit', path: '/reports' },
];

const DEVELOPER_ITEMS = [
  { text: 'Console', path: '/developer' },
];

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode: _mode, toggleColorMode } = useColorMode();
  const { logout, user, ROLES, isAdmin, isDeveloper, mimicRole, setMimicRole } = useAuth();
  const { userRole: _userRole } = useWorkspace();
  const isMobile = useMediaQuery(theme.breakpoints.down('xl'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = location.pathname === '/login';

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const menuItems = React.useMemo(() => {
    const effectiveRoleValue = mimicRole || user?.role;
    
    // Member only sees Pulse, Events, Library
    if (effectiveRoleValue === ROLES.MEMBER) {
      return [
        { text: 'Pulse', path: '/' },
        { text: 'Events', path: '/events' },
        { text: 'Library', path: '/bible-studies' },
      ];
    }

    // Others see standard items
    let items = [...NAV_ITEMS];
    if (isAdmin || isDeveloper) {
      items = [...items, ...ADMIN_ITEMS];
    }
    if (isDeveloper) {
      items = [...items, ...DEVELOPER_ITEMS];
    }
    return items;
  }, [isAdmin, isDeveloper, user, ROLES, mimicRole]);

  if (isLoginPage) return <Box sx={{ minHeight: '100vh' }}>{children}</Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* Mimic Mode Banner */}
      {mimicRole && (
        <Box sx={{ 
          bgcolor: 'secondary.main', 
          color: '#fff', 
          py: 0.5, 
          textAlign: 'center', 
          fontSize: '0.7rem', 
          fontWeight: 900, 
          letterSpacing: 1,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          textTransform: 'uppercase'
        }}>
          Mimic Mode Active: Viewing as {mimicRole.replace('_', ' ')} • 
          <Button size="small" onClick={() => setMimicRole(null)} sx={{ color: '#fff', ml: 1, fontSize: '0.6rem', minWidth: 'auto', p: 0, textDecoration: 'underline', '&:hover': { background: 'transparent', textDecoration: 'none' } }}>Disable</Button>
        </Box>
      )}
      
      {/* --- MASTERPIECE FLOATING NAV --- */}
      <FloatingNav component={motion.div} initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 20 }}>
        
        {/* Brand/Logo Pill */}
        <Box 
          component={Link} to="/" 
          sx={{ 
            width: 44, height: 44, borderRadius: '50%', 
            bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textDecoration: 'none', transition: 'transform 0.3s ease',
            '&:hover': { transform: 'rotate(15deg) scale(1.1)' }
          }}
        >
          <Leaf size={22} fill="currentColor" />
        </Box>

        {/* Desktop Links */}
        {!isMobile && (
          <Stack direction="row" spacing={1} sx={{ px: 2 }}>
            {menuItems.map((item) => (
              <NavPill 
                key={item.text} 
                component={Link} 
                to={item.path} 
                active={location.pathname === item.path ? 1 : 0}
              >
                {item.text}
              </NavPill>
            ))}
          </Stack>
        )}

        <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', mx: 1, display: isMobile ? 'none' : 'block' }} />

        {/* Action Pills */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={toggleColorMode} size="small" sx={{ width: 44, height: 44, color: 'text.secondary', bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
            <Sparkles size={18} />
          </IconButton>
          
          <Box sx={{ cursor: 'pointer' }} onClick={handleMenu}>
            <Avatar sx={{ 
              width: 44, height: 44, bgcolor: isDeveloper ? 'secondary.main' : 'primary.main', 
              fontWeight: 800, fontSize: '0.85rem',
              border: `2px solid #fff`,
              boxShadow: `0 4px 12px ${alpha(isDeveloper ? theme.palette.secondary.main : theme.palette.primary.main, 0.2)}`
            }}>
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'M'}
            </Avatar>
          </Box>

          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} sx={{ width: 44, height: 44, color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <MenuIcon />
            </IconButton>
          )}
        </Stack>
      </FloatingNav>

      {/* User Dropdown */}
      <Menu
        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }} 
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 2, minWidth: 200, borderRadius: 6, p: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={800} noWrap>{user?.name || user?.email || 'Minister'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 900, fontSize: '0.65rem' }}>
              {user?.role?.replace('_', ' ') || 'Staff'}
            </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        {isDeveloper && (
          <MenuItem component={Link} to="/developer" onClick={handleClose} sx={{ py: 1.5, gap: 1.5, borderRadius: 3, color: 'secondary.main' }}>
            <Terminal size={16} /> <Typography variant="body2" fontWeight={700}>Dev Console</Typography>
          </MenuItem>
        )}
        <MenuItem component={Link} to="/settings" onClick={handleClose} sx={{ py: 1.5, gap: 1.5, borderRadius: 3 }}>
          <Settings size={16} /> <Typography variant="body2" fontWeight={700}>Sanctuary Settings</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, gap: 1.5, color: 'error.main', borderRadius: 3 }}>
          <LogOut size={16} /> <Typography variant="body2" fontWeight={700}>Log Out</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="top"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '0 0 40px 40px', p: 4, pt: 10, bgcolor: 'background.default' } } }}
      >
        <List>
          {menuItems.map((item) => (
            <Box
              key={item.text}
              component={Link}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              sx={{ 
                display: 'block', py: 2.5, px: 4, mb: 1.5,
                textDecoration: 'none', textAlign: 'center',
                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                fontWeight: 900, fontSize: '1.2rem', fontFamily: 'DM Serif Display',
                bgcolor: location.pathname === item.path ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                borderRadius: 4
              }}
            >
              {item.text}
            </Box>
          ))}
        </List>
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <IconButton onClick={() => setMobileOpen(false)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), color: 'error.main' }}>
                <X />
            </IconButton>
        </Box>
      </Drawer>

      {/* Main Page Area */}
      <Box component="main" sx={{ flexGrow: 1, pt: { xs: 12, md: 14 }, pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Box>

      {/* Elegant Footer */}
      <Box sx={{ py: 10, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "center", mb: 4, opacity: 0.3 }}>
             <Leaf size={24} /> <Heart size={24} /> <Leaf size={24} />
          </Stack>
          <Typography variant="body2" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 4, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              Redeem Transformation Chapel
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block', fontFamily: 'Lora', fontStyle: 'italic' }}>
              The Living Vine | Founded in Faith, Growing in Love.
          </Typography>
      </Box>
    </Box>
  );
};

export default AppLayout;
