import React, { useState, useEffect } from 'react';
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
  Stack,
  Avatar
} from '@mui/material';
import { X, Edit, Calendar, Clock, MapPin } from 'lucide-react';
import { safeParseDate } from '../utils/dateUtils';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditEventDialog = ({ open, onClose, onEditEvent, event }) => {
  const [formData, setFormData] = useState({ name: '', date: '', time: '', location: '' });

  useEffect(() => {
    if (event) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
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
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 0, p: 4 } } }}>
      <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>CALENDAR UPDATE</Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 4 }}>Modify Event</Typography>
      
      <Stack spacing={3}>
          <TextField fullWidth label="Event Title" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} variant="outlined" />
          <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                  <TextField fullWidth type="date" label="Date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                  <TextField fullWidth type="time" label="Time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} InputLabelProps={{ shrink: true }} />
              </Grid>
          </Grid>
          <TextField fullWidth label="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
      </Stack>
      
      <Box sx={{ mt: 6, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>Discard</Button>
          <Button fullWidth variant="contained" onClick={handleSubmit}>Update Calendar</Button>
      </Box>
    </Dialog>
  );
};

export default EditEventDialog;
