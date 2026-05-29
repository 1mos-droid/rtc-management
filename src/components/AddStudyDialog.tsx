import React, { useState } from 'react';
import {
  Dialog,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Slider,
  IconButton
} from '@mui/material';
import { X } from 'lucide-react';
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '24px', p: 3 } } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={800}>New Study Series</Typography>
          <IconButton size="small" onClick={handleClose}><X size={20}/></IconButton>
      </Stack>
      
      <Stack spacing={3}>
          <TextField fullWidth label="Series Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          <TextField fullWidth label="Series Summary" multiline rows={3} value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} />
          
          <Box sx={{ px: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 2 }}>Number of Sessions: {formData.sessions}</Typography>
            <Slider value={formData.sessions} min={1} max={24} step={1} onChange={(e, v) => setFormData({...formData, sessions: v})} marks valueLabelDisplay="auto" />
          </Box>
      </Stack>
      
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button fullWidth variant="contained" disabled={loading || !formData.title} onClick={handleSubmit}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Series'}
          </Button>
      </Box>
    </Dialog>
  );
};

export default AddStudyDialog;
