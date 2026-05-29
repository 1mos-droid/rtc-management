"use client";
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Divider,
  Tooltip
} from '@mui/material';
import { 
  LogOut, 
  Settings, 
  Moon,
  Sun,
  Search,
  Bell,
  Menu as MenuIcon
} from 'lucide-react';
import { useColorMode } from '../../context/ColorModeContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { getSections } from './NavigationConfig';

const RailContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded: boolean }>(({ theme, expanded }) => ({
  width: expanded ? 280 : 80,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  zIndex: 1200,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  display: 'flex',
  flexDirection: 'column',
  overflowX: 'hidden'
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'railExpanded',
})<{ railExpanded: boolean }>(({ theme, railExpanded }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  marginLeft: railExpanded ? 280 : 80,
  transition: theme.transitions.create(['margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
}));

const NavItem = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'expanded',
})<{ active?: number; expanded: boolean }>(({ theme, active, expanded }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: expanded ? 'flex-start' : 'center',
  gap: expanded ? theme.spacing(2) : 0,
  padding: theme.spacing(1.2, expanded ? 2.5 : 0),
  margin: expanded ? 0 : theme.spacing(0, 1.5),
  height: expanded ? 'auto' : 48,
  borderRadius: expanded ? '16px' : '24px',
  textDecoration: 'none',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
  borderLeft: expanded 
    ? (active ? `3.5px solid ${theme.palette.primary.main}` : '3.5px solid transparent') 
    : 'none',
  fontWeight: active ? 700 : 500,
  fontSize: '0.85rem',
  letterSpacing: '0.01em',
  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  '&:hover': {
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.text.primary, 0.03),
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    paddingLeft: expanded ? theme.spacing(3) : undefined,
  },
}));

