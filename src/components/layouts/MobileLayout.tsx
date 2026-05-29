"use client";
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  useTheme, 
  Avatar,
  Menu,
  MenuItem,
  Stack,
  alpha,
  Container,
  Divider,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Fab
} from '@mui/material';
import { 
  LogOut, 
  Settings, 
  Moon,
  Sun,
  Bell,
  LayoutDashboard,
  Users,
  Send,
  Calendar,
  Menu as MenuIcon,
  Plus
} from 'lucide-react';
import { useColorMode } from '../../context/ColorModeContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { getSections } from './NavigationConfig';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleColorMode } = useColorMode();
  const { logout, user, ROLES, isAdmin, isDeveloper, mimicRole } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Header hide on scroll logic
  const { scrollY } = useScroll();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > lastScrollY && latest > 60) {
      setHeaderVisible(false);
    } else {
      setHeaderVisible(true);
    }
    setLastScrollY(latest);
  });

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleMoreMenu = (event: React.MouseEvent<HTMLElement>) => setMoreMenuAnchorEl(event.currentTarget);
  const handleMoreClose = () => setMoreMenuAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleClose();
    router.push('/login');
  };

  const sections = React.useMemo(() => 
    getSections(user, ROLES, isAdmin, isDeveloper, mimicRole),
    [isAdmin, isDeveloper, user, ROLES, mimicRole]
  );

  // Flatten items for the "More" menu
  const allItems = sections.flatMap(s => s.items);
  
  // Core navigation for bottom bar
  const mainNavItems = [
    { label: 'Home', value: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Directory', value: '/members', icon: <Users size={20} /> },
    { label: 'Chat', value: '/messaging', icon: <Send size={20} /> },
    { label: 'Events', value: '/events', icon: <Calendar size={20} /> },
  ];

  const currentMainPath = mainNavItems.find(item => pathname === item.value)?.value || 'more';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', pb: '76px' }}>
      
      {/* Top Header - Auto hides on scroll */}
      <AnimatePresence>
        {headerVisible && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'sticky', top: 0, zIndex: 1100, width: '100%' }}
          >
            <AppBar 
              position="static" 
              elevation={0} 
              sx={{ 
                bgcolor: theme.palette.mode === 'light' ? 'rgba(253, 251, 247, 0.7)' : 'rgba(16, 16, 18, 0.7)', 
                backdropFilter: 'blur(24px)', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 9999,
                mx: 'auto',
                width: 'calc(100% - 32px)',
                mt: 2,
                boxShadow: theme.palette.mode === 'light' 
                  ? '0 20px 40px -10px rgba(44,36,33,0.05), 0 10px 20px -5px rgba(44,36,33,0.02)'
                  : '0 20px 40px -10px rgba(0,0,0,0.5)',
              }}
            >
              <Toolbar sx={{ height: 56, minHeight: '56px !important', px: 2 }}>
                <Box sx={{ width: 28, height: 28, mr: 1.5, display: 'flex', alignItems: 'center' }}>
                  <img src={logo.src || (typeof logo === 'string' ? logo : '')} alt="RTCI" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.4)})` }} />
                </Box>
                
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.6rem', lineHeight: 1, letterSpacing: '0.1em' }}>
                    REDEEMED
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.45rem', lineHeight: 1, letterSpacing: '0.05em' }}>
                    TRANSFORMATION CHAPEL
                  </Typography>
                </Box>

                {mimicRole && (
                  <Chip 
                    label="SIM" 
                    size="small" 
                    color="warning" 
                    onDelete={() => setMimicRole(null)}
                    sx={{ fontWeight: 900, height: 20, fontSize: '0.55rem', mr: 1 }} 
                  />
                )}

                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <IconButton onClick={toggleColorMode} size="small" sx={{ color: 'text.primary' }}>
                    {mode === 'dark' ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                  </IconButton>
                  
                  <Box onClick={handleMenu} sx={{ ml: 1, p: 0.25, borderRadius: '50%', border: `1px solid ${theme.palette.divider}`, cursor: 'pointer' }}>
                    <Avatar sx={{ 
                      width: 28, 
                      height: 28, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      color: 'primary.main', 
                      fontSize: '0.75rem', 
                      fontWeight: 800 
                    }}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Box>
                </Stack>

                {/* Profile Menu */}
                <Menu
                  anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }} 
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{ 
                    paper: { 
                      sx: { 
                        mt: 1.5, minWidth: 200, borderRadius: '16px', p: 1, 
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[3] 
                      } 
                    } 
                  }}
                >
                  <Box sx={{ px: 2, py: 1, mb: 1 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{user?.name || 'User'}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>
                      {user?.role?.replace('_', ' ') || 'Staff'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem component={Link} href="/settings" onClick={handleClose} sx={{ py: 1.2, gap: 1.5, borderRadius: '12px' }}>
                    <Settings size={15} /> <Typography variant="body2" fontWeight={600}>Settings</Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ py: 1.2, gap: 1.5, color: 'error.main', borderRadius: '12px' }}>
                    <LogOut size={15} /> <Typography variant="body2" fontWeight={600}>Log Out</Typography>
                  </MenuItem>
                </Menu>
              </Toolbar>
            </AppBar>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <Box component="main" sx={{ p: 2, flexGrow: 1 }}>
        <Container maxWidth="sm" disableGutters>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Container>
      </Box>

      {/* Primary Floating Action Button (FAB) */}
      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ 
          position: 'fixed', 
          bottom: 90, 
          right: 20, 
          zIndex: 1000,
          boxShadow: theme.palette.mode === 'light' ? '0 8px 24px rgba(107, 23, 36, 0.25)' : '0 8px 24px rgba(227, 193, 127, 0.25)'
        }}
      >
        <Plus />
      </Fab>

      {/* Bottom Navigation Dock */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          left: 16, 
          right: 16, 
          zIndex: 1200,
          borderRadius: 9999,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'light' ? 'rgba(253, 251, 247, 0.75)' : 'rgba(16, 16, 18, 0.75)',
          backdropFilter: 'blur(32px)',
          boxShadow: theme.palette.mode === 'light' 
            ? '0 20px 40px -10px rgba(44,36,33,0.08), 0 10px 20px -5px rgba(44,36,33,0.04)'
            : '0 20px 40px -10px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 1
        }} 
        elevation={0}
      >
        <BottomNavigation
          showLabels
          value={currentMainPath}
          onChange={(event, newValue) => {
            if (newValue !== 'more') {
              router.push(newValue);
            }
          }}
          sx={{ bgcolor: 'transparent', height: 64, width: '100%' }}
        >
          {mainNavItems.map((item) => (
            <BottomNavigationAction 
              key={item.value} 
              label={item.label} 
              value={item.value} 
              icon={item.icon} 
              sx={{
                minWidth: 'auto',
                color: currentMainPath === item.value ? 'primary.main' : 'text.disabled',
                transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.65rem',
                  fontWeight: currentMainPath === item.value ? 800 : 600,
                  mt: 0.5,
                  transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                }
              }}
            />
          ))}
          <BottomNavigationAction 
            label="More" 
            value="more" 
            icon={<MenuIcon size={20} />} 
            onClick={handleMoreMenu}
            sx={{
              minWidth: 'auto',
              color: currentMainPath === 'more' ? 'primary.main' : 'text.disabled',
              transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
                fontWeight: currentMainPath === 'more' ? 800 : 600,
                mt: 0.5,
                transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
              }
            }}
          />
        </BottomNavigation>
      </Paper>

      {/* More Menu Drawer/Modal */}
      <Menu
        anchorEl={moreMenuAnchorEl}
        open={Boolean(moreMenuAnchorEl)}
        onClose={handleMoreClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: '250px',
              maxHeight: '60vh',
              mb: 2,
              borderRadius: '16px',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[10]
            }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main' }}>
            All Menu Items
          </Typography>
        </Box>
        {allItems.filter(item => !mainNavItems.some(main => main.value === item.path)).map((item) => {
          const Icon = item.icon;
          return (
            <MenuItem 
              key={item.path} 
              component={Link} 
              href={item.path} 
              onClick={handleMoreClose}
              sx={{ 
                py: 1.5, 
                px: 2,
                gap: 2,
                color: pathname === item.path ? 'primary.main' : 'text.primary',
                bgcolor: pathname === item.path ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
              }}
            >
              <Icon size={18} />
              <Typography variant="body2" sx={{ fontWeight: pathname === item.path ? 700 : 500 }}>
                {item.text}
              </Typography>
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
