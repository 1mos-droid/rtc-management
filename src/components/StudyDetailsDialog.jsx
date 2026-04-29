import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Button,
  Box,
  Typography,
  useTheme,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Avatar,
  Paper,
  TextField,
  Slider,
  CircularProgress
} from '@mui/material';
import { BookOpen, Clock, Activity, PlayCircle, Edit3, Save, X } from 'lucide-react';
import { supabase } from '../supabase';

const StudyDetailsDialog = ({ open, onClose, study, onUpdate }) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtitle: '', sessions: 1, progress: 0 });
  const [submitting, setSubmitting] = useState(false);
  const lastStudyIdRef = useRef(null);

  useEffect(() => {
    if (open && study) {
      if (study.id !== lastStudyIdRef.current) {
        setFormData({
          title: study.title || '',
          subtitle: study.subtitle || '',
          sessions: study.sessions || 1,
          progress: study.progress || 0
        });
        lastStudyIdRef.current = study.id;
        setIsEditing(false);
      }
    } else if (!open) {
      lastStudyIdRef.current = null;
    }
  }, [study, open]);

  if (!study) return null;

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bible_studies')
        .update(formData)
        .eq('id', study.id);
      
      if (error) throw error;

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 0, p: 6 } } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>
            {isEditing ? 'MODIFY MODULE' : 'MODULE SYLLABUS'}
        </Typography>
        {!isEditing ? (
          <Button startIcon={<Edit3 size={16}/>} size="small" onClick={() => setIsEditing(true)}>Edit</Button>
        ) : (
          <Button startIcon={<X size={16}/>} size="small" color="error" onClick={() => setIsEditing(false)}>Cancel</Button>
        )}
      </Stack>

      {isEditing ? (
        <Stack spacing={4}>
          <TextField fullWidth label="Series Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          <TextField fullWidth label="Summary" multiline rows={3} value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} />
          <Box>
            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 1, mb: 1, display: 'block' }}>TOTAL SESSIONS: {formData.sessions}</Typography>
            <Slider value={formData.sessions} min={1} max={50} step={1} onChange={(e, v) => setFormData({...formData, sessions: v})} />
          </Box>
          <Box>
            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 1, mb: 1, display: 'block' }}>COMPLETION PROGRESS: {formData.progress}%</Typography>
            <Slider value={formData.progress} min={0} max={100} step={5} onChange={(e, v) => setFormData({...formData, progress: v})} />
          </Box>
          <Button fullWidth variant="contained" startIcon={<Save size={18}/>} disabled={submitting} onClick={handleSave}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </Stack>
      ) : (
        <>
          <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, mb: 2, fontFamily: 'Merriweather' }}>{study.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontFamily: 'Lora', fontStyle: 'italic', lineHeight: 1.8 }}>{study.subtitle}</Typography>

          <Grid container spacing={4} sx={{ mb: 8 }}>
              <Grid size={{ xs: 6 }}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                      <Clock size={20} color={theme.palette.primary.main} style={{ marginBottom: 16 }} />
                      <Typography variant="h4" fontWeight={900}>{study.sessions}</Typography>
                      <Typography variant="caption" fontWeight={900} color="text.disabled">TOTAL SESSIONS</Typography>
                  </Paper>
              </Grid>
              <Grid size={{ xs: 6 }}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                      <Activity size={20} color={theme.palette.primary.main} style={{ marginBottom: 16 }} />
                      <Typography variant="h4" fontWeight={900}>{study.progress}%</Typography>
                      <Typography variant="caption" fontWeight={900} color="text.disabled">COMPLETION</Typography>
                  </Paper>
              </Grid>
          </Grid>

          <Box sx={{ mb: 8 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="caption" fontWeight={900}>OVERALL STATUS</Typography>
                  <Chip label={study.progress === 100 ? "COMPLETED" : "IN PROGRESS"} size="small" sx={{ borderRadius: 0, fontWeight: 900, fontSize: '0.6rem' }} />
              </Stack>
              <LinearProgress variant="determinate" value={study.progress} sx={{ height: 4, borderRadius: 0 }} />
          </Box>

          <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" onClick={onClose}>Close Syllabus</Button>
              <Button fullWidth variant="contained" startIcon={<PlayCircle size={18}/>}>Resume Study</Button>
          </Stack>
        </>
      )}
    </Dialog>
  );
};

export default StudyDetailsDialog;
