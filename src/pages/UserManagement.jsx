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
  InputAdornment
} from '@mui/material';
import { 
  Shield, 
  MoreVertical, 
  Mail,
  Lock,
  ShieldCheck,
  UserCog,
  Search
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

  const [isEditDeptDialogOpen, setIsEditDeptDialogOpen] = useState(false);
  const [newDeptValue, setNewDeptValue] = useState('');
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

    if (newRole === ROLES.DEPARTMENT_HEAD) {
      setPendingRole(newRole);
      setNewDeptValue(selectedUser.department || '');
      setIsEditDeptDialogOpen(true);
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

  const handleUpdateDept = async () => {
    if (!selectedUser) return;
    try {
      const updates = { department: newDeptValue };
      if (pendingRole) {
        updates.role = pendingRole;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      showNotification(pendingRole ? `Promoted to Department Head of ${newDeptValue}` : "Department updated.");
      
      if (pendingRole) {
        sendRoleChangeEmail(selectedUser, selectedUser.role, pendingRole, newDeptValue);
      } else if (newDeptValue !== selectedUser.department) {
        sendRoleChangeEmail(selectedUser, selectedUser.role, selectedUser.role, newDeptValue);
      }

      setIsEditDeptDialogOpen(false);
      setPendingRole(null);
      setAnchorEl(null);
    } catch {
      showNotification("Failed to update status.", "error");
    }
  };

  const canManageRole = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.id === targetUser.id) return false;
    if (currentUser.role === ROLES.DEVELOPER) return true;
    if (currentUser.role === ROLES.ADMIN) {
      return targetUser.role === ROLES.DEPARTMENT_HEAD || targetUser.role === ROLES.MEMBER;
    }
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.id === targetUser.id) return false;
    if (currentUser.role === ROLES.DEVELOPER) return true;
    if (currentUser.role === ROLES.ADMIN) {
      return targetUser.role === ROLES.DEPARTMENT_HEAD || targetUser.role === ROLES.MEMBER;
    }
    return false;
  };

  const availableRoles = useMemo(() => {
    if (currentUser?.role === ROLES.DEVELOPER) {
      return [ROLES.DEVELOPER, ROLES.ADMIN, ROLES.DEPARTMENT_HEAD, ROLES.MEMBER];
    }
    if (currentUser?.role === ROLES.ADMIN) {
      return [ROLES.ADMIN, ROLES.DEPARTMENT_HEAD, ROLES.MEMBER];
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
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search size={18} style={{ color: theme.palette.text.disabled }} />
                    </InputAdornment>
                ),
            }}
        />
      </Stack>

      <Grid container spacing={3}>
          {loading && users.length === 0 ? [1,2,3,4,5,6].map(i => <Grid key={i} item xs={12} md={4}><Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} /></Grid>) : filteredUsers.map((u) => (
              <Grid item xs={12} md={4} key={u.id}>
                  <Paper elevation={0} sx={{ 
                      p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%',
                      '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.01) },
                      transition: 'all 0.2s ease'
                  }}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Avatar sx={{ 
                              width: 48, height: 48, borderRadius: 2, 
                              bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, 
                              fontWeight: 700, fontSize: '1.2rem' 
                          }}>
                              {u.name?.charAt(0)}
                          </Avatar>
                          <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedUser(u); }}><MoreVertical size={18}/></IconButton>
                      </Stack>
                      
                      <Typography variant="body1" fontWeight={800} sx={{ mb: 0.5 }}>{u.name}</Typography>
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
                          <Typography variant="caption" fontWeight={700} color="text.disabled">
                            {u.department || 'General'}
                          </Typography>
                      </Stack>
                  </Paper>
              </Grid>
          ))}
      </Grid>

      {/* Actions Menu */}
      <Menu 
        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 180, boxShadow: theme.shadows[3] } }}
      >
          {canManageRole(selectedUser) && (
            <Box>
              <MenuItem onClick={(e) => setRoleMenuAnchor(e.currentTarget)} sx={{ py: 1.2, gap: 1.5 }}>
                  <ShieldCheck size={16}/> Update Role
              </MenuItem>
              <MenuItem onClick={() => { setNewDeptValue(selectedUser?.department || ''); setIsEditDeptDialogOpen(true); }} sx={{ py: 1.2, gap: 1.5 }}>
                  <UserCog size={16}/> Assign Department
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
        PaperProps={{ sx: { borderRadius: 2, ml: 1, minWidth: 160, boxShadow: theme.shadows[3] } }}
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

      {/* Department Dialog */}
      <Dialog 
        open={isEditDeptDialogOpen} 
        onClose={() => { setIsEditDeptDialogOpen(false); setPendingRole(null); }} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, p: 3 } }}
      >
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            {pendingRole ? "Promote User" : "Update Department"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {pendingRole 
              ? `Assign a department for ${selectedUser?.name} as Department Head.` 
              : `Update the ministerial department for ${selectedUser?.name}.`}
          </Typography>

          <FormControl fullWidth sx={{ mb: 4 }}>
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

          <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" onClick={() => { setIsEditDeptDialogOpen(false); setPendingRole(null); }}>Cancel</Button>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleUpdateDept}
                disabled={pendingRole && !newDeptValue}
              >
                {pendingRole ? "Promote" : "Save"}
              </Button>
          </Stack>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
