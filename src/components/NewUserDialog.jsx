import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Stack,
  MenuItem,
  Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { useWorkspace } from '../context/WorkspaceContext';

const NewUserDialog = ({ open, onClose, onUserAdded }) => {
  const { ROLES } = useAuth();
  const { showNotification } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: ROLES.MEMBER, department: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      showNotification("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      // In a real app, you might want to invite the user via Supabase Auth here
      // For now, we follow the existing pattern of inserting into profiles
      const { error } = await supabase
        .from('profiles')
        .insert([formData]);

      if (error) throw error;

      showNotification("User profile created successfully.");
      onUserAdded();
      onClose();
    } catch (err) {
      showNotification(err.message || "Failed to create user.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, p: 2 } } }}>
      <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Grant System Access</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Initialize a new administrative or ministerial profile. Access will be tied to this email.
        </Typography>
        <Stack spacing={3}>
          <TextField 
            label="Full Name" 
            name="name" 
            fullWidth 
            value={formData.name} 
            onChange={handleChange}
            variant="outlined"
          />
          <TextField 
            label="Email Address" 
            name="email" 
            fullWidth 
            value={formData.email} 
            onChange={handleChange}
            variant="outlined"
          />
          <TextField 
            select 
            label="Assigned Role" 
            name="role" 
            fullWidth 
            value={formData.role} 
            onChange={handleChange}
          >
            <MenuItem value={ROLES.ADMIN}>Administrator</MenuItem>
            <MenuItem value={ROLES.DEPARTMENT_HEAD}>Department Head</MenuItem>
            <MenuItem value={ROLES.MEMBER}>Member / User</MenuItem>
          </TextField>
          <TextField 
            label="Department" 
            name="department" 
            fullWidth 
            placeholder="e.g. Media, Choir, Youth"
            value={formData.department} 
            onChange={handleChange}
            variant="outlined"
            helperText="Required for Department Heads"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Confirm Access'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewUserDialog;
