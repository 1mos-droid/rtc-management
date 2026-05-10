import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  Grid,
  Slide,
  Stack
} from '@mui/material';
import { X } from 'lucide-react';
import { safeParseDate } from '../utils/dateUtils';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditEventDialog = ({ open, onClose, onEditEvent, event }) => {
  const [formData, setFormData] = useState({ name: '', date: '', time: '', location: '' });

  useEffect(() => {
    if (event) {
      setFormData({ // eslint-disable-line react-hooks/set-state-in-effect
        name: event.name || '',
        date: event.date ? safeParseDate(event.date).toISOString().split('T')[0] : '', 
        time: event.time || '',
        location: event.location || ''
      });
    }
  }, [event, open]);

  const handleSubmit = () => {
    if (formData.name && formData.date) {
      onEditEvent(event.id, formData);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} slots={{ transition: Transition }} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={800}>Edit Event</Typography>
          <IconButton size="small" onClick={onClose}><X size={20}/></IconButton>
      </Stack>
      
      <DialogContent sx={{ p: 0 }}>
        <Stack spacing={3}>
            <TextField fullWidth label="Event Title" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField fullWidth type="date" label="Date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth type="time" label="Time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} InputLabelProps={{ shrink: true }} />
                </Grid>
            </Grid>
            <TextField fullWidth label="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
        </Stack>
      </DialogContent>
      
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>Cancel</Button>
          <Button fullWidth variant="contained" onClick={handleSubmit}>Update Event</Button>
      </Box>
    </Dialog>
  );
};

export default EditEventDialog;
