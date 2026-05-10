import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  List, 
  ListItem,
  ListItemButton, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Divider, 
  useTheme, 
  Chip,
  CircularProgress,
  Dialog,
  alpha,
  Paper,
  Stack,
  IconButton
} from '@mui/material';
import { 
  CheckCircle, 
  X,
  Trash2,
  Calendar,
  ChevronRight,
  UserCheck
} from 'lucide-react';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';

const Attendance = () => {
  const theme = useTheme();
  const { filterData, showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const canManage = isDeptHead;

  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedAttendees, setSelectedAttendees] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        supabase.from('members').select('*').order('name', { ascending: true }).limit(2000),
        supabase.from('attendance').select('*').order('date', { ascending: false }).limit(100)
      ]);

      setMembers(mRes.data || []);
      setRecords(aRes.data || []);
    } catch {
      showNotification("Data sync failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect

    const mChannel = supabase.channel('members-attendance').on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, fetchData).subscribe();
    const aChannel = supabase.channel('attendance-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData).subscribe();
    return () => {
      supabase.removeChannel(mChannel);
      supabase.removeChannel(aChannel);
    };
  }, [fetchData]);

  const filteredMembers = useMemo(() => filterData(members), [members, filterData]);
  const filteredRecords = useMemo(() => filterData(records), [records, filterData]);

  const handleToggle = (id) => {
    if (!canManage) return;
    const newSet = new Set(selectedAttendees);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedAttendees(newSet);
  };

  const handleSave = async () => {
    if (!canManage) return;
    if (selectedAttendees.size === 0) return showNotification("No members selected.", "warning");
    setSubmitting(true);
    try {
      const attendees = members.filter(m => selectedAttendees.has(m.id));
      const { error } = await supabase.from('attendance').insert([{
        date: new Date(selectedDate).toISOString(),
        attendees
      }]);
      
      if (error) throw error;
      setSelectedAttendees(new Set());
      showNotification("Attendance recorded successfully.");
    } catch {
      showNotification("Save failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (!canManage) return;
    showConfirmation({
        title: "Delete Record",
        message: "Are you sure you want to delete this attendance record?",
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('attendance').delete().eq('id', id);
                if (error) throw error;
                setViewingRecord(null); 
                showNotification("Record deleted.");
            } catch { showNotification("Deletion failed.", "error"); }
        }
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
          <Typography variant="h2">Attendance Tracking</Typography>
          <Typography variant="body1" color="text.secondary">Record and manage attendance for services and meetings.</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Record Attendance */}
        <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Calendar size={18} color={theme.palette.primary.main} />
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            disabled={!canManage}
                            style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '1rem', color: theme.palette.text.primary, outline: 'none', cursor: 'pointer' }} 
                        />
                    </Stack>
                    <Chip 
                        label={`${selectedAttendees.size} Selected`} 
                        size="small" 
                        color="primary"
                        sx={{ fontWeight: 700, borderRadius: 1 }} 
                    />
                </Box>
                
                <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                    {loading && members.length === 0 ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box> : (
                        <List disablePadding>
                            {filteredMembers.map((m, i) => {
                                const isSelected = selectedAttendees.has(m.id);
                                return (
                                    <React.Fragment key={m.id}>
                                        <ListItemButton disabled={!canManage} onClick={() => handleToggle(m.id)} sx={{ py: 1.5, px: 3 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ width: 40, height: 40, bgcolor: isSelected ? 'primary.main' : alpha(theme.palette.text.primary, 0.05), color: isSelected ? '#fff' : 'text.secondary', fontWeight: 700, fontSize: '0.85rem' }}>
                                                    {m.name?.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={<Typography variant="body2" fontWeight={isSelected ? 700 : 600}>{m.name}</Typography>} 
                                                secondary={<Typography variant="caption" color="text.secondary">{m.department || 'General'}</Typography>} 
                                            />
                                            {isSelected && <CheckCircle size={20} color={theme.palette.primary.main} />}
                                        </ListItemButton>
                                        {i < filteredMembers.length - 1 && <Divider sx={{ mx: 2 }} />}
                                    </React.Fragment>
                                )
                            })}
                        </List>
                    )}
                </Box>
                
                {canManage && (
                    <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'right' }}>
                        <Button variant="contained" disabled={submitting} onClick={handleSave} startIcon={<UserCheck size={18} />}>
                            Save Attendance
                        </Button>
                    </Box>
                )}
            </Paper>
        </Grid>

        {/* History */}
        <Grid item xs={12} lg={4}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Recent Records</Typography>
            <Stack spacing={2}>
                {filteredRecords.length === 0 && !loading && (
                    <Typography variant="body2" color="text.disabled">No records found.</Typography>
                )}
                {filteredRecords.slice(0, 10).map((r) => (
                    <Paper 
                        key={r.id}
                        onClick={() => setViewingRecord(r)}
                        sx={{ 
                            p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, cursor: 'pointer',
                            transition: 'all 0.2s ease', '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.01) }
                        }}
                    >
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', mb: 0.5 }}>{format(safeParseDate(r.date), 'MMMM dd, yyyy')}</Typography>
                                <Typography variant="body2" fontWeight={700}>{r.attendees?.length || 0} Members Present</Typography>
                            </Box>
                            <ChevronRight size={18} color={theme.palette.text.disabled} />
                        </Stack>
                    </Paper>
                ))}
            </Stack>
        </Grid>
      </Grid>

      {/* Viewing Dialog */}
      <Dialog open={!!viewingRecord} onClose={() => setViewingRecord(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 3 } }}>
          {viewingRecord && (
              <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={800}>{format(safeParseDate(viewingRecord.date), 'MMM dd, yyyy')}</Typography>
                        <Typography variant="caption" color="text.secondary">{viewingRecord.attendees?.length || 0} Members Present</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setViewingRecord(null)}><X size={20}/></IconButton>
                  </Stack>
                  
                  <List sx={{ mb: 4, maxHeight: 400, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                      {viewingRecord.attendees?.map((a, i) => (
                          <ListItem key={i} divider={i < viewingRecord.attendees.length - 1} sx={{ py: 1.5, px: 2 }}>
                              <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                          </ListItem>
                      ))}
                  </List>
                  
                  {canManage && (
                    <Button fullWidth variant="outlined" color="error" startIcon={<Trash2 size={16}/>} onClick={() => handleDelete(viewingRecord.id)}>
                        Delete Record
                    </Button>
                  )}
              </Box>
          )}
      </Dialog>
    </Box>
  );
};

export default Attendance;
