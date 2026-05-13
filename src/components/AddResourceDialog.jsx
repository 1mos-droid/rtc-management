import React, { useState } from 'react';
import {
  Dialog,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stack,
  useTheme,
  IconButton
} from '@mui/material';
import { Upload, FileText, Music, X } from 'lucide-react';
import { supabase } from '../supabase';

const AddResourceDialog = ({ open, onClose, onResourceAdded }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('pdf');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resources')
        .insert([{ title, type, link: '#' }]);
      
      if (error) throw error;
      
      onResourceAdded();
      handleClose();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClose = () => { setTitle(''); setType('pdf'); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={800}>Add Resource</Typography>
          <IconButton size="small" onClick={handleClose}><X size={20}/></IconButton>
      </Stack>
      
      <Stack spacing={3}>
          <TextField fullWidth label="Resource Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Stack direction="row" spacing={1} sx={{ p: 0.5, bgcolor: 'background.default', borderRadius: 2 }}>
              <Button fullWidth size="small" variant={type === 'pdf' ? 'contained' : 'text'} onClick={() => setType('pdf')} startIcon={<FileText size={16}/>}>Document</Button>
              <Button fullWidth size="small" variant={type === 'audio' ? 'contained' : 'text'} onClick={() => setType('audio')} startIcon={<Music size={16}/>}>Audio</Button>
          </Stack>
          <Box sx={{ p: 4, border: `2px dashed ${theme.palette.divider}`, borderRadius: 2, textAlign: 'center' }}>
              <Upload size={24} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Select file to upload</Typography>
          </Box>
      </Stack>
      
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button fullWidth variant="contained" disabled={loading || !title} onClick={handleSubmit}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
          </Button>
      </Box>
    </Dialog>
  );
};

export default AddResourceDialog;
