import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
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
  CircularProgress,
  alpha,
  Stack,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Dialog
} from '@mui/material';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit,
  Video
} from 'lucide-react';
import EditEventDialog from '../components/EditEventDialog';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';

const Events = () => {
  const theme = useTheme();
  const { filterData, isBranchRestricted, userBranch, showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead, user, effectiveRole, ROLES } = useAuth();
  const canManage = isDeptHead; // Includes Admin and Developer
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [openCreator, setOpenCreator] = useState(false);

  const [formData, setFormData] = useState({ name: '', date: '', time: '', location: isBranchRestricted ? `${userBranch} Sanctuary` : '', isOnline: false });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(500);
      
      if (error) throw error;

      const now = new Date();
      now.setHours(0,0,0,0);
      const upcoming = (data || []).filter(e => {
        if (!e.date) return false;
        const d = safeParseDate(e.date);
        d.setHours(23, 59, 59);
        return d >= now;
      });
      setEvents(upcoming);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Calendar sync failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchEvents(); // eslint-disable-line react-hooks/set-state-in-effect
    const channel = supabase.channel('events-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => filterData(events), [events, filterData]);

  const handleCreate = async (e) => {
    if (!canManage) return;
    e.preventDefault();
    if (!formData.name || !formData.date) return showNotification("Please provide at least a name and date.", "warning");
    setSubmitting(true);
    try {
      // If user is Dept Head (and not Admin/Dev), assign their department
      const eventDepartment = (effectiveRole === ROLES.DEPARTMENT_HEAD) ? user.department : null;
      
      const { error } = await supabase.from('events').insert([{
        ...formData,
        date: new Date(formData.date).toISOString(),
        department: eventDepartment
      }]);
      
      if (error) throw error;

      setFormData({ name: '', date: '', time: '', location: '', isOnline: false });
      setOpenCreator(false);
      showNotification("Event published to the calendar.", "success");
    } catch (error) { // eslint-disable-line no-unused-vars
       showNotification("Publication failed.", "error"); 
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (id, data) => {
    if (!canManage) return;
    try {
      const { error } = await supabase.from('events').update(data).eq('id', id);
      if (error) throw error;
      showNotification("Event updated successfully.", "success");
      setEditingEvent(null);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Update failed.", "error");
    }
  };

  const handleDelete = (id) => {
    if (!canManage) return;
    showConfirmation({
        title: "Cancel Event",
        message: "Are you sure you want to remove this event from the calendar?",
        onConfirm: async () => {
            try {
                const { error } = await supabase.from('events').delete().eq('id', id);
                if (error) throw error;
                showNotification("Event cancelled.");
            } catch (err) { // eslint-disable-line no-unused-vars
               showNotification("Operation failed.", "error"); 
            }
        }
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: "space-between" }} spacing={3} sx={{ alignItems: "flex-end", mb: { xs: 4, md: 6 } }}>
        <Box>
          <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>CHURCH AGENDA</Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, mt: 1, fontSize: { xs: '2rem', md: '3rem' } }}>Calendar of Service</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 600, fontSize: '1rem' }}>
             Upcoming services, fellowships, and community engagement activities at Redeem Transformation Chapel.
          </Typography>
        </Box>
        {canManage && (
            <Button 
                variant="contained" 
                size="small"
                startIcon={<Plus size={18} />} 
                onClick={() => setOpenCreator(true)}
                sx={{ px: 4 }}
            >
                Schedule Event
            </Button>
        )}
      </Stack>

      <Grid container spacing={3}>
        {loading && events.length === 0 ? <Grid size={{ xs: 12 }}><CircularProgress /></Grid> : filteredEvents.length === 0 ? (
            <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderRadius: 0 }}>
                    <Typography variant="h5" color="text.disabled" sx={{ fontFamily: 'Merriweather', fontStyle: 'italic' }}>The calendar is currently clear.</Typography>
                </Paper>
            </Grid>
        ) : filteredEvents.map((event) => (
            <Grid size={{ xs: 12, md: 6 }} key={event.id}>
                <Paper elevation={0} sx={{ 
                    p: { xs: 2.5, md: 3 }, borderRadius: 0, border: `1px solid ${theme.palette.divider}`,
                    display: 'flex', gap: { xs: 2, md: 3 }, transition: 'all 0.3s ease',
                    '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.01) }
                }}>
                    <Box sx={{ textAlign: 'center', minWidth: { xs: 60, md: 80 } }}>
                        <Typography variant="h3" fontWeight={900} color="primary" sx={{ lineHeight: 1, fontSize: { xs: '1.5rem', md: '2.5rem' } }}>{format(safeParseDate(event.date), 'dd')}</Typography>
                        <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.6rem' }}>{format(safeParseDate(event.date), 'MMM')}</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, fontSize: '1.1rem' }}>{event.name}</Typography>
                        <Stack spacing={0.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                <Clock size={12} /> <Typography variant="caption" fontWeight={700}>{event.time || 'All Day'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                {event.isOnline ? <Video size={12}/> : <MapPin size={12} />} 
                                <Typography variant="caption" fontWeight={700} noWrap>{event.location}</Typography>
                            </Box>
                        </Stack>
                    </Box>
                    {canManage && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <IconButton size="small" onClick={() => setEditingEvent(event)}><Edit size={16}/></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}><Trash2 size={16}/></IconButton>
                        </Box>
                    )}
                </Paper>
            </Grid>
        ))}
      </Grid>

      {/* Creator Dialog */}
      <Dialog open={openCreator} onClose={() => setOpenCreator(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 0, p: 4 } } }}>
          <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>NEW SERVICE</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, mt: 1, mb: 4 }}>Schedule Event</Typography>
          
          <Stack spacing={3}>
              <TextField fullWidth label="Event Title" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} variant="outlined" />
              <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                      <TextField fullWidth type="date" label="Date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                      <TextField fullWidth type="time" label="Time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} InputLabelProps={{ shrink: true }} />
                  </Grid>
              </Grid>
              <TextField fullWidth label="Location / Virtual Link" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              <FormControlLabel control={<Switch checked={formData.isOnline} onChange={(e) => setFormData({...formData, isOnline: e.target.checked})} />} label="Virtual Event (Online)" />
          </Stack>
          
          <Box sx={{ mt: 6, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenCreator(false)}>Discard</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handleCreate}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Publish Event'}
              </Button>
          </Box>
      </Dialog>

      <EditEventDialog open={!!editingEvent} onClose={() => setEditingEvent(null)} event={editingEvent} onEditEvent={handleEdit} />
    </Box>
  );
};

export default Events;
