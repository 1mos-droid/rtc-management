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
  Dialog,
  CircularProgress,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import { 
  Plus, 
  MessageSquare,
  Lock,
  Globe,
  CheckCircle2,
  Clock,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize } from '../utils/sanitizer';
import { safeParseDate } from '../utils/dateUtils';

const PrayerRequests = () => {
  const theme = useTheme();
  const { filterData, showNotification } = useWorkspace();
  const { user, isAdmin, isDeptHead } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ request: '', is_private: false, member_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, memRes] = await Promise.all([
        supabase.from('prayer_requests').select('*, members(name)').order('created_at', { ascending: false }),
        supabase.from('members').select('id, name').order('name', { ascending: true })
      ]);
      
      setRequests(reqRes.data || []);
      setMembers(memRes.data || []);
      
      // Auto-select current user's member profile if it exists
      if (user?.email) {
        const myMember = memRes.data?.find(m => m.email === user.email);
        if (myMember) setFormData(prev => ({ ...prev, member_id: myMember.id }));
      }
    } catch {
      showNotification("Failed to load prayer requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification, user]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('prayer-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_requests' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const filteredRequests = useMemo(() => filterData(requests), [requests, filterData]);

  const handleSubmit = async () => {
    if (!formData.request) return showNotification("Please enter your request.", "warning");
    if (!formData.member_id && !isAdmin) return showNotification("Member profile required.", "warning");

    setSubmitting(true);
    try {
      const { error } = await supabase.from('prayer_requests').insert([{
        request: sanitize(formData.request),
        is_private: formData.is_private,
        member_id: formData.member_id || null,
        status: 'pending'
      }]);
      
      if (error) throw error;
      showNotification("Prayer request submitted. We are praying with you.", "success");
      setOpenAddDialog(false);
      setFormData({ ...formData, request: '', is_private: false });
    } catch {
      showNotification("Submission failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!isAdmin && !isDeptHead) return;
    try {
      const { error } = await supabase.from('prayer_requests').update({ status }).eq('id', id);
      if (error) throw error;
      showNotification(`Status updated to ${status}.`);
    } catch {
      showNotification("Update failed.", "error");
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 6 }}>
        <Box>
            <Typography variant="h2">Prayer Requests</Typography>
            <Typography variant="body1" color="text.secondary">Share your burdens and testimonies with the pastoral team.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => setOpenAddDialog(true)}>Submit Request</Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid xs={12} md={8}>
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" fontWeight={800}>Active Petitions</Typography>
                </Box>
                
                {loading && requests.length === 0 ? (
                    <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress size={32} /></Box>
                ) : (
                    <List disablePadding>
                        {filteredRequests.map((req, i) => (
                            <React.Fragment key={req.id}>
                                <ListItem sx={{ py: 4, px: 3, alignItems: 'flex-start' }}>
                                    <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                        <MessageSquare size={20} />
                                    </Avatar>
                                    <ListItemText 
                                        primary={
                                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={800}>{req.members?.name || 'Anonymous'}</Typography>
                                                <Chip 
                                                    label={req.status} 
                                                    size="small" 
                                                    variant="soft"
                                                    color={req.status === 'answered' ? 'success' : req.status === 'praying' ? 'info' : 'warning'}
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}
                                                />
                                                {req.is_private ? <Lock size={12} style={{ color: theme.palette.text.disabled }} /> : <Globe size={12} style={{ color: theme.palette.text.disabled }} />}
                                            </Stack>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body1" sx={{ color: 'text.primary', mb: 2, fontStyle: 'italic' }}>"{req.request}"</Typography>
                                                <Typography variant="caption" color="text.disabled">{format(safeParseDate(req.created_at), 'MMMM dd, yyyy • hh:mm a')}</Typography>
                                            </Box>
                                        }
                                    />
                                    {(isAdmin || isDeptHead) && (
                                        <Stack direction="row" spacing={1}>
                                            <IconButton size="small" color="info" onClick={() => handleUpdateStatus(req.id, 'praying')} title="Mark as Praying"><Clock size={18}/></IconButton>
                                            <IconButton size="small" color="success" onClick={() => handleUpdateStatus(req.id, 'answered')} title="Mark as Answered"><CheckCircle2 size={18}/></IconButton>
                                        </Stack>
                                    )}
                                </ListItem>
                                {i < filteredRequests.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        {filteredRequests.length === 0 && (
                            <Box sx={{ py: 10, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.disabled">No prayer requests at this time.</Typography>
                            </Box>
                        )}
                    </List>
                )}
            </Paper>
        </Grid>

        <Grid xs={12} md={4}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Pastoral Note</Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary', mb: 3 }}>
                        "Therefore I tell you, whatever you ask for in prayer, believe that you have received it, and it will be yours." — Mark 11:24
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                        Your requests are handled with the utmost confidentiality by our intercessory team. Private requests are only visible to the pastoral staff.
                    </Typography>
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Submit Prayer Request</Typography>
          <Stack spacing={3}>
              <TextField 
                fullWidth 
                multiline 
                rows={4} 
                label="How can we pray for you?" 
                placeholder="Type your request here..."
                value={formData.request}
                onChange={(e) => setFormData({...formData, request: e.target.value})}
              />
              <FormControlLabel 
                control={<Switch checked={formData.is_private} onChange={(e) => setFormData({...formData, is_private: e.target.checked})} />}
                label={<Typography variant="body2" fontWeight={600}>Private (Pastors only)</Typography>}
              />
          </Stack>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handleSubmit} startIcon={<Send size={18}/>}>Submit</Button>
          </Box>
      </Dialog>
    </Box>
  );
};

export default PrayerRequests;
