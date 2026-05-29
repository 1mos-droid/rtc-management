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
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  CircularProgress,
  Stack
} from '@mui/material';
import { X } from 'lucide-react';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';

const Transition = React.forwardRef(function Transition(props: any, ref: any) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddMemberDialog = ({ open, onClose, onAddMember }) => {
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', 
    department: '', membershipType: 'Member',
    occupation: '', familyId: '', baptismDate: '', confirmationDate: '', campus: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    let tempErrors: Record<string, string> = {};
    if (!formData.name?.trim()) tempErrors.name = "Full name is required.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      const isMalicious = Object.values(formData).some(val => containsMaliciousPattern(val));
      if (isMalicious) {
        return;
      }

      setSubmitting(true);
      try {
        const sanitizedData = sanitize(formData);
        await onAddMember({ 
          ...sanitizedData, 
          membership_type: sanitizedData.membershipType,
          family_id: sanitizedData.familyId,
          baptism_date: sanitizedData.baptismDate,
          confirmation_date: sanitizedData.confirmationDate,
          status: 'active' 
        });
      } catch {
        setSubmitting(false);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      slots={{ transition: Transition }}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { borderRadius: '24px', p: 3 } } }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h6" fontWeight={800}>Register Member</Typography>
        <IconButton onClick={onClose} size="small"><X size={20}/></IconButton>
      </Stack>

      <DialogContent sx={{ p: 0, overflowY: 'visible' }}>
        <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
                <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} />
            </Grid>
            <Grid xs={12} sm={6}>
                <TextField fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} />
            </Grid>
            <Grid xs={12} sm={6}>
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            </Grid>
            <Grid xs={12} sm={6}>
                <TextField fullWidth label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
            </Grid>
            <Grid xs={12}>
                <TextField fullWidth label="Home Address" name="address" value={formData.address} onChange={handleChange} multiline rows={2} />
            </Grid>
            <Grid xs={12} sm={4}>
                <TextField fullWidth label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid xs={12} sm={4}>
                <TextField fullWidth label="Baptism Date" name="baptismDate" type="date" value={formData.baptismDate} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid xs={12} sm={4}>
                <TextField fullWidth label="Confirmation Date" name="confirmationDate" type="date" value={formData.confirmationDate} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select name="department" value={formData.department} onChange={handleChange} label="Department">
                        <MenuItem value=""><em>None / General</em></MenuItem>
                        <MenuItem value="Youth">Youth</MenuItem>
                        <MenuItem value="Women">Women</MenuItem>
                        <MenuItem value="Men">Men</MenuItem>
                        <MenuItem value="Music Team">Music Team</MenuItem>
                        <MenuItem value="Media">Media</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
                <TextField fullWidth label="Family Name/ID" name="familyId" value={formData.familyId} onChange={handleChange} />
            </Grid>
            <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel>Membership Type</InputLabel>
                    <Select name="membershipType" value={formData.membershipType} onChange={handleChange} label="Membership Type">
                        <MenuItem value="Member">Regular Member</MenuItem>
                        <MenuItem value="Visitor">Visiting Guest</MenuItem>
                        <MenuItem value="Staff">Ministerial Staff</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
                <TextField fullWidth label="Campus/Branch" name="campus" value={formData.campus} onChange={handleChange} />
            </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 0, mt: 4 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
        >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Register Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMemberDialog;
