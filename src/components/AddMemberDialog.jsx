import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Grid,
  Slide,
  InputAdornment,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Stack,
  Avatar,
  CircularProgress,
  Divider
} from '@mui/material';
import { X, UserPlus, User, Mail, Phone, MapPin, Cake, Building, Users, Briefcase } from 'lucide-react';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddMemberDialog = ({ open, onClose, onAddMember }) => {
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', 
    department: '', position: '', membershipType: 'Member',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.name?.trim()) tempErrors.name = "Full name is essential.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      const isMalicious = Object.values(formData).some(val => containsMaliciousPattern(val));
      if (isMalicious) {
        window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'injection_attempt' } }));
        return;
      }

      setSubmitting(true);
      try {
        const sanitizedData = sanitize(formData);
        await onAddMember({ ...sanitizedData, status: 'active' });
      } catch {
        setSubmitting(false);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 0, p: 4 } } }}
    >
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
            <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>REGISTRATION</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>New Entry</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled' }}><X size={20}/></IconButton>
      </Box>

      <DialogContent sx={{ p: 0, overflowY: 'visible' }}>
        <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Telephone" name="phone" value={formData.phone} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Residential Address" name="address" value={formData.address} onChange={handleChange} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} InputLabelProps={{ shrink: true }} variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select name="department" value={formData.department} onChange={handleChange} label="Department">
                        <MenuItem value=""><em>None</em></MenuItem>
                        <MenuItem value="Youth">Youth</MenuItem>
                        <MenuItem value="Women">Women</MenuItem>
                        <MenuItem value="Men">Men</MenuItem>
                        <MenuItem value="Music Team">Music Team</MenuItem>
                        <MenuItem value="Media">Media</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 12 }}>
                <FormControl fullWidth>
                    <InputLabel>Membership Type</InputLabel>
                    <Select name="membershipType" value={formData.membershipType} onChange={handleChange} label="Membership Type">
                        <MenuItem value="Member">Regular Member</MenuItem>
                        <MenuItem value="Visitor">Visiting Guest</MenuItem>
                        <MenuItem value="Staff">Ministerial Staff</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 6 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 800, opacity: 0.6 }}>Discard</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            sx={{ px: 6, py: 1.5, letterSpacing: 2 }}
        >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm Registration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMemberDialog;
