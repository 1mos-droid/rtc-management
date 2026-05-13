import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Avatar, 
  Chip, 
  IconButton, 
  useTheme, 
  Divider,
  Menu,
  MenuItem,
  Skeleton,
  alpha,
  Stack,
  Paper,
  TextField,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Shield, 
  MoreVertical, 
  Mail,
  Lock,
  ShieldCheck,
  UserCog,
  Search,
  MapPin,
  Camera,
  User as UserIcon,
  Upload
} from 'lucide-react';

import { supabase } from '../supabase';
import { sendRoleChangeEmail } from '../utils/emailService';

const UserManagement = () => {
  const theme = useTheme();
  const { showNotification, showConfirmation } = useWorkspace();
  const { user: currentUser, ROLES } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isEditScopeDialogOpen, setIsEditScopeDialogOpen] = useState(false);
  const [newDeptValue, setNewDeptValue] = useState('');
  const [newCampusValue, setNewCampusValue] = useState('');
  const [newTitleValue, setNewTitleValue] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch {
      showNotification("Failed to fetch user list.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchUsers(); // eslint-disable-line react-hooks/set-state-in-effect
    const channel = supabase.channel('profiles-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id);
      if (error) throw error;

      showNotification("User access revoked successfully.");
      setAnchorEl(null);
    } catch {
      showNotification("Failed to revoke access.", "error");
    }
  };

  const handleUpdateRole = async (newRole) => {
    if (!selectedUser) return;

    if (newRole === ROLES.DEPARTMENT_HEAD || newRole === ROLES.PASTOR) {
      setPendingRole(newRole);
      setNewDeptValue(selectedUser.department || '');
      setNewCampusValue(selectedUser.campus || '');
      setNewTitleValue(selectedUser.title || '');
      setAvatarPreview(selectedUser.avatar_url || '');
      setIsEditScopeDialogOpen(true);
      setRoleMenuAnchor(null);
      setAnchorEl(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      showNotification(`Role updated to ${newRole.replace('_', ' ')}.`);
      sendRoleChangeEmail(selectedUser, selectedUser.role, newRole);
      setRoleMenuAnchor(null);
      setAnchorEl(null);
    } catch {
      showNotification("Failed to update role.", "error");
    }
  };

  const handleUpdateScope = async () => {
    if (!selectedUser) return;
    setUploading(true);
    try {
      let avatarUrl = selectedUser.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${selectedUser.id}_${Date.now()}.${fileExt}`;
        const filePath = `officials/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('official-profiles')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('official-profiles')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }

      const updates = { 
        department: newDeptValue, 
        campus: newCampusValue,
        title: newTitleValue,
        avatar_url: avatarUrl
      };
      
      if (pendingRole) {
        updates.role = pendingRole;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      showNotification(pendingRole ? `Promoted to ${pendingRole.replace('_', ' ')}` : "Profile updated.");
      
      if (pendingRole) {
        sendRoleChangeEmail(selectedUser, selectedUser.role, pendingRole, newDeptValue);
      }

      setIsEditScopeDialogOpen(false);
      setPendingRole(null);
      setAvatarFile(null);
      setAvatarPreview('');
      setAnchorEl(null);
    } catch (err) {
      console.error(err);
      showNotification("Failed to update profile.", "error");
    } finally {
      setUploading(false);
    }
  };

  const canManageRole = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.id === targetUser.id) return false;
    if (currentUser.role === ROLES.DEVELOPER) return true;
    if (currentUser.role === ROLES.ADMIN) {
      return targetUser.role === ROLES.PASTOR || targetUser.role === ROLES.DEPARTMENT_HEAD || targetUser.role === ROLES.MEMBER;
    }
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.id === targetUser.id) return false;
    if (currentUser.role === ROLES.DEVELOPER) return true;
    if (currentUser.role === ROLES.ADMIN) {
      return targetUser.role !== ROLES.DEVELOPER && targetUser.role !== ROLES.ADMIN;
    }
    return false;
  };

  const availableRoles = useMemo(() => {
    if (currentUser?.role === ROLES.DEVELOPER) {
      return [ROLES.DEVELOPER, ROLES.ADMIN, ROLES.PASTOR, ROLES.DEPARTMENT_HEAD, ROLES.MEMBER];
    }
    if (currentUser?.role === ROLES.ADMIN) {
      return [ROLES.ADMIN, ROLES.PASTOR, ROLES.DEPARTMENT_HEAD, ROLES.MEMBER];
    }
    return [];
  }, [currentUser, ROLES]);

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { md: 'center' }, mb: 6 }}>
        <Box>
          <Typography variant="h2">User Management</Typography>
          <Typography variant="body1" color="text.secondary">Manage administrative privileges and ministerial access levels.</Typography>
        </Box>
        <TextField 
            size="small"
            placeholder="Search by name or email..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', md: 300 } }}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search size={18} style={{ color: theme.palette.text.disabled }} />
                        </InputAdornment>
                    ),
                },
            }}
        />
      </Stack>

      <Grid container spacing={3}>
          {loading && users.length === 0 ? [1,2,3,4,5,6].map(i => <Grid key={i} xs={12} md={4}><Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} /></Grid>) : filteredUsers.map((u) => (
              <Grid xs={12} md={4} key={u.id}>
                  <Paper elevation={0} sx={{ 
                      p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%',
                      '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.01) },
                      transition: 'all 0.2s ease'
                  }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Avatar 
                            src={u.avatar_url}
                            sx={{ 
                              width: 48, height: 48, borderRadius: 2, 
                              bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, 
                              fontWeight: 700, fontSize: '1.2rem' 
                            }}
                          >
                              {u.name?.charAt(0)}
                          </Avatar>
                          <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedUser(u); }}><MoreVertical size={18}/></IconButton>
                      </Stack>
                      
                      <Typography variant="body1" fontWeight={800} sx={{ mb: 0.5 }}>{u.name}</Typography>
                      {u.title && <Typography variant="caption" color="primary" fontWeight={700} sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase' }}>{u.title}</Typography>}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <Mail size={12} /> {u.email}
                      </Typography>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                          <Chip 
                            label={u.role?.replace('_', ' ')} 
                            size="small" 
                            sx={{ 
                                borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase',
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                color: theme.palette.primary.main
                            }} 
                          />
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            {u.campus && <Chip label={u.campus} size="small" icon={<MapPin size={10}/>} variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }}/>}
                            <Typography variant="caption" fontWeight={700} color="text.disabled">
                                {u.department || 'General'}
                            </Typography>
                          </Stack>
                      </Stack>
                  </Paper>
              </Grid>
          ))}
      </Grid>

      {/* Actions Menu */}
      <Menu 
        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { borderRadius: 2, mt: 1, minWidth: 180, boxShadow: theme.shadows[3] } } }}
      >
          {canManageRole(selectedUser) && (
            <Box>
              <MenuItem onClick={(e) => setRoleMenuAnchor(e.currentTarget)} sx={{ py: 1.2, gap: 1.5 }}>
                  <ShieldCheck size={16}/> Update Role
              </MenuItem>
              <MenuItem onClick={() => { 
                setNewDeptValue(selectedUser?.department || ''); 
                setNewCampusValue(selectedUser?.campus || ''); 
                setNewTitleValue(selectedUser?.title || '');
                setAvatarPreview(selectedUser?.avatar_url || '');
                setIsEditScopeDialogOpen(true); 
              }} sx={{ py: 1.2, gap: 1.5 }}>
                  <UserCog size={16}/> Edit Official Profile
              </MenuItem>
              <Divider sx={{ my: 1 }} />
            </Box>
          )}

          {canDeleteUser(selectedUser) && (
            <MenuItem onClick={() => {
                showConfirmation({
                    title: "Revoke Access",
                    message: `Are you sure you want to permanently revoke system access for ${selectedUser?.name}?`,
                    onConfirm: handleDeleteUser
                });
                setAnchorEl(null);
            }} sx={{ py: 1.2, gap: 1.5, color: 'error.main' }}>
                <Lock size={16}/> Revoke Access
            </MenuItem>
          )}
          {!canManageRole(selectedUser) && !canDeleteUser(selectedUser) && (
              <MenuItem disabled sx={{ py: 1.2 }}>No actions available</MenuItem>
          )}
      </Menu>

      {/* Role Selection Menu */}
      <Menu
        anchorEl={roleMenuAnchor}
        open={Boolean(roleMenuAnchor)}
        onClose={() => setRoleMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2, ml: 1, minWidth: 160, boxShadow: theme.shadows[3] } } }}
      >
        {availableRoles.map((role) => (
          <MenuItem 
            key={role} 
            onClick={() => handleUpdateRole(role)}
            sx={{ py: 1, fontSize: '0.85rem', fontWeight: 700 }}
          >
            {role.toUpperCase().replace('_', ' ')}
          </MenuItem>
        ))}
      </Menu>

      {/* Scope Dialog */}
      <Dialog 
        open={isEditScopeDialogOpen} 
        onClose={() => { if (!uploading) { setIsEditScopeDialogOpen(false); setPendingRole(null); } }} 
        maxWidth="xs" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}
      >
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            {pendingRole ? "Promote Official" : "Edit Official Profile"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Update the title, photo, and ministerial scope for {selectedUser?.name}.
          </Typography>

          <Stack spacing={3} sx={{ mb: 4 }}>
            {/* Avatar Upload */}
            <Box sx={{ textAlign: 'center' }}>
                <Box 
                    sx={{ 
                        width: 100, height: 100, mx: 'auto', mb: 2, 
                        borderRadius: 3, border: `2px dashed ${theme.palette.divider}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', position: 'relative'
                    }}
                >
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <UserIcon size={32} color={theme.palette.text.disabled} />
                    )}
                </Box>
                <Button 
                    component="label" 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Camera size={14} />}
                    disabled={uploading}
                >
                    {avatarPreview ? "Change Photo" : "Upload Photo"}
                    <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                        }
                    }} />
                </Button>
            </Box>

            <TextField 
                fullWidth 
                label="Official Title" 
                value={newTitleValue} 
                onChange={(e) => setNewTitleValue(e.target.value)} 
                placeholder="e.g. Resident Pastor, Head of Media"
                disabled={uploading}
            />

            <FormControl fullWidth disabled={uploading}>
                <InputLabel>Department</InputLabel>
                <Select
                label="Department"
                value={newDeptValue}
                onChange={(e) => setNewDeptValue(e.target.value)}
                >
                <MenuItem value=""><em>None / General</em></MenuItem>
                <MenuItem value="Youth">Youth</MenuItem>
                <MenuItem value="Women">Women</MenuItem>
                <MenuItem value="Men">Men</MenuItem>
                <MenuItem value="Music Team">Music Team</MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                </Select>
            </FormControl>

            <TextField 
                fullWidth 
                label="Campus / Branch" 
                value={newCampusValue} 
                onChange={(e) => setNewCampusValue(e.target.value)} 
                placeholder="e.g. Accra, Kumasi"
                disabled={uploading}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" disabled={uploading} onClick={() => { setIsEditScopeDialogOpen(false); setPendingRole(null); }}>Cancel</Button>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleUpdateScope}
                disabled={uploading}
                startIcon={uploading && <CircularProgress size={16} color="inherit" />}
              >
                {uploading ? "Updating..." : (pendingRole ? "Promote" : "Save Changes")}
              </Button>
          </Stack>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
