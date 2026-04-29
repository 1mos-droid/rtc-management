import React, { useState } from 'react';
import {
  Dialog,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stack,
  useTheme
} from '@mui/material';
import { Upload, FileText, Music } from 'lucide-react';
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 0, p: 4 } } }}>
      <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>CURRICULUM ASSET</Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 4 }}>Add Resource</Typography>
      
      <Stack spacing={4}>
          <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} variant="outlined" />
          <Stack direction="row" spacing={2}>
              <Button fullWidth variant={type === 'pdf' ? 'contained' : 'outlined'} onClick={() => setType('pdf')} startIcon={<FileText size={16}/>}>Document</Button>
              <Button fullWidth variant={type === 'audio' ? 'contained' : 'outlined'} onClick={() => setType('audio')} startIcon={<Music size={16}/>}>Audio</Button>
          </Stack>
          <Box sx={{ p: 4, border: `1px dashed ${theme.palette.divider}`, textAlign: 'center' }}>
              <Upload size={24} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Select file to upload</Typography>
          </Box>
      </Stack>
      
      <Box sx={{ mt: 6, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleClose}>Discard</Button>
          <Button fullWidth variant="contained" disabled={loading || !title} onClick={handleSubmit}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Upload'}
          </Button>
      </Box>
    </Dialog>
  );
};

export default AddResourceDialog;
