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
  Select
} from '@mui/material';
import { 
  Shield, 
  MoreVertical, 
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  UserCog
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
      showNotification("User list sync failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
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

      showNotification("User access revoked.");
      setAnchorEl(null);
    } catch {
      showNotification("Failed to revoke access.", "error");
    }
  };

  const handleUpdateRole = async (newRole) => {
    if (!selectedUser) return;

    // If promoting to Dept Head, we must ask for the department first
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
      
      // Send formal email
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
      
      showNotification(pendingRole ? `Promoted to Department Head of ${newDeptValue}` : "Department updated successfully.");
      
      // Send formal email
      if (pendingRole) {
        sendRoleChangeEmail(selectedUser, selectedUser.role, pendingRole, newDeptValue);
      } else if (newDeptValue !== selectedUser.department) {
        // Send email for simple department change
        sendRoleChangeEmail(selectedUser, selectedUser.role, selectedUser.role, newDeptValue);
      }

      setIsEditDeptDialogOpen(false);
      setPendingRole(null);
      setAnchorEl(null);
    } catch {
      showNotification("Failed to update status.", "error");
    }
  };

  // Hierarchy Checks
  const canManageRole = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.id === targetUser.id) return false;
    
    // Developer can manage everyone else
    if (currentUser.role === ROLES.DEVELOPER) return true;
    
    // Admin can manage those with lower roles (Dept Head, Member)
    // They cannot manage other Admins or Developers
    if (currentUser.role === ROLES.ADMIN) {
      return targetUser.role === ROLES.DEPARTMENT_HEAD || targetUser.role === ROLES.MEMBER;
    }
    
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    if (currentUser.id === targetUser.id) return false;

    // Developer can delete anyone
    if (currentUser.role === ROLES.DEVELOPER) return true;
    
    // Admin cannot remove an admin. Even an admin.
    // They can only delete Dept Heads or Members.
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
      // Only developer can make someone else a developer
      return [ROLES.ADMIN, ROLES.DEPARTMENT_HEAD, ROLES.MEMBER];
    }
    return [];
  }, [currentUser, ROLES]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Shield size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'primary.main' }}>SYSTEM GOVERNANCE</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: "space-between", alignItems: "flex-end", gap: 2 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 400, color: 'primary.main', mb: 1, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>Stewardship & Access</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, fontFamily: 'Lora', fontStyle: 'italic', fontSize: '0.95rem' }}>
                Management of administrative privileges and ministerial access levels. Search for registered members to promote them.
            </Typography>
          </Box>
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', p: 0.5, borderRadius: 100, border: `1px solid ${theme.palette.divider}`, px: 2, width: { xs: '100%', md: 350 } }}>
            <Box sx={{ color: 'text.disabled', mr: 1.5, display: 'flex' }}><Shield size={16} /></Box>
            <TextField 
                fullWidth variant="standard" placeholder="Search members..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{ input: { disableUnderline: true, sx: { px: 1, py: 0.5, fontWeight: 500, fontSize: '0.85rem' } } }} 
            />
          </Paper>
        </Stack>
      </Box>

      <Grid container spacing={2}>
          {loading && users.length === 0 ? [1,2,3].map(i => <Grid key={i} size={{ xs: 12, md: 4 }}><Skeleton height={200} /></Grid>) : filteredUsers.map((u) => (
              <Grid size={{ xs: 12, md: 4 }} key={u.id}>
                  <Paper elevation={0} sx={{ 
                      p: 2.5, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, height: '100%',
                      position: 'relative', overflow: 'hidden',
                      '&:hover': { borderColor: theme.palette.primary.main, boxShadow: '0 10px 40px -10px rgba(74, 103, 65, 0.1)' }
                  }}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                              <Avatar sx={{ 
                                  width: 40, height: 40, borderRadius: 2, 
                                  bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, 
                                  fontWeight: 900, fontSize: '1rem' 
                              }}>
                                  {u.name?.charAt(0)}
                              </Avatar>
                              <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedUser(u); }}><MoreVertical size={16}/></IconButton>
                          </Stack>
                          
                          <Typography variant="h6" fontWeight={900} sx={{ mb: 0.25, fontFamily: 'DM Serif Display', fontSize: '1.1rem' }}>{u.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 0.25 }}>
                              <Mail size={12} /> <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>{u.email}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 2 }}>
                              <UserCog size={12} /> <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.7rem' }}>{u.department || 'No Department'}</Typography>
                          </Box>
                          
                          <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />
                          
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                              <Chip 
                                label={u.role?.toUpperCase().replace('_', ' ')} 
                                size="small" 
                                sx={{ 
                                    borderRadius: 1, fontWeight: 900, letterSpacing: 1.5, fontSize: '0.6rem',
                                    bgcolor: u.role === ROLES.DEVELOPER ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
                                    color: u.role === ROLES.DEVELOPER ? theme.palette.secondary.main : theme.palette.primary.main
                                }} 
                              />
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center", opacity: 0.6 }}>
                                  <ShieldCheck size={14} />
                                  <Typography variant="caption" fontWeight={800} color="text.disabled">{u.role === 'developer' ? 'System' : 'Sanctuary'}</Typography>
                              </Stack>
                          </Stack>
                      </Paper>
              </Grid>
          ))}
      </Grid>

      {/* Main Actions Menu */}
      <Menu 
        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1, border: `1px solid ${theme.palette.divider}`, minWidth: 180 } } }}
      >
          <MenuItem onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1.5, borderRadius: 2 }}><Sparkles size={16}/> Ministerial Review</MenuItem>
          
          {canManageRole(selectedUser) && (
            <>
              <MenuItem onClick={(e) => setRoleMenuAnchor(e.currentTarget)} sx={{ gap: 1.5, py: 1.5, borderRadius: 2 }}>
                  <UserCog size={16}/> Change Status
              </MenuItem>
              <MenuItem onClick={() => { setNewDeptValue(selectedUser?.department || ''); setIsEditDeptDialogOpen(true); }} sx={{ gap: 1.5, py: 1.5, borderRadius: 2 }}>
                  <Shield size={16}/> Change Department
              </MenuItem>
            </>
          )}

          {canDeleteUser(selectedUser) && (
            <>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => {
                    showConfirmation({
                        title: "Revoke Access",
                        message: `Permanently remove system authorization for ${selectedUser?.name}?`,
                        onConfirm: handleDeleteUser
                    });
                    setAnchorEl(null);
                }} sx={{ gap: 1.5, py: 1.5, borderRadius: 2, color: 'error.main' }}>
                    <Lock size={16}/> Revoke Authorization
                </MenuItem>
            </>
          )}
      </Menu>

      {/* Department Edit Dialog */}
      <Dialog 
        open={isEditDeptDialogOpen} 
        onClose={() => { setIsEditDeptDialogOpen(false); setPendingRole(null); }} 
        maxWidth="xs" 
        fullWidth 
        slotProps={{ paper: { sx: { borderRadius: 4, p: 4 } } }}
      >
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 900 }}>
            {pendingRole ? "Promote to Department Head" : "Assign Department"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {pendingRole 
              ? `Select the department ${selectedUser?.name} will oversee.` 
              : `Update the ministerial department for ${selectedUser?.name}.`}
          </Typography>

          <FormControl fullWidth variant="outlined">
            <InputLabel>Ministerial Department</InputLabel>
            <Select
              label="Ministerial Department"
              value={newDeptValue}
              onChange={(e) => setNewDeptValue(e.target.value)}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              <MenuItem value="Youth">Youth</MenuItem>
              <MenuItem value="Women">Women</MenuItem>
              <MenuItem value="Men">Men</MenuItem>
              <MenuItem value="Music Team">Music Team</MenuItem>
              <MenuItem value="Media">Media</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button fullWidth onClick={() => { setIsEditDeptDialogOpen(false); setPendingRole(null); }}>Cancel</Button>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleUpdateDept}
                disabled={pendingRole && !newDeptValue}
              >
                {pendingRole ? "Confirm Promotion" : "Save Changes"}
              </Button>
          </Box>
      </Dialog>

      {/* Role Selection Sub-Menu */}
      <Menu
        anchorEl={roleMenuAnchor}
        open={Boolean(roleMenuAnchor)}
        onClose={() => setRoleMenuAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 1, border: `1px solid ${theme.palette.divider}`, minWidth: 160 } } }}
      >
        {availableRoles.map((role) => (
          <MenuItem 
            key={role} 
            onClick={() => handleUpdateRole(role)}
            sx={{ borderRadius: 2, py: 1, fontSize: '0.85rem', fontWeight: 700 }}
          >
            {role.toUpperCase().replace('_', ' ')}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default UserManagement;
