import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  TextField, 
  Switch, 
  Avatar, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  useTheme,
  alpha,
  Stack,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  User, 
  Bell, 
  Moon, 
  LogOut, 
  Save,
  ShieldCheck,
  Palette,
  Lock,
  Globe,
  Trash2
} from 'lucide-react';
import { useColorMode } from '../context/ColorModeContext.jsx';

const Settings = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const { showNotification } = useWorkspace();
  
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showNotification("Configuration synchronized.");
    }, 1000);
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ mb: 8 }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>PREFERENCES & SECURITY</Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>Account Settings</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
             Configure your personal profile, visual environment, and system security thresholds.
        </Typography>
      </Box>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 0, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                <Avatar sx={{ width: 120, height: 140, bgcolor: 'primary.main', fontSize: '3rem', fontWeight: 900, mx: 'auto', borderRadius: 0, mb: 4, boxShadow: `0 20px 40px -10px ${alpha(theme.palette.primary.main, 0.2)}` }}>
                    {user?.email?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" fontWeight={900}>{user?.email?.split('@')[0] || 'Minister'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontFamily: 'Lora', fontStyle: 'italic' }}>{user?.email}</Typography>
                <Divider sx={{ my: 4 }} />
                <Stack spacing={2} sx={{ textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled">LEVEL</Typography>
                        <Typography variant="caption" fontWeight={900} color="primary">VERIFIED STAFF</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled">LAST ENTRY</Typography>
                        <Typography variant="caption" fontWeight={900}>Just now</Typography>
                    </Box>
                </Stack>
            </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={6}>
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}><Palette size={22}/> Visual Environment</Typography>
                    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <List disablePadding>
                            <ListItem sx={{ p: 4 }}>
                                <ListItemIcon sx={{ minWidth: 60 }}><Globe size={20} /></ListItemIcon>
                                <ListItemText primary={<Typography fontWeight={800}>Midnight Architecture</Typography>} secondary="Toggle between serene light and deep dark visual modes." />
                                <Switch checked={mode === 'dark'} onChange={toggleColorMode} />
                            </ListItem>
                            <Divider />
                            <ListItem sx={{ p: 4 }}>
                                <ListItemIcon sx={{ minWidth: 60 }}><Bell size={20} /></ListItemIcon>
                                <ListItemText primary={<Typography fontWeight={800}>Ministerial Alerts</Typography>} secondary="Receive immediate notifications for registry updates." />
                                <Switch defaultChecked />
                            </ListItem>
                        </List>
                    </Paper>
                </Box>

                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: 'error.main' }}><Lock size={22}/> Security Governance</Typography>
                    <Paper elevation={0} sx={{ p: 4, border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`, borderRadius: 0, bgcolor: alpha(theme.palette.error.main, 0.01) }}>
                        <Stack spacing={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body1" fontWeight={800}>Revoke Authorization</Typography>
                                    <Typography variant="caption" color="text.secondary">Instantly terminate all active ministerial sessions.</Typography>
                                </Box>
                                <Button variant="outlined" color="error" startIcon={<Trash2 size={16}/>} onClick={() => { logout(); navigate('/login'); }}>Sign Out</Button>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                        variant="contained" size="large" onClick={handleSave} disabled={loading}
                        sx={{ px: 8, py: 2, letterSpacing: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Synchronize Preferences'}
                    </Button>
                </Box>
            </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
