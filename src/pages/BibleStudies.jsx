import React, { useState, useEffect, useCallback } from 'react';

import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  LinearProgress, 
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
  Stack,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import { 
  BookOpen, 
  ChevronRight, 
  FileText, 
  Plus,
  Trash2,
  ExternalLink,
  Bookmark,
  Library
} from 'lucide-react';

import StudyDetailsDialog from '../components/StudyDetailsDialog';
import AddResourceDialog from '../components/AddResourceDialog';
import AddStudyDialog from '../components/AddStudyDialog';

import { supabase } from '../supabase';

const BibleStudies = () => {
  const theme = useTheme();
  const { showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const canManage = isDeptHead;
  
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
      showNotification("Failed to load ministerial library.", "error");
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
        title: "Delete Module",
        message: `Are you sure you want to permanently remove "${study.title}" from the library?`,
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('bible_studies').delete().eq('id', study.id);
                if (error) throw error;
                showNotification("Module deleted.");
            } catch { showNotification("Failed to delete module.", "error"); }
        }
    });
  };

  const handleDeleteResource = (res) => {
    if (!canManage) return;
    showConfirmation({
        title: "Delete Resource",
        message: "Are you sure you want to permanently remove this resource?",
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('resources').delete().eq('id', res.id);
                if (error) throw error;
                showNotification("Resource removed.");
            } catch { showNotification("Failed to remove resource.", "error"); }
        }
    });
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { md: 'center' }, mb: 6 }}>
        <Box>
            <Typography variant="h2">Ministerial Library</Typography>
            <Typography variant="body1" color="text.secondary">Curated study modules and biblical resources for the congregation.</Typography>
        </Box>
        {canManage && (
            <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => activeTab === 0 ? setIsAddStudyOpen(true) : setIsAddResourceOpen(true)}>
                {activeTab === 0 ? 'Create Module' : 'Upload Resource'}
            </Button>
        )}
      </Stack>

      <Box sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Study Modules" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Resources" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>
      </Box>

      {loading && studySeries.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={32} /></Box>
      ) : (
        <Box>
            {activeTab === 0 ? (
                <Grid container spacing={3}>
                    {studySeries.map((study) => (
                        <Grid xs={12} md={6} key={study.id}>
                            <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, position: 'relative' }}>
                                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 3 }}>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
                                            <Bookmark size={20} />
                                        </Box>
                                        {canManage && (
                                            <IconButton size="small" color="error" onClick={() => handleDeleteStudy(study)}>
                                                <Trash2 size={18} />
                                            </IconButton>
                                        )}
                                    </Stack>
                                    
                                    <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>{study.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, flexGrow: 1, lineHeight: 1.6 }}>
                                        {study.subtitle}
                                    </Typography>
                                    
                                    <Box sx={{ mt: 'auto' }}>
                                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                                            <Typography variant="caption" fontWeight={700} color="text.disabled">COMPLETION</Typography>
                                            <Typography variant="caption" fontWeight={800} color="primary">{study.progress}%</Typography>
                                        </Stack>
                                        <LinearProgress variant="determinate" value={study.progress} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }} />
                                        <Button fullWidth variant="outlined" size="small" endIcon={<ChevronRight size={16}/>} onClick={() => setSelectedStudy(study)} sx={{ mt: 4 }}>
                                            View Syllabus
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {studySeries.length === 0 && !loading && (
                        <Grid xs={12}>
                            <Box sx={{ py: 10, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.disabled">No study modules found.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            ) : (
                <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                    <List disablePadding>
                        {resources.map((res, i) => (
                            <React.Fragment key={res.id}>
                                <ListItem sx={{ py: 2.5, px: 3 }}>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', borderRadius: 2 }}>
                                            <FileText size={20}/>
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={<Typography variant="body2" fontWeight={700}>{res.title}</Typography>} 
                                        secondary={<Typography variant="caption" color="text.secondary">{res.type || 'Document'} • {res.size || 'N/A'}</Typography>} 
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <IconButton size="small" onClick={() => window.open(res.link, '_blank')} color="primary"><ExternalLink size={18}/></IconButton>
                                        {canManage && <IconButton size="small" color="error" onClick={() => handleDeleteResource(res)}><Trash2 size={18}/></IconButton>}
                                    </Stack>
                                </ListItem>
                                {i < resources.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        {resources.length === 0 && !loading && (
                            <Box sx={{ py: 10, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.disabled">No resources found in the vault.</Typography>
                            </Box>
                        )}
                    </List>
                </Paper>
            )}
        </Box>
      )}

      <StudyDetailsDialog open={!!selectedStudy} onClose={() => setSelectedStudy(null)} study={selectedStudy} onUpdate={fetchData} />
      <AddResourceDialog open={isAddResourceOpen} onClose={() => setIsAddResourceOpen(false)} onResourceAdded={fetchData} />
      <AddStudyDialog open={isAddStudyOpen} onClose={() => setIsAddStudyOpen(false)} onStudyAdded={fetchData} />
    </Box>
  );
};

export default BibleStudies;