export default function TabletLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleColorMode } = useColorMode();
  const { logout, user, ROLES, isAdmin, isDeveloper, mimicRole } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);

  const sections = React.useMemo(() => 
    getSections(user, ROLES, isAdmin, isDeveloper, mimicRole),
    [isAdmin, isDeveloper, user, ROLES, mimicRole]
  );

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleClose();
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* Navigation Rail / Sidebar */}
      <RailContainer expanded={expanded}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', borderBottom: `1px solid ${theme.palette.divider}`, height: 72 }}>
          {expanded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32 }}>
                <img src={logo.src || (typeof logo === 'string' ? logo : '')} alt="RTCI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.6rem', lineHeight: 1, letterSpacing: '0.05em' }}>
                  REDEEMED
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.4rem', lineHeight: 1 }}>
                  TRANSFORMATION
                </Typography>
              </Box>
            </Box>
          )}
          <IconButton onClick={() => setExpanded(!expanded)} sx={{ color: 'text.primary' }}>
            <MenuIcon size={20} />
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', mt: 2, px: expanded ? 1 : 0 }}>
          {sections.map((section) => (
            <Box key={section.label} sx={{ mb: 3 }}>
              {expanded ? (
                <Typography 
                  variant="overline" 
                  sx={{ px: 1.5, mb: 1, display: 'block', fontSize: '0.62rem', fontWeight: 800, color: 'secondary.main', letterSpacing: '0.12em' }}
                >
                  {section.label}
                </Typography>
              ) : (
                <Divider sx={{ my: 2, mx: 2 }} />
              )}
              
              <Stack spacing={expanded ? 0.5 : 1.5}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.path ? 1 : 0;
                  
                  const linkContent = (
                    <NavItem 
                      href={item.path} 
                      active={active}
                      expanded={expanded}
                      prefetch={false}
                    >
                      <Icon size={expanded ? 17 : 20} style={{ strokeWidth: active ? 2.5 : 2 }} />
                      {expanded && item.text}
                    </NavItem>
                  );

                  return expanded ? (
                    <Box key={item.text}>{linkContent}</Box>
                  ) : (
                    <Tooltip key={item.text} title={item.text} placement="right" arrow>
                      <Box>{linkContent}</Box>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* User Footer */}
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'center' }}>
          {expanded ? (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', width: '100%' }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', border: `1px solid ${theme.palette.divider}`, fontSize: '0.85rem', fontWeight: 800 }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.82rem' }}>{user?.name || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', textTransform: 'capitalize', fontSize: '0.7rem' }}>
                  {user?.role?.replace('_', ' ') || 'Staff'}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleLogout} color="error">
                <LogOut size={16} />
              </IconButton>
            </Stack>
          ) : (
            <IconButton onClick={handleMenu}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', border: `1px solid ${theme.palette.divider}`, fontSize: '0.85rem', fontWeight: 800 }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          )}
        </Box>
      </RailContainer>

      <MainContent railExpanded={expanded}>
        {/* Top Header - Floating Glass Pill */}
        <Box sx={{ position: 'sticky', top: 24, zIndex: 1100, px: 4 }}>
          <AppBar 
            position="static" 
            elevation={0} 
            sx={{ 
              bgcolor: theme.palette.mode === 'light' ? 'rgba(253, 251, 247, 0.7)' : 'rgba(16, 16, 18, 0.7)', 
              backdropFilter: 'blur(24px)', 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 9999,
              mx: 'auto',
              boxShadow: theme.palette.mode === 'light' 
                ? '0 20px 40px -10px rgba(44,36,33,0.05), 0 10px 20px -5px rgba(44,36,33,0.02)'
                : '0 20px 40px -10px rgba(0,0,0,0.5)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
          >
            <Container maxWidth="xl">
              <Toolbar disableGutters sx={{ minHeight: '64px !important', px: 2 }}>
                <Box sx={{ flexGrow: 1 }} />

                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center', 
                    bgcolor: alpha(theme.palette.text.primary, 0.04), 
                    borderRadius: 999, 
                    border: `1px solid ${theme.palette.divider}`,
                    px: 2, 
                    py: 1, 
                    mr: 1,
                    cursor: 'text',
                    transition: 'all 0.3s ease',
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.08) }
                  }}>
                    <Search size={16} strokeWidth={2.5} style={{ color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ ml: 1.5, color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.8rem' }}>Search...</Typography>
                  </Box>
                  
                  <IconButton onClick={toggleColorMode} sx={{ color: 'text.primary', border: `1px solid ${theme.palette.divider}`, p: 1, borderRadius: '50%', '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05) } }}>
                    {mode === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                  </IconButton>
                  
                  <IconButton sx={{ color: 'text.primary', border: `1px solid ${theme.palette.divider}`, p: 1, borderRadius: '50%', '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05) } }}>
                    <Bell size={18} strokeWidth={2.5} />
                  </IconButton>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, alignSelf: 'center', borderColor: theme.palette.divider }} />
                  
                  <Box onClick={handleMenu} sx={{ p: 0.5, borderRadius: '50%', border: `1px solid ${theme.palette.divider}`, cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { borderColor: theme.palette.primary.main } }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      color: 'primary.main', 
                      fontSize: '0.75rem', 
                      fontWeight: 800 
                    }}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Box>
                </Stack>

                <Menu
                  anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }} 
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{ 
                    paper: { sx: { mt: 1.5, minWidth: 200, borderRadius: '16px', p: 1, border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] } } 
                  }}
                >
                  <MenuItem component={Link} href="/settings" prefetch={false} onClick={handleClose} sx={{ py: 1.2, gap: 1.5, borderRadius: '12px' }}>
                    <Settings size={15} /> <Typography variant="body2" fontWeight={600}>Settings</Typography>
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.2, gap: 1.5, color: 'error.main', borderRadius: '12px' }}>
                    <LogOut size={15} /> <Typography variant="body2" fontWeight={600}>Log Out</Typography>
                  </MenuItem>
                </Menu>
              </Toolbar>
            </Container>
          </AppBar>
        </Box>

        {/* Page Content */}
        <Box component="main" sx={{ px: 4, py: 10 }}>
          <Container maxWidth="xl" disableGutters>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Container>
        </Box>
      </MainContent>
    </Box>
  );
}
