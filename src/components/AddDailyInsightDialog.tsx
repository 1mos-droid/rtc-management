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
  Typography,
  Box,
  alpha,
  useTheme
} from '@mui/material';
import { BookOpen, Quote, Save } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

const AddDailyInsightDialog = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { showNotification } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'verse',
    content: '',
    reference: '',
    author: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.content) return;

    setLoading(true);
    try {
      // Deactivate previous insights of the same type if we want only one active at a time
      // Or we can just add it and handle selection on the dashboard.
      // For simplicity, let's just insert it.
      
      const { error } = await supabase.from('daily_insights').insert([
        {
          ...formData,
          created_by: user.id,
          is_active: true
        }
      ]);

      if (error) throw error;

      showNotification('Inspiration shared successfully!', 'success');
      setFormData({ type: 'verse', content: '', reference: '', author: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Failed to share inspiration', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '24px' } } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Share Daily Inspiration</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Share a bible verse or a quote to inspire the congregation today.
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              select
              fullWidth
              label="Inspiration Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="verse">Bible Verse</MenuItem>
              <MenuItem value="quote">Inspirational Quote</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              required
              placeholder={formData.type === 'verse' ? "Enter the bible verse..." : "Enter the quote..."}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />

            {formData.type === 'verse' ? (
              <TextField
                fullWidth
                label="Bible Reference"
                placeholder="e.g. John 3:16"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            ) : (
              <TextField
                fullWidth
                label="Author"
                placeholder="e.g. C.S. Lewis"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.content}
            startIcon={<Save size={18} />}
          >
            Post Inspiration
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddDailyInsightDialog;
