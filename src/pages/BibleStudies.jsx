import React, { useState, useEffect, useCallback } from 'react';

import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  LinearProgress, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  IconButton, 
  Chip,
  Divider,
  CircularProgress,
  alpha,
  useTheme,
  Paper,
  Stack
} from '@mui/material';
import { 
  BookOpen, 
  ChevronRight, 
  FileText, 
  Plus,
  Trash2,
  ExternalLink,
  Bookmark,
  Library,
  Sparkles
} from 'lucide-react';

import StudyDetailsDialog from '../components/StudyDetailsDialog';
import AddResourceDialog from '../components/AddResourceDialog';
import AddStudyDialog from '../components/AddStudyDialog';

import { supabase } from '../supabase';

const BibleStudies = () => {
  const theme = useTheme();
  const { showNotification, showConfirmation } = useWorkspace();
  const { isAdmin, isDeveloper } = useAuth();
  const canManage = isAdmin || isDeveloper;
  
  const [activeTab, setActiveTab] = useState(0);
  const [studySeries, setStudySeries] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isAddStudyOpen, setIsAddStudyOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        supabase.from('bible_studies').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('resources').select('*').order('created_at', { ascending: false }).limit(200)
      ]);
      setStudySeries(sRes.data || []);
      setResources(rRes.data || []);
    } catch {
      showNotification("Failed to load curriculum.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const sChannel = supabase.channel('studies-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'bible_studies' }, fetchData).subscribe();
    const rChannel = supabase.channel('resources-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, fetchData).subscribe();
    return () => {
      supabase.removeChannel(sChannel);
      supabase.removeChannel(rChannel);
    };
  }, [fetchData]);

  const handleDeleteStudy = (study) => {
    if (!canManage) return;
    showConfirmation({
        title: "Remove Module",
        message: `Permanently erase "${study.title}" from the library?`,
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('bible_studies').delete().eq('id', study.id);
                if (error) throw error;
                showNotification("Module removed.");
            } catch { showNotification("Removal failed.", "error"); }
        }
    });
  };

  const handleDeleteResource = (res) => {
    if (!canManage) return;
    showConfirmation({
        title: "Erase Asset",
        message: "Permanently remove this resource from the vault?",
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('resources').delete().eq('id', res.id);
                if (error) throw error;
                showNotification("Resource removed.");
            } catch { showNotification("Removal failed.", "error"); }
        }
    });
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 10 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Library size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'primary.main' }}>SPIRITUAL FORMATION</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: "space-between", alignItems: "flex-end", gap: 4 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 400, color: 'primary.main', mb: 2 }}>The Ministerial Library</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, fontFamily: 'Lora', fontStyle: 'italic' }}>
                A curated collection of study modules and biblical resources to nurture the spiritual growth of the congregation.
            </Typography>
          </Box>
          {canManage && (
            <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => activeTab === 0 ? setIsAddStudyOpen(true) : setIsAddResourceOpen(true)}>
                {activeTab === 0 ? 'Create Module' : 'Upload Resource'}
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ mb: 6, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 6 }}>
          {['STUDY MODULES', 'RESOURCE VAULT'].map((label, idx) => (
              <Button 
                key={label}
                onClick={() => setActiveTab(idx)}
                sx={{ 
                    borderRadius: 0, pb: 2, px: 0, minWidth: 'auto',
                    fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.7rem',
                    color: activeTab === idx ? 'primary.main' : 'text.disabled',
                    borderBottom: `3px solid ${activeTab === idx ? theme.palette.primary.main : 'transparent'}`
                }}
              >
                  {label}
              </Button>
          ))}
      </Box>

      <Box>
        {activeTab === 0 ? (
            <Box>
                <Grid container spacing={4}>
                    {loading && studySeries.length === 0 ? <CircularProgress /> : studySeries.map((study) => (
                        <Grid size={{ xs: 12, md: 6 }} key={study.id}>
                            <Box>
                                <Paper elevation={0} sx={{ 
                                    p: 6, borderRadius: 8, border: `1px solid ${theme.palette.divider}`, height: '100%',
                                    display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                                    transition: 'all 0.3s ease', '&:hover': { borderColor: theme.palette.primary.main, boxShadow: '0 20px 60px -10px rgba(0,0,0,0.05)' }
                                }}>
                                    <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.03, color: 'primary.main' }}><BookOpen size={150}/></Box>
                                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: 4, position: 'relative', zIndex: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, borderRadius: 2 }}><Bookmark size={20}/></Avatar>
                                        {canManage && <IconButton size="small" color="error" onClick={() => handleDeleteStudy(study)}><Trash2 size={16}/></IconButton>}
                                    </Stack>
                                    <Typography variant="h5" fontWeight={900} sx={{ mb: 2, fontFamily: 'DM Serif Display', fontSize: '1.4rem' }}>{study.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 5, fontFamily: 'Lora', flexGrow: 1, fontStyle: 'italic', lineHeight: 1.8 }}>{study.subtitle}</Typography>
                                    
                                    <Box sx={{ mt: 'auto', position: 'relative', zIndex: 2 }}>
                                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1.5 }}>
                                            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 1.5 }}>FORMATION PROGRESS</Typography>
                                            <Typography variant="caption" fontWeight={900} color="primary">{study.progress}%</Typography>
                                        </Stack>
                                        <LinearProgress variant="determinate" value={study.progress} sx={{ height: 4, borderRadius: 0, bgcolor: alpha(theme.palette.primary.main, 0.1) }} />
                                        <Button fullWidth variant="outlined" endIcon={<ChevronRight size={16}/>} onClick={() => setSelectedStudy(study)} sx={{ mt: 5, borderRadius: 100 }}>Review Syllabus</Button>
                                    </Box>
                                </Paper>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        ) : (
            <Box>
                <Paper elevation={0} sx={{ borderRadius: 6, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                    <List disablePadding>
                        {loading && resources.length === 0 ? <CircularProgress /> : resources.map((res, i) => (
                            <React.Fragment key={res.id}>
                                <ListItem sx={{ py: 4, px: 6, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04), color: theme.palette.primary.main, borderRadius: 3, width: 48, height: 48 }}>
                                            <FileText size={20}/>
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={<Typography variant="body1" fontWeight={800}>{res.title}</Typography>} 
                                        secondary={<Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{res.type || 'DOCUMENT'} • {res.size || 'N/A'}</Typography>} 
                                    />
                                    <Stack direction="row" spacing={2}>
                                        <IconButton onClick={() => window.open(res.link, '_blank')} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main }}><ExternalLink size={18}/></IconButton>
                                        {canManage && <IconButton color="error" onClick={() => handleDeleteResource(res)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}><Trash2 size={18}/></IconButton>}
                                    </Stack>
                                </ListItem>
                                {i < resources.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            </Box>
        )}
      </Box>

      <StudyDetailsDialog open={!!selectedStudy} onClose={() => setSelectedStudy(null)} study={selectedStudy} onUpdate={fetchData} />
      <AddResourceDialog open={isAddResourceOpen} onClose={() => setIsAddResourceOpen(false)} onResourceAdded={fetchData} />
      <AddStudyDialog open={isAddStudyOpen} onClose={() => setIsAddStudyOpen(false)} onStudyAdded={fetchData} />
    </Box>
  );
};

export default BibleStudies;
