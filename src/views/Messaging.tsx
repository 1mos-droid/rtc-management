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
  CardContent,
  Switch
} from '@mui/material';
import { 
  Send, 
  Users, 
  Mail, 
  MessageSquare,
  History,
  Filter,
  Search,
  Clock
} from 'lucide-react';

import { supabase } from '../supabase';
import { sanitize } from '../utils/sanitizer';

const Messaging = () => {
  const theme = useTheme();
  const { showNotification } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState(0);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Load initial form data draft from localStorage
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rtci_message_draft');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // Ignore
        }
      }
    }
    return { target: 'all', mode: 'sms', subject: '', message: '' };
  });

  // Load initial outbox from localStorage
  const [outbox, setOutbox] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rtci_message_outbox');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // Ignore
        }
      }
    }
    return [];
  });

  // Auto-save form data draft as user types
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rtci_message_draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Sync outbox to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rtci_message_outbox', JSON.stringify(outbox));
    }
  }, [outbox]);

  const fetchData = useCallback(async () => {
    try {
      const [grpRes, memRes] = await Promise.all([
        supabase.from('groups').select('*').order('name', { ascending: true }),
        supabase.from('members').select('*').order('name', { ascending: true })
      ]);
      setGroups(grpRes.data || []);
      setMembers(memRes.data || []);
    } catch {
      showNotification("Failed to load messaging data.", "error");
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const targetCount = useMemo(() => {
    if (formData.target === 'all') return members.length;
    if (formData.target.startsWith('group:')) {
        return groups.find(g => g.id === formData.target.split(':')[1]) ? 'Linked Members' : 0;
    }
    return members.filter(m => m.department?.toLowerCase() === formData.target.toLowerCase()).length;
  }, [formData.target, members, groups]);

  const handleSendMessage = async () => {
    if (!formData.message) return showNotification("Message content required.", "warning");
    
    // Check if simulateOffline or navigator.onLine indicates offline
    const isOffline = simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine);
    
    if (isOffline) {
      const outboxItem = {
        id: Date.now().toString(),
        target: formData.target,
        mode: formData.mode,
        subject: formData.subject,
        message: formData.message,
        timestamp: new Date().toISOString(),
        recipients: targetCount
      };
      setOutbox(prev => [outboxItem, ...prev]);
      setFormData({ ...formData, subject: '', message: '' });
      showNotification("Broadcaster offline. Message queued in Sanctuary Outbox.", "warning");
      return;
    }

    setSubmitting(true);
    
    const sanitizedSubject = sanitize(formData.subject);
    const sanitizedMessage = sanitize(formData.message);
    
    // Simulate sending / log to database using sanitized content
    setTimeout(() => {
        showNotification(`${formData.mode.toUpperCase()} broadcast initiated to ${targetCount} recipients.`, "success");
        setSubmitting(false);
        setFormData({ ...formData, subject: '', message: '' });
    }, 1500);
  };

  const handleRetryOutbox = (item) => {
    const isOffline = simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine);
    
    if (isOffline) {
      showNotification("Still offline. Sanctuary connection not restored yet.", "error");
      return;
    }

    showNotification(`Retrying message transmission from Outbox...`, "info");
    
    setTimeout(() => {
      showNotification(`${item.mode.toUpperCase()} broadcast from outbox delivered successfully!`, "success");
      setOutbox(prev => prev.filter(x => x.id !== item.id));
    }, 1200);
  };

  const handleRemoveFromOutbox = (id) => {
    setOutbox(prev => prev.filter(x => x.id !== id));
    showNotification("Message removed from Outbox.", "info");
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
                  <Stack spacing={4}>
                      {/* Sanctuary Connection / Offline Simulator Card */}
                      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.01) }}>
                          <CardContent sx={{ p: 4 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Box>
                                      <Typography variant="subtitle1" fontWeight={800}>Sanctuary Drop (Offline Simulation)</Typography>
                                      <Typography variant="body2" color="text.secondary">Simulate network disconnection to test the offline Ministerial Outbox.</Typography>
                                  </Box>
                                  <Switch 
                                      checked={simulateOffline}
                                      onChange={(e) => setSimulateOffline(e.target.checked)}
                                      color="warning"
                                  />
                              </Stack>
                          </CardContent>
                      </Card>

                      {/* Ministerial Outbox Card */}
                      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                          <CardContent sx={{ p: 4 }}>
                              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                  <Clock size={20} style={{ color: theme.palette.primary.main }} />
                                  <Typography variant="h6" fontWeight={800}>Ministerial Outbox</Typography>
                                  {outbox.length > 0 && (
                                      <Chip size="small" label={`${outbox.length} pending`} color="warning" sx={{ fontWeight: 700 }} />
                                  )}
                              </Stack>
                              
                              {outbox.length === 0 ? (
                                  <Box sx={{ py: 4, textAlign: 'center', bgcolor: alpha(theme.palette.text.disabled, 0.05), borderRadius: 2 }}>
                                      <Typography variant="body2" color="text.secondary">All broadcasts transmitted successfully.</Typography>
                                  </Box>
                              ) : (
                                  <Stack spacing={2} divider={<Divider />}>
                                      {outbox.map((item) => (
                                          <Box key={item.id} sx={{ pt: item.id === outbox[0].id ? 0 : 2 }}>
                                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                                                  <Box>
                                                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'warning.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                          Pending {item.mode} ({item.recipients} rec.)
                                                      </Typography>
                                                      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 0.5 }}>
                                                          {item.subject || '(No Subject)'}
                                                      </Typography>
                                                  </Box>
                                                  <Typography variant="caption" color="text.secondary">
                                                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                  </Typography>
                                              </Stack>
                                              <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                                                  {item.message}
                                              </Typography>
                                              <Stack direction="row" spacing={2}>
                                                  <Button 
                                                      variant="outlined" 
                                                      size="small" 
                                                      color="primary" 
                                                      startIcon={<Send size={14} />}
                                                      onClick={() => handleRetryOutbox(item)}
                                                      sx={{ textTransform: 'none' }}
                                                  >
                                                      Retry Send
                                                  </Button>
                                                  <Button 
                                                      variant="text" 
                                                      size="small" 
                                                      color="error" 
                                                      onClick={() => handleRemoveFromOutbox(item.id)}
                                                      sx={{ textTransform: 'none' }}
                                                  >
                                                      Remove
                                                  </Button>
                                              </Stack>
                                          </Box>
                                      ))}
                                  </Stack>
                              )}
                          </CardContent>
                      </Card>

                      {/* Messaging Tips Card */}
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
                  </Stack>
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
