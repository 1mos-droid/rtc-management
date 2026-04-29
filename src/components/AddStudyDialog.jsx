import React, { useState } from 'react';
import {
  Dialog,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Slider
} from '@mui/material';
import { supabase } from '../supabase';

const AddStudyDialog = ({ open, onClose, onStudyAdded }) => {
  const [formData, setFormData] = useState({ title: '', subtitle: '', sessions: 1, progress: 0 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('bible_studies').insert([formData]);
      if (error) throw error;
      onStudyAdded();
      handleClose();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClose = () => { setFormData({ title: '', subtitle: '', sessions: 1, progress: 0 }); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 0, p: 4 } } }}>
      <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>CURRICULUM MODULE</Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 4 }}>New Study Series</Typography>
      
      <Stack spacing={4}>
          <TextField fullWidth label="Series Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} variant="outlined" />
          <TextField fullWidth label="Summary / Focus" multiline rows={2} value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} variant="outlined" />
          
          <Box>
            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 1, mb: 1, display: 'block' }}>TOTAL SESSIONS: {formData.sessions}</Typography>
            <Slider value={formData.sessions} min={1} max={20} step={1} onChange={(e, v) => setFormData({...formData, sessions: v})} />
          </Box>
      </Stack>
      
      <Box sx={{ mt: 8, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleClose}>Discard</Button>
          <Button fullWidth variant="contained" disabled={loading || !formData.title} onClick={handleSubmit}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Series'}
          </Button>
      </Box>
    </Dialog>
  );
};

export default AddStudyDialog;
