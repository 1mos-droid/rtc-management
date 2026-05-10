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
  Dialog,
  Card,
  CardContent
} from '@mui/material';
import { 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit,
  Video,
  Calendar as CalendarIcon
} from 'lucide-react';
import EditEventDialog from '../components/EditEventDialog';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';

const Events = () => {
  const theme = useTheme();
  const { filterData, isBranchRestricted, userBranch, showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const canManage = isDeptHead;
  
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
      showNotification("Failed to sync calendar.", "error");
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
    if (!formData.name || !formData.date) return showNotification("Name and date are required.", "warning");
    setSubmitting(true);
    try {
      const { name, date, time, location, isOnline } = formData;
      
      const { error } = await supabase.from('events').insert([{
        name,
        time,
        location,
        is_online: isOnline,
        date: new Date(date).toISOString()
      }]);
      
      if (error) throw error;

      setFormData({ name: '', date: '', time: '', location: '', isOnline: false });
      setOpenCreator(false);
      showNotification("Event scheduled successfully.", "success");
    } catch (error) { // eslint-disable-line no-unused-vars
       showNotification("Failed to schedule event.", "error"); 
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
      showNotification("Failed to update event.", "error");
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
                showNotification("Event removed.");
            } catch (err) { // eslint-disable-line no-unused-vars
               showNotification("Failed to remove event.", "error"); 
            }
        }
    });
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { md: 'center' }, mb: 6 }}>
        <Box>
          <Typography variant="h2">Calendar of Service</Typography>
          <Typography variant="body1" color="text.secondary">Upcoming services, fellowships, and community activities.</Typography>
        </Box>
        {canManage && (
            <Button 
                variant="contained" 
                startIcon={<Plus size={18} />} 
                onClick={() => setOpenCreator(true)}
            >
                Schedule Event
            </Button>
        )}
      </Stack>

      {loading && events.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={32} /></Box>
      ) : (
          <Grid container spacing={3}>
            {filteredEvents.length === 0 ? (
                <Grid item xs={12}>
                    <Box sx={{ py: 10, textAlign: 'center', border: `2px dashed ${theme.palette.divider}`, borderRadius: 3 }}>
                        <Typography variant="body1" color="text.disabled">No upcoming events scheduled.</Typography>
                    </Box>
                </Grid>
            ) : filteredEvents.map((event) => (
                <Grid item xs={12} md={6} key={event.id}>
                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.01) }, transition: 'all 0.2s ease' }}>
                        <CardContent sx={{ p: 3, display: 'flex', gap: 3 }}>
                            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                                <Typography variant="h4" fontWeight={800} color="primary" sx={{ lineHeight: 1 }}>{format(safeParseDate(event.date), 'dd')}</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>{format(safeParseDate(event.date), 'MMM')}</Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1" fontWeight={700} sx={{ mb: 1 }}>{event.name}</Typography>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <Clock size={14} /> <Typography variant="caption" fontWeight={600}>{event.time || 'All Day'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        {event.is_online ? <Video size={14}/> : <MapPin size={14} />} 
                                        <Typography variant="caption" fontWeight={600} noWrap>{event.location || 'Sanctuary'}</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                            {canManage && (
                                <Stack spacing={1}>
                                    <IconButton size="small" onClick={() => setEditingEvent(event)}><Edit size={16}/></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(event.id)}><Trash2 size={16}/></IconButton>
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
          </Grid>
      )}

      {/* Creator Dialog */}
      <Dialog open={openCreator} onClose={() => setOpenCreator(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 3 } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Schedule New Event</Typography>
          
          <form onSubmit={handleCreate}>
              <Stack spacing={3}>
                  <TextField fullWidth label="Event Title" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  <Grid container spacing={2}>
                      <Grid item xs={6}>
                          <TextField fullWidth type="date" label="Date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} />
                      </Grid>
                      <Grid item xs={6}>
                          <TextField fullWidth type="time" label="Time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} InputLabelProps={{ shrink: true }} />
                      </Grid>
                  </Grid>
                  <TextField fullWidth label="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  <FormControlLabel control={<Switch checked={formData.isOnline} onChange={(e) => setFormData({...formData, isOnline: e.target.checked})} />} label="This is an online event" />
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Button fullWidth variant="outlined" onClick={() => setOpenCreator(false)}>Cancel</Button>
                      <Button fullWidth variant="contained" type="submit" disabled={submitting}>
                          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Schedule'}
                      </Button>
                  </Box>
              </Stack>
          </form>
      </Dialog>

      <EditEventDialog open={!!editingEvent} onClose={() => setEditingEvent(null)} event={editingEvent} onEditEvent={handleEdit} />
    </Box>
  );
};

export default Events;
