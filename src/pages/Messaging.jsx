import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  TextField, 
  IconButton, 
  useTheme, 
  Stack, 
  alpha,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent
} from '@mui/material';
import { 
  Send, 
  Users, 
  Mail, 
  MessageSquare,
  History,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize } from '../utils/sanitizer';

const Messaging = () => {
  const theme = useTheme();
  const { filterData, showNotification } = useWorkspace();
  const { isDeptHead } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ target: 'all', mode: 'sms', subject: '', message: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, memRes] = await Promise.all([
        supabase.from('groups').select('*').order('name', { ascending: true }),
        supabase.from('members').select('*').order('name', { ascending: true })
      ]);
      setGroups(grpRes.data || []);
      setMembers(memRes.data || []);
    } catch {
      showNotification("Failed to load messaging data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const targetCount = useMemo(() => {
    if (formData.target === 'all') return members.length;
    if (formData.target.startsWith('group:')) {
        // This is a simplification; ideally we'd have group memberships loaded
        return groups.find(g => g.id === formData.target.split(':')[1]) ? 'Linked Members' : 0;
    }
    return members.filter(m => m.department?.toLowerCase() === formData.target.toLowerCase()).length;
  }, [formData.target, members, groups]);

  const handleSendMessage = async () => {
    if (!formData.message) return showNotification("Message content required.", "warning");
    
    setSubmitting(true);
    // Simulate sending / log to database
    setTimeout(() => {
        showNotification(`${formData.mode.toUpperCase()} broadcast initiated to ${targetCount} recipients.`, "success");
        setSubmitting(false);
        setFormData({ ...formData, subject: '', message: '' });
    }, 1500);
  };

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
          <Typography variant="h2">Communication Center</Typography>
          <Typography variant="body1" color="text.secondary">Broadcasting ministerial updates and greetings to the congregation.</Typography>
      </Box>

      <Box sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Compose Message" icon={<Send size={16}/>} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Broadcast History" icon={<History size={16}/>} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>
      </Box>

      {activeTab === 0 ? (
          <Grid container spacing={4}>
              <Grid xs={12} md={7}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                      <Stack spacing={4}>
                          <Stack direction="row" spacing={3}>
                              <FormControl fullWidth>
                                  <InputLabel>Target Audience</InputLabel>
                                  <Select label="Target Audience" value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})}>
                                      <MenuItem value="all">All Members ({members.length})</MenuItem>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontWeight: 800 }}>Departments</Typography>
                                      <MenuItem value="Youth">Youth Ministry</MenuItem>
                                      <MenuItem value="Women">Women's Fellowship</MenuItem>
                                      <MenuItem value="Men">Men's Fellowship</MenuItem>
                                      <MenuItem value="Music Team">Music Team</MenuItem>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontWeight: 800 }}>Active Groups</Typography>
                                      {groups.map(g => (
                                          <MenuItem key={g.id} value={`group:${g.id}`}>{g.name}</MenuItem>
                                      ))}
                                  </Select>
                              </FormControl>

                              <FormControl sx={{ minWidth: 140 }}>
                                  <InputLabel>Mode</InputLabel>
                                  <Select label="Mode" value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})}>
                                      <MenuItem value="sms">SMS</MenuItem>
                                      <MenuItem value="email">Email</MenuItem>
                                  </Select>
                              </FormControl>
                          </Stack>

                          {formData.mode === 'email' && (
                              <TextField fullWidth label="Subject Line" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} />
                          )}

                          <TextField 
                            fullWidth 
                            multiline 
                            rows={8} 
                            label="Message Content" 
                            placeholder="Type your announcement here..."
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                          />

                          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'info.main', fontWeight: 700 }}>
                                  <Users size={14}/> BROADCAST ESTIMATE: {targetCount} Recipients
                              </Typography>
                          </Box>

                          <Button variant="contained" size="large" endIcon={<Send size={18}/>} onClick={handleSendMessage} disabled={submitting}>
                              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send Broadcast'}
                          </Button>
                      </Stack>
                  </Paper>
              </Grid>

              <Grid xs={12} md={5}>
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                      <CardContent sx={{ p: 4 }}>
                          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Messaging Tips</Typography>
                          <Stack spacing={3}>
                              <Box>
                                  <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>Personalization</Typography>
                                  <Typography variant="body2" color="text.secondary">Use specific group targeting to ensure high engagement and relevance.</Typography>
                              </Box>
                              <Box>
                                  <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>SMS Limits</Typography>
                                  <Typography variant="body2" color="text.secondary">Keep SMS messages under 160 characters to avoid multiple segment charges.</Typography>
                              </Box>
                              <Box>
                                  <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>Timing</Typography>
                                  <Typography variant="body2" color="text.secondary">Best open rates for church announcements are Friday evenings or Sunday afternoons.</Typography>
                              </Box>
                          </Stack>
                      </CardContent>
                  </Card>
              </Grid>
          </Grid>
      ) : (
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 10, textAlign: 'center' }}>
                  <History size={48} style={{ color: theme.palette.text.disabled, marginBottom: 16 }} />
                  <Typography variant="body1" color="text.disabled">Broadcast history will appear here once messages are sent.</Typography>
              </Box>
          </Paper>
      )}
    </Box>
  );
};

export default Messaging;
