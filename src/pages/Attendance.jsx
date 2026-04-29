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
  Stack
} from '@mui/material';
import { 
  CheckCircle, 
  History, 
  X,
  Trash2,
  Calendar,
  ChevronRight,
  Leaf,
  Flower2
} from 'lucide-react';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';

const Attendance = () => {
  const theme = useTheme();
  const { filterData, showNotification, showConfirmation } = useWorkspace();
  const { isAdmin, isDeveloper, isDeptHead, user, effectiveRole, ROLES } = useAuth();
  const canManage = isAdmin || isDeveloper || isDeptHead;
  
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
      const attDepartment = (effectiveRole === ROLES.DEPARTMENT_HEAD) ? user.department : null;

      const { error } = await supabase.from('attendance').insert([{
        date: new Date(selectedDate).toISOString(),
        attendees,
        department: attDepartment
      }]);
      
      if (error) throw error;

      setSelectedAttendees(new Set());
      showNotification("Participation recorded.");
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
        message: "Remove this gathering from history?",
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('attendance').delete().eq('id', id);
                if (error) throw error;
                setViewingRecord(null); 
                showNotification("Record erased.");
            } catch { showNotification("Deletion failed.", "error"); }
        }
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 5, md: 8 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                <Flower2 size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'secondary.main' }}>SERVICE PARTICIPATION</Typography>
        </Stack>
        <Typography variant="h2" sx={{ fontWeight: 400, color: 'primary.main', mb: 1.5, fontSize: { xs: '2rem', md: '3.5rem' } }}>Gathering the Harvest</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, fontFamily: 'Lora', fontStyle: 'italic', fontSize: '1rem' }}>
            A sacred record of our gatherings, ensuring every soul is counted and no one is forgotten.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Mark Attendance */}
        <Grid size={{ xs: 12, lg: 8 }}>
            <Paper elevation={0} sx={{ p: 0, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.05)' }}>
                <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: alpha(theme.palette.primary.main, 0.02), borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Calendar size={18} color={theme.palette.primary.main} />
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            disabled={!canManage}
                            style={{ border: 'none', background: 'transparent', fontFamily: 'DM Serif Display', fontWeight: 400, fontSize: '1.2rem', color: theme.palette.text.primary, outline: 'none' }} 
                        />
                    </Stack>
                    <Chip label={`${selectedAttendees.size} GATHERED`} size="small" sx={{ fontWeight: 900, letterSpacing: 1, bgcolor: 'primary.main', color: '#fff', fontSize: '0.6rem' }} />
                </Box>
                
                <Box sx={{ p: 0, maxHeight: 500, overflowY: 'auto' }}>
                    {loading && members.length === 0 ? <Box sx={{ p: 5 }}><CircularProgress /></Box> : (
                        <List disablePadding>
                            {filteredMembers.map((m, i) => {
                                const isSelected = selectedAttendees.has(m.id);
                                return (
                                    <React.Fragment key={m.id}>
                                        <ListItemButton disabled={!canManage} onClick={() => handleToggle(m.id)} sx={{ py: { xs: 1.5, md: 2 }, px: { xs: 3, md: 4 }, bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.03) : 'transparent' }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ borderRadius: 3, width: 40, height: 40, bgcolor: isSelected ? 'primary.main' : alpha(theme.palette.text.disabled, 0.05), color: isSelected ? '#fff' : 'text.disabled', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {m.name?.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={<Typography variant="body1" fontWeight={isSelected ? 800 : 600} sx={{ fontSize: '0.95rem' }}>{m.name}</Typography>} secondary={<Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ fontSize: '0.7rem' }}>{m.department || 'General'}</Typography>} />
                                            {isSelected && <CheckCircle size={18} color={theme.palette.primary.main} />}
                                        </ListItemButton>
                                        {i < filteredMembers.length - 1 && <Divider sx={{ mx: 4 }} />}
                                    </React.Fragment>
                                )
                            })}
                        </List>
                    )}
                </Box>
                
                {canManage && (
                    <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" size="small" disabled={submitting} onClick={handleSave} sx={{ px: 5, py: 1.5, letterSpacing: 2 }}>
                            Finalize Log
                        </Button>
                    </Box>
                )}
            </Paper>
        </Grid>

        {/* History Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
            <Typography variant="h5" sx={{ mb: 3, fontFamily: 'DM Serif Display' }}>Recent Archives</Typography>
            <Stack spacing={2}>
                {filteredRecords.slice(0, 8).map((r) => (
                    <div key={r.id}>
                        <Paper 
                            onClick={() => setViewingRecord(r)}
                            sx={{ 
                                p: 3, border: `1px solid ${theme.palette.divider}`, borderRadius: 4, cursor: 'pointer',
                                transition: 'all 0.3s ease', '&:hover': { borderColor: theme.palette.primary.main, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }
                            }}
                        >
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                <Box>
                                    <Typography variant="caption" fontWeight={900} color="primary" sx={{ letterSpacing: 2, fontSize: '0.6rem' }}>{format(safeParseDate(r.date), 'MMMM dd, yyyy').toUpperCase()}</Typography>
                                    <Typography variant="h6" fontWeight={400} sx={{ mt: 0.5, fontFamily: 'DM Serif Display', fontSize: '1.1rem' }}>{r.attendees?.length || 0} souls gathered</Typography>
                                </Box>
                                <ChevronRight size={18} color={theme.palette.text.disabled} />
                            </Stack>
                        </Paper>
                    </div>
                ))}
            </Stack>
        </Grid>
      </Grid>

      {/* Viewing Dialog */}
      <Dialog open={!!viewingRecord} onClose={() => setViewingRecord(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 6, p: 6 } } }}>
          {viewingRecord && (
              <Box>
                  <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>ARCHIVE DETAILS</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 400, mt: 1, mb: 6, fontFamily: 'DM Serif Display' }}>{format(safeParseDate(viewingRecord.date), 'MMM dd, yyyy')}</Typography>
                  
                  <List sx={{ mb: 6, maxHeight: 400, overflowY: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 4 }}>
                      {viewingRecord.attendees?.map((a, i) => (
                          <ListItem key={i} divider={i < viewingRecord.attendees.length - 1} sx={{ py: 2, px: 3 }}>
                              <Typography variant="body1" fontWeight={800}>{a.name}</Typography>
                          </ListItem>
                      ))}
                  </List>
                  
                  {canManage && (
                    <Button fullWidth variant="outlined" color="error" startIcon={<Trash2 size={16}/>} onClick={() => handleDelete(viewingRecord.id)}>
                        Erase Archive
                    </Button>
                  )}
              </Box>
          )}
      </Dialog>
    </Box>
  );
};

export default Attendance;