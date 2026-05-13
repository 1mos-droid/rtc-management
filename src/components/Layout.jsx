import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
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
  Divider,
  Button,
  Chip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  X, 
  LogOut, 
  User, 
  Settings, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Coins, 
  BookOpen, 
  ShieldCheck, 
  BarChart3,
  Moon,
  Sun,
  Search,
  Bell,
  Terminal,
  Zap,
  Network,
  Book,
  HelpCircle,
  UserCheck,
  Layers,
  Baby,
  Send,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { useColorMode } from '../context/ColorModeContext.jsx';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const SidebarContainer = styled(Box)(({ theme, open }) => ({
  width: 280,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  zIndex: 1200,
  transition: theme.transitions.create(['transform'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('lg')]: {
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  marginLeft: 280,
  transition: theme.transitions.create(['margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  [theme.breakpoints.down('lg')]: {
    marginLeft: 0,
  },
}));

const NavItem = styled(Link)(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  textDecoration: 'none',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  fontWeight: active ? 700 : 500,
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.04),
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
  },
}));

const NAV_ITEMS = [
  { text: 'Dashboard', path: '/', icon: LayoutDashboard },
  { text: 'Members', path: '/members', icon: Users },
  { text: 'Groups', path: '/groups', icon: Layers },
  { text: 'Children', path: '/children', icon: Baby },
  { text: 'Communication', path: '/messaging', icon: Send },
  { text: 'Attendance', path: '/attendance', icon: UserCheck },
  { text: 'Financials', path: '/financials', icon: Coins },
  { text: 'Events', path: '/events', icon: Calendar },
  { text: 'Prayer Requests', path: '/prayer-requests', icon: MessageSquare },
  { text: 'Library', path: '/bible-studies', icon: BookOpen },
  { text: 'Live Bible', path: '/live-bible', icon: Book },
  { text: 'Service Gallery', path: '/gallery', icon: ImageIcon },
  { text: 'Church Leadership', path: '/leadership', icon: ShieldCheck },
];

const ADMIN_ITEMS = [
  { text: 'User Management', path: '/user-management', icon: ShieldCheck },
  { text: 'Reports', path: '/reports', icon: BarChart3 },
  { text: 'Quick Switch', path: '/quick-switch', icon: Zap },
  { text: 'Data Graph', path: '/graph', icon: Network },
];

const DEV_ITEMS = [
  { text: 'Developer Console', path: '/developer', icon: Terminal },
];

const UTILITY_ITEMS = [
  { text: 'Help & Docs', path: '/help', icon: HelpCircle },
  { text: 'Settings', path: '/settings', icon: Settings },
];

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useColorMode();
  const { logout, user, ROLES, isAdmin, isDeveloper, mimicRole, setMimicRole } = useAuth();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const sections = React.useMemo(() => {
    const effectiveRoleValue = mimicRole || user?.role;
    
    if (effectiveRoleValue === ROLES.MEMBER) {
      return [
        { label: 'Main Menu', items: [
          { text: 'Dashboard', path: '/', icon: LayoutDashboard },
          { text: 'Events', path: '/events', icon: Calendar },
          { text: 'Prayer Requests', path: '/prayer-requests', icon: MessageSquare },
          { text: 'Library', path: '/bible-studies', icon: BookOpen },
          { text: 'Live Bible', path: '/live-bible', icon: Book },
          { text: 'Service Gallery', path: '/gallery', icon: ImageIcon },
          { text: 'Church Leadership', path: '/leadership', icon: ShieldCheck },
        ]},
        { label: 'Support', items: UTILITY_ITEMS }
      ];
    }

    const result = [
      { label: 'Main Menu', items: NAV_ITEMS }
    ];

    if (isAdmin || isDeveloper) {
      result.push({ label: 'Administration', items: ADMIN_ITEMS });
    }

    if (isDeveloper) {
      result.push({ label: 'System', items: DEV_ITEMS });
    }

    result.push({ label: 'Support', items: UTILITY_ITEMS });

    return result;
  }, [isAdmin, isDeveloper, user, ROLES, mimicRole]);

  if (isLoginPage) return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>;

  const SidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      {/* Brand */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 6, px: 1 }}>
        <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={logo} alt="RTCI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.5, color: 'text.primary', fontSize: '1.1rem' }}>
          RTCI Portal
        </Typography>
      </Stack>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mx: -1, px: 1 }}>
        {sections.map((section) => (
          <Box key={section.label} sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.disabled" sx={{ px: 1, mb: 1, display: 'block', fontSize: '0.65rem', fontWeight: 800 }}>
              {section.label}
            </Typography>
            <Stack spacing={0.5}>
              {section.items.map((item) => (
                <NavItem 
                  key={item.text} 
                  to={item.path} 
                  active={location.pathname === item.path ? 1 : 0}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon size={20} />
                  {item.text}
                </NavItem>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>

      {/* User Footer */}
      <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', p: 1 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{user?.name || 'User'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ') || 'Staff'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout} color="error">
            <LogOut size={18} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* Sidebar for Desktop */}
      {isLargeScreen && (
        <SidebarContainer open={true}>
          {SidebarContent}
        </SidebarContainer>
      )}

      {/* Drawer for Mobile */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width: 280, border: 'none' } } }}
      >
        {SidebarContent}
      </Drawer>

      <MainContent>
        {/* Top Header */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: alpha(theme.palette.background.default, 0.8), backdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ height: 72 }}>
              {!isLargeScreen && (
                <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 2, color: 'text.primary' }}>
                  <MenuIcon />
                </IconButton>
              )}
              
              <Box sx={{ flexGrow: 1 }}>
                {mimicRole && (
                  <Chip 
                    label={`Viewing as ${mimicRole.replace('_', ' ')}`}
                    size="small"
                    color="warning"
                    onDelete={() => setMimicRole(null)}
                    sx={{ fontWeight: 700, borderRadius: 1 }}
                  />
                )}
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', bgcolor: alpha(theme.palette.text.primary, 0.04), borderRadius: 2, px: 2, py: 0.5, mr: 2 }}>
                  <Search size={16} style={{ color: theme.palette.text.disabled }} />
                  <Typography variant="body2" sx={{ ml: 1, color: theme.palette.text.disabled }}>Search registry...</Typography>
                </Box>
                
                <IconButton onClick={toggleColorMode} size="small" sx={{ color: 'text.secondary' }}>
                  {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </IconButton>
                
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Bell size={20} />
                </IconButton>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center' }} />
                
                <IconButton onClick={handleMenu} sx={{ p: 0.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '0.75rem', fontWeight: 800 }}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Stack>

              <Menu
                anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }} 
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{ paper: { sx: { mt: 1.5, minWidth: 200, borderRadius: 2, p: 1, boxShadow: theme.shadows[3] } } }}
              >
                <MenuItem component={Link} to="/settings" onClick={handleClose} sx={{ py: 1.2, gap: 1.5, borderRadius: 1 }}>
                  <Settings size={16} /> <Typography variant="body2" fontWeight={600}>Settings</Typography>
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={handleLogout} sx={{ py: 1.2, gap: 1.5, color: 'error.main', borderRadius: 1 }}>
                  <LogOut size={16} /> <Typography variant="body2" fontWeight={600}>Log Out</Typography>
                </MenuItem>
              </Menu>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Page Content */}
        <Box component="main" sx={{ p: { xs: 3, md: 6 } }}>
          <Container maxWidth="xl" disableGutters>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Container>
        </Box>
      </MainContent>
    </Box>
  );
};

export default AppLayout;
