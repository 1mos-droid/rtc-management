import React, { useState, useRef } from 'react';
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
import { uploadFile } from '@huggingface/hub';

const AddResourceDialog = ({ open, onClose, onResourceAdded }) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('pdf');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !file) return;
    setLoading(true);
    try {
      // 1. Upload to Hugging Face
      const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN;
      const hfRepo = process.env.NEXT_PUBLIC_HF_REPO || 'rtci-gallery';
      
      const fileName = `resources/${Date.now()}_${file.name}`;
      
      if (hfToken) {
        await uploadFile({
          repo: { type: 'dataset', name: hfRepo },
          credentials: { accessToken: hfToken },
          file: file,
          path: fileName
        });
      } else {
        console.warn('HF_TOKEN not found, skipping file upload');
      }

      // Format size for display (e.g. 2.4 MB)
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const formattedSize = `${sizeMB} MB`;

      // 2. Save resource to Supabase
      const fileUrl = `https://huggingface.co/datasets/${hfRepo}/resolve/main/${fileName}`;
      const { error } = await supabase
        .from('resources')
        .insert([{ 
          title, 
          type, 
          link: fileUrl,
          size: formattedSize
        }]);
      
      if (error) throw error;
      
      onResourceAdded();
      handleClose();
    } catch (err) { 
      console.error(err); 
      alert("Failed to upload resource: " + err.message);
    }
    finally { setLoading(false); }
  };

  const handleClose = () => { 
    setTitle(''); 
    setType('pdf'); 
    setFile(null);
    onClose(); 
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: '24px', p: 3 } } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={800}>Add Resource</Typography>
          <IconButton size="small" onClick={handleClose}><X size={20}/></IconButton>
      </Stack>
      
      <Stack spacing={3}>
          <TextField fullWidth label="Resource Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Stack direction="row" spacing={1} sx={{ p: 0.5, bgcolor: 'background.default', borderRadius: '12px' }}>
              <Button fullWidth size="small" variant={type === 'pdf' ? 'contained' : 'text'} onClick={() => setType('pdf')} startIcon={<FileText size={16}/>}>Document</Button>
              <Button fullWidth size="small" variant={type === 'audio' ? 'contained' : 'text'} onClick={() => setType('audio')} startIcon={<Music size={16}/>}>Audio</Button>
          </Stack>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept={type === 'pdf' ? '.pdf,.doc,.docx,.epub' : 'audio/*'} 
          />
          <Box 
            onClick={() => fileInputRef.current?.click()}
            sx={{ 
              p: 4, 
              border: `2px dashed ${theme.palette.divider}`, 
              borderRadius: '16px', 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: 'action.hover'
              }
            }}
          >
              <Upload size={24} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
              {file ? (
                <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 600 }}>
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              ) : (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                  Select file to upload
                </Typography>
              )}
          </Box>
      </Stack>
      
      <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={handleClose}>Cancel</Button>
          <Button fullWidth variant="contained" disabled={loading || !title || !file} onClick={handleSubmit}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
          </Button>
      </Box>
    </Dialog>
  );
};

export default AddResourceDialog;
