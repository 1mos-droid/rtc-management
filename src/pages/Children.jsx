import React, { useState, useEffect, useCallback } from 'react';
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
  ShieldCheck, 
  Baby, 
  User,
  Search,
  CheckCircle2,
  LogOut,
  Ticket
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize } from '../utils/sanitizer';

const Children = () => {
  const theme = useTheme();
  const { filterData, showNotification } = useWorkspace();
  const { isDeptHead } = useAuth();
  
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCheckinDialog, setOpenCheckinDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({ child_name: '', parent_name: '', parent_phone: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('child_checkins')
        .select('*')
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      setCheckins(data || []);
    } catch {
      showNotification("Failed to load children records.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('child-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'child_checkins' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const handleCheckin = async () => {
    if (!formData.child_name || !formData.parent_name || !formData.parent_phone) {
      return showNotification("All fields required.", "warning");
    }

    setSubmitting(true);
    try {
      const tag_number = Math.floor(1000 + Math.random() * 9000).toString();
      const { error } = await supabase.from('child_checkins').insert([{
        child_name: sanitize(formData.child_name),
        parent_name: sanitize(formData.parent_name),
        parent_phone: sanitize(formData.parent_phone),
        tag_number,
        status: 'checked_in'
      }]);
      
      if (error) throw error;
      showNotification(`Check-in successful. Tag: ${tag_number}`, "success");
      setOpenCheckinDialog(false);
      setFormData({ child_name: '', parent_name: '', parent_phone: '' });
    } catch {
      showNotification("Check-in failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (id) => {
    try {
      const { error } = await supabase
        .from('child_checkins')
        .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      showNotification("Check-out verified successfully.");
    } catch {
      showNotification("Check-out failed.", "error");
    }
  };

  const filteredCheckins = checkins.filter(c => 
    c.child_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.tag_number.includes(searchTerm)
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 6 }}>
        <Box>
            <Typography variant="h2">Children's Ministry</Typography>
            <Typography variant="body1" color="text.secondary">Secure child check-in and safety management system.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => setOpenCheckinDialog(true)}>New Check-in</Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Search size={20} style={{ color: theme.palette.text.disabled, marginLeft: 8 }} />
        <TextField 
            fullWidth 
            size="small" 
            placeholder="Search by child name or tag number..." 
            variant="standard"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{ input: { disableUnderline: true, sx: { fontSize: '0.9rem', fontWeight: 600 } } }} 
        />
      </Paper>

      <Grid container spacing={4}>
        <Grid xs={12} md={8}>
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={800}>Live Roster ({checkins.length})</Typography>
                    <Chip label="Secure Environment" size="small" color="success" icon={<ShieldCheck size={14}/>} sx={{ fontWeight: 800, borderRadius: 1 }} />
                </Box>
                
                {loading && checkins.length === 0 ? (
                    <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress size={32} /></Box>
                ) : (
                    <List disablePadding>
                        {filteredCheckins.map((item, i) => (
                            <React.Fragment key={item.id}>
                                <ListItem sx={{ py: 3, px: 3 }}>
                                    <Avatar sx={{ mr: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                                        <Baby size={24} />
                                    </Avatar>
                                    <ListItemText 
                                        primary={<Typography variant="subtitle1" fontWeight={800}>{item.child_name}</Typography>}
                                        secondary={
                                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <User size={12}/> Parent: {item.parent_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled">
                                                    In at {format(new Date(item.checked_in_at), 'hh:mm a')}
                                                </Typography>
                                            </Stack>
                                        }
                                    />
                                    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                                        <Box sx={{ textAlign: 'center', px: 2, py: 1, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                                            <Typography variant="caption" fontWeight={800} color="warning.main" sx={{ display: 'block', mb: -0.5 }}>TAG</Typography>
                                            <Typography variant="h6" fontWeight={900} color="warning.main">#{item.tag_number}</Typography>
                                        </Box>
                                        <Button variant="outlined" color="error" size="small" startIcon={<LogOut size={16}/>} onClick={() => handleCheckout(item.id)}>
                                            Check-out
                                        </Button>
                                    </Stack>
                                </ListItem>
                                {i < filteredCheckins.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        {filteredCheckins.length === 0 && (
                            <Box sx={{ py: 10, textAlign: 'center' }}>
                                <Typography variant="body1" color="text.disabled">No children checked in.</Typography>
                            </Box>
                        )}
                    </List>
                )}
            </Paper>
        </Grid>

        <Grid xs={12} md={4}>
            <Stack spacing={3}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'success.main', color: '#fff' }}><Ticket size={20}/></Box>
                            <Typography variant="h6" fontWeight={800}>Tag Verification</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                            Always verify the parent's physical or digital tag matches the child's recorded tag number before releasing any child.
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </Grid>
      </Grid>

      <Dialog open={openCheckinDialog} onClose={() => setOpenCheckinDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Child Check-in</Typography>
          <Stack spacing={3}>
              <TextField fullWidth label="Child's Full Name" value={formData.child_name} onChange={(e) => setFormData({...formData, child_name: e.target.value})} />
              <TextField fullWidth label="Parent/Guardian Name" value={formData.parent_name} onChange={(e) => setFormData({...formData, parent_name: e.target.value})} />
              <TextField fullWidth label="Parent Phone Number" value={formData.parent_phone} onChange={(e) => setFormData({...formData, parent_phone: e.target.value})} />
          </Stack>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenCheckinDialog(false)}>Cancel</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handleCheckin} startIcon={<CheckCircle2 size={18}/>}>Confirm Check-in</Button>
          </Box>
      </Dialog>
    </Box>
  );
};

export default Children;
