"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  User, 
  Bell, 
  Palette, 
  Lock, 
  Globe, 
  Trash2,
  LockKeyhole,
  CheckCircle,
  EyeOff,
  Briefcase,
  Church
} from 'lucide-react';
import { useColorMode } from '../context/ColorModeContext';
import { supabase } from '../supabase';

const Settings = () => {
  const theme = useTheme();
  const router = useRouter();
  const { logout, user, refreshUser } = useAuth();
  const { mode, toggleColorMode } = useColorMode();
  const { showNotification } = useWorkspace();
  
  const [loading, setLoading] = useState(false);
  const [secLoading, setSecLoading] = useState(false);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    department: '',
    campus: ''
  });

  // Password Reset Form State
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // Regional Settings State
  const [regionalForm, setRegionalForm] = useState({
    language: 'English',
    timezone: 'UTC'
  });

  // Danger Zone Deletion Confirmation Modal
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        title: user.title || '',
        department: user.department || '',
        campus: user.campus || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleRegionalChange = (e) => {
    setRegionalForm({ ...regionalForm, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileForm.name,
          title: profileForm.title,
          department: profileForm.department || null,
          campus: profileForm.campus || null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshUser();
      showNotification("Profile settings synchronized successfully.", "success");
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }
    if (passwordForm.password.length < 6) {
      showNotification("Password must be at least 6 characters.", "error");
      return;
    }

    setSecLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.password
      });

      if (error) throw error;

      setPasswordForm({ password: '', confirmPassword: '' });
      showNotification("Security credentials synchronized successfully.", "success");
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to update password.", "error");
    } finally {
      setSecLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    showNotification("Deletion request registered under compliance protocol.", "info");
    setDeleteOpen(false);
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ mb: 8 }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>PREFERENCES & SECURITY</Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>Account Settings</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
             Configure your personal profile, visual environment, security credentials, and regional settings.
        </Typography>
      </Box>

      <Grid container spacing={6}>
        {/* Left Side: Avatar & Summary Box */}
        <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 0, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                <Avatar sx={{ width: 120, height: 120, bgcolor: 'primary.main', fontSize: '3rem', fontWeight: 900, mx: 'auto', borderRadius: 0, mb: 4, boxShadow: `0 20px 40px -10px ${alpha(theme.palette.primary.main, 0.2)}` }}>
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'M'}
                </Avatar>
                <Typography variant="h5" fontWeight={900}>{user?.name || user?.email?.split('@')[0] || 'Minister'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontFamily: 'Lora', fontStyle: 'italic' }}>{user?.email}</Typography>
                
                <Divider sx={{ my: 4 }} />
                
                <Stack spacing={2} sx={{ textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled">LEVEL</Typography>
                        <Typography variant="caption" fontWeight={900} color="primary">{user?.role?.toUpperCase() || 'VERIFIED STAFF'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled">DEPARTMENT</Typography>
                        <Typography variant="caption" fontWeight={900}>{user?.department || 'Church-wide'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" fontWeight={900} color="text.disabled">CAMPUS</Typography>
                        <Typography variant="caption" fontWeight={900}>{user?.campus || 'Main Sanctuary'}</Typography>
                    </Box>
                </Stack>
            </Paper>
        </Grid>

        {/* Right Side: Tabbed Settings Cards */}
        <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={6}>
                {/* 1. Personal Profile Settings */}
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}><User size={22}/> Personal Profile</Typography>
                    <Paper elevation={0} sx={{ p: 5, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Display Name"
                                  name="name"
                                  value={profileForm.name}
                                  onChange={handleProfileChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Ministerial Title"
                                  name="title"
                                  value={profileForm.title}
                                  onChange={handleProfileChange}
                                  placeholder="e.g. resident pastor, youth leader"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="dept-select-label">Primary Department</InputLabel>
                                    <Select
                                      labelId="dept-select-label"
                                      label="Primary Department"
                                      name="department"
                                      value={profileForm.department}
                                      onChange={handleProfileChange}
                                    >
                                        <MenuItem value=""><em>Church-wide / None</em></MenuItem>
                                        <MenuItem value="Youth">Youth Ministry</MenuItem>
                                        <MenuItem value="Music Team">Music Team</MenuItem>
                                        <MenuItem value="Media">Media Team</MenuItem>
                                        <MenuItem value="Children">Children Ministry</MenuItem>
                                        <MenuItem value="Counseling">Counseling Unit</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Campus / Branch"
                                  name="campus"
                                  value={profileForm.campus}
                                  onChange={handleProfileChange}
                                />
                            </Grid>
                            <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button 
                                  variant="contained" 
                                  onClick={handleSaveProfile} 
                                  disabled={loading}
                                  sx={{ px: 6, borderRadius: 1 }}
                                >
                                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Update Profile'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* 2. Visual Environment */}
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

                {/* 3. Credentials & Password Reset */}
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}><LockKeyhole size={22}/> Security Credentials</Typography>
                    <Paper elevation={0} sx={{ p: 5, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  type="password"
                                  label="New Password"
                                  name="password"
                                  value={passwordForm.password}
                                  onChange={handlePasswordChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  type="password"
                                  label="Confirm New Password"
                                  name="confirmPassword"
                                  value={passwordForm.confirmPassword}
                                  onChange={handlePasswordChange}
                                />
                            </Grid>
                            <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button 
                                  variant="outlined" 
                                  color="primary"
                                  onClick={handleUpdatePassword} 
                                  disabled={secLoading}
                                  sx={{ px: 6, borderRadius: 1 }}
                                >
                                    {secLoading ? <CircularProgress size={20} color="inherit" /> : 'Synchronize Credentials'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* 4. Language & Regional Settings */}
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}><Globe size={22}/> Language & Region</Typography>
                    <Paper elevation={0} sx={{ p: 5, border: `1px solid ${theme.palette.divider}`, borderRadius: 0 }}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="lang-select-label">Preferred Language</InputLabel>
                                    <Select
                                      labelId="lang-select-label"
                                      label="Preferred Language"
                                      name="language"
                                      value={regionalForm.language}
                                      onChange={handleRegionalChange}
                                    >
                                        <MenuItem value="English">English (United States)</MenuItem>
                                        <MenuItem value="Spanish">Español (España)</MenuItem>
                                        <MenuItem value="French">Français (France)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="tz-select-label">System Timezone</InputLabel>
                                    <Select
                                      labelId="tz-select-label"
                                      label="System Timezone"
                                      name="timezone"
                                      value={regionalForm.timezone}
                                      onChange={handleRegionalChange}
                                    >
                                        <MenuItem value="UTC">UTC (Universal Coordinated Time)</MenuItem>
                                        <MenuItem value="EST">EST (Eastern Standard Time)</MenuItem>
                                        <MenuItem value="GMT">GMT (Greenwich Mean Time)</MenuItem>
                                        <MenuItem value="WAT">WAT (West Africa Time)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                {/* 5. Danger Zone / Compliance */}
                <Box>
                    <Typography variant="h5" fontWeight={900} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, color: 'error.main' }}><Lock size={22}/> Security Governance & Compliance</Typography>
                    <Paper elevation={0} sx={{ p: 5, border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`, borderRadius: 0, bgcolor: alpha(theme.palette.error.main, 0.01) }}>
                        <Stack spacing={4}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="body1" fontWeight={800}>Revoke Active Session</Typography>
                                    <Typography variant="caption" color="text.secondary">Instantly sign out and close this secure session.</Typography>
                                </Box>
                                <Button variant="outlined" color="error" startIcon={<Trash2 size={16}/>} onClick={() => { logout(); router.push('/login'); }}>Sign Out</Button>
                            </Box>
                            
                            <Divider sx={{ borderColor: alpha(theme.palette.error.main, 0.1) }} />
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="body1" fontWeight={800} color="error.main">Delete Profiles & Data (GDPR)</Typography>
                                    <Typography variant="caption" color="text.secondary">Initiate complete account deletion and erase all personal telemetry.</Typography>
                                </Box>
                                <Button variant="contained" color="error" startIcon={<Trash2 size={16}/>} onClick={() => setDeleteOpen(true)}>Delete Profile</Button>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>
            </Stack>
        </Grid>
      </Grid>

      {/* Delete Profile Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 900 }}>
          {"Confirm Profile Erasure?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            To comply with GDPR and privacy standards, initiating complete data erasure will permanently remove your active credentials, database metadata, and security tags from the system. This action is irreversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ fontWeight: 800 }}>Cancel</Button>
          <Button onClick={handleDeleteProfile} color="error" variant="contained" autoFocus sx={{ fontWeight: 800 }}>
            Erase My Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
