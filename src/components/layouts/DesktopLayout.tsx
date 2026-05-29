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
  Chip,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  LogOut, 
  Settings, 
  Moon,
  Sun,
  Search,
  Bell,
  Hexagon,
  ArrowUpRight
} from 'lucide-react';
import { useColorMode } from '../../context/ColorModeContext';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { getSections } from './NavigationConfig';

const RailContainer = styled(Box)(({ theme }) => ({
  width: 120,
  height: 'calc(100vh - 48px)',
  position: 'fixed',
  left: 24,
  top: 24,
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  backdropFilter: 'blur(40px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  borderRadius: '24px',
  zIndex: 1200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3, 0),
  boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
}));

const MainContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  minHeight: '100vh',
  marginLeft: 168, // Rail width (120) + gap (24) + margin (24)
  padding: theme.spacing(4, 6, 6, 0),
}));

const NavIconButton = styled(Link, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: number }>(({ theme, active }) => ({
    width: 54,
    height: 54,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '16px',
    textDecoration: 'none',
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.2) : 'transparent'}`,
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        transform: 'scale(1.1)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    },
}));

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleColorMode } = useColorMode();
  const { logout, user, ROLES, isAdmin, isDeveloper, mimicRole } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sections = React.useMemo(() => 
    getSections(user, ROLES, isAdmin, isDeveloper, mimicRole),
    [isAdmin, isDeveloper, user, ROLES, mimicRole]
  );

  const allItems = sections.flatMap(s => s.items);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleClose();
    router.push('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* Detached Glass Rail */}
      <RailContainer>
        <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', px: 1 }}>
            <Box sx={{ width: 44, height: 44, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={logo.src || (typeof logo === 'string' ? logo : '')} alt="RTCI" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 12px ${alpha(theme.palette.primary.main, 0.4)})` }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.55rem', lineHeight: 1, letterSpacing: '0.12em', mb: 0.3 }}>
              REDEEMED
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.4rem', fontWeight: 800, color: 'text.primary', letterSpacing: '0.08em', lineHeight: 1, mb: 0.3 }}>
              TRANSFORMATION
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.4rem', fontWeight: 800, color: 'text.primary', letterSpacing: '0.08em', lineHeight: 1, mb: 0.3 }}>
              CHAPEL
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.4rem', fontWeight: 800, color: 'secondary.main', letterSpacing: '0.12em' }}>
              INTERNATIONAL
            </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Stack spacing={2.5} sx={{ alignItems: 'center', pb: 4 }}>
                {allItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Tooltip key={item.text} title={item.text} placement="right" arrow>
                            <NavIconButton 
                                href={item.path} 
                                active={pathname === item.path ? 1 : 0}
                                prefetch={false}
                            >
                                <Icon size={22} strokeWidth={1.5} />
                            </NavIconButton>
                        </Tooltip>
                    );
                })}
            </Stack>
        </Box>

        <Stack spacing={2} sx={{ alignItems: 'center' }}>
            <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
            
            <Divider sx={{ width: '60%', borderColor: alpha(theme.palette.divider, 0.5), my: 1 }} />
            
            <Tooltip title={`${user?.name} (${user?.role?.replace('_', ' ')})`} placement="right">
                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                    <Avatar sx={{ 
                        width: 48, height: 48, 
                        borderRadius: '16px', 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        color: 'primary.main',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        fontSize: '1rem', fontWeight: 900 
                    }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                </IconButton>
            </Tooltip>
        </Stack>
      </RailContainer>

      <MainContent>
        {/* Floating HUD Header */}
        <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Paper sx={{ 
                flexGrow: 1, 
                height: 64, 
                borderRadius: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                px: 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(30px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}>
                <Search size={18} color={theme.palette.text.disabled} />
                <Typography variant="body2" sx={{ ml: 2, color: 'text.disabled', letterSpacing: '0.05em', fontWeight: 600 }}>SEARCH VANGUARD REGISTRY...</Typography>
                
                <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                    {mimicRole && (
                        <Chip 
                            label={`SIMULATION: ${mimicRole}`} 
                            color="warning" 
                            size="small" 
                            onDelete={() => setMimicRole(null)}
                            sx={{ borderRadius: '12px', fontWeight: 900 }} 
                        />
                    )}
                    <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', boxShadow: `0 0 10px ${theme.palette.success.main}` }} />
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900 }}>System Live</Typography>
                    </Stack>
                </Box>
            </Paper>

            <Paper sx={{ 
                width: 64, height: 64, 
                borderRadius: '24px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(30px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}>
                <IconButton sx={{ color: 'text.primary' }}><Bell size={20} /></IconButton>
            </Paper>
        </Box>

        {/* Dynamic Page HUD */}
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
      </MainContent>

      <Menu
        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }} 
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{ 
            paper: { 
                sx: { 
                    ml: 12, mb: 1, minWidth: 240, 
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    borderRadius: '16px', p: 1,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                } 
            } 
        }}
      >
        <Box sx={{ px: 2, py: 1.5, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 0.5 }}>{user?.name}</Typography>
            <Typography variant="overline" sx={{ opacity: 0.7 }}>{user?.role?.replace('_', ' ')}</Typography>
        </Box>
        <Divider sx={{ my: 1, opacity: 0.1 }} />
        <MenuItem component={Link} href="/settings" onClick={handleClose} sx={{ gap: 2, py: 1.5 }}>
            <Settings size={16} /> Settings
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ gap: 2, py: 1.5, color: 'error.main' }}>
            <LogOut size={16} /> Terminal Shutdown
        </MenuItem>
      </Menu>
    </Box>
  );
}
