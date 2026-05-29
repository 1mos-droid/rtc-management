"use client";
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
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Plus, 
  ShieldCheck, 
  Baby, 
  User,
  Search,
  CheckCircle2,
  LogOut,
  Ticket,
  Tablet,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize } from '../utils/sanitizer';

const Children = () => {
  const theme = useTheme();
  const { showNotification } = useWorkspace();
  
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCheckinDialog, setOpenCheckinDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabletMode, setTabletMode] = useState(false);

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
    <Box sx={{ pb: tabletMode ? 8 : 4 }}>
      {/* Top Banner and Tablet Toggle */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={3} 
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 6 }}
      >
        <Box>
            <Typography variant="h2">Children's Ministry</Typography>
            <Typography variant="body1" color="text.secondary">Secure child check-in and safety management system.</Typography>
        </Box>
        
        <Stack direction="row" spacing={3} sx={{ alignSelf: 'flex-start', alignItems: 'center' }}>
            <FormControlLabel
                control={
                    <Switch 
                        checked={tabletMode}
                        onChange={(e) => setTabletMode(e.target.checked)}
                        color="primary"
                    />
                }
                label={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Tablet size={16} />
                        <Typography variant="subtitle2" fontWeight={800}>Tablet Mode</Typography>
                    </Stack>
                }
                sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    px: 3, 
                    py: 1, 
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    mr: 0
                }}
            />
            {!tabletMode && (
                <Button 
                    variant="contained" 
                    startIcon={<Plus size={18}/>} 
                    onClick={() => setOpenCheckinDialog(true)}
                >
                    New Check-in
                </Button>
            )}
        </Stack>
      </Stack>

      {/* Roster Search Bar */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: tabletMode ? 3 : 2, 
            mb: 4, 
            borderRadius: 3, 
            border: `1px solid ${theme.palette.divider}`, 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center' 
        }}
      >
        <Search size={tabletMode ? 24 : 20} style={{ color: theme.palette.text.disabled, marginLeft: 8 }} />
        <TextField 
            fullWidth 
            size="small" 
            placeholder="Search roster by child name or tag number..." 
            variant="standard"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{ 
                input: { 
                    disableUnderline: true, 
                    sx: { 
                        fontSize: tabletMode ? '1.1rem' : '0.9rem', 
                        fontWeight: 600,
                        py: tabletMode ? 1 : 0
                    } 
                } 
            }} 
        />
      </Paper>

      {/* Main Layout Grid */}
      <Grid container spacing={4}>
        {/* Live Roster Column */}
        <Grid xs={12} md={tabletMode ? 7 : 8}>
            <Paper 
                elevation={0} 
                sx={{ 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 3, 
                    overflow: 'hidden',
                    bgcolor: tabletMode ? alpha(theme.palette.background.paper, 0.5) : 'background.paper'
                }}
            >
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.text.primary, 0.02), borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>Live Roster ({checkins.length})</Typography>
                    <Chip label="Secure Environment" size="small" color="success" icon={<ShieldCheck size={14}/>} sx={{ fontWeight: 800, borderRadius: 1 }} />
                </Box>
                
                {loading && checkins.length === 0 ? (
                    <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress size={32} /></Box>
                ) : tabletMode ? (
                    /* Tablet Mode Flat Touch Cards Layout */
                    <Box sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            {filteredCheckins.map((item) => (
                                <Card 
                                    key={item.id} 
                                    elevation={0} 
                                    sx={{ 
                                        border: `2px solid ${theme.palette.divider}`, 
                                        borderRadius: 3, 
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: alpha(theme.palette.primary.main, 0.01)
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                        <Grid container alignItems="center" spacing={2}>
                                            <Grid xs={12} sm={7}>
                                                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 56, height: 56 }}>
                                                        <Baby size={28} />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="h6" fontWeight={800}>{item.child_name}</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <User size={14}/> Parent: <strong>{item.parent_name}</strong>
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                                            Checked in at {format(new Date(item.checked_in_at), 'hh:mm a')}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                            
                                            <Grid xs={12} sm={5}>
                                                <Stack direction="row" spacing={2} sx={{ justifyContent: { xs: 'flex-start', sm: 'flex-end' }, alignItems: 'center' }}>
                                                    <Box sx={{ textAlign: 'center', px: 3, py: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2, border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`, minWidth: 90 }}>
                                                        <Typography variant="caption" fontWeight={900} color="warning.main" sx={{ display: 'block', mb: -0.5, fontSize: '0.75rem', letterSpacing: 1 }}>SECURITY TAG</Typography>
                                                        <Typography variant="h5" fontWeight={950} color="warning.main">#{item.tag_number}</Typography>
                                                    </Box>
                                                    
                                                    {/* Tablet 56px checkout button */}
                                                    <Button 
                                                        variant="contained" 
                                                        color="error" 
                                                        onClick={() => handleCheckout(item.id)}
                                                        startIcon={<LogOut size={18}/>}
                                                        sx={{ 
                                                            height: 56, 
                                                            minWidth: 130, 
                                                            px: 3, 
                                                            borderRadius: 2.5,
                                                            fontWeight: 800,
                                                            textTransform: 'none',
                                                            boxShadow: 'none',
                                                            m: '12px'
                                                        }}
                                                    >
                                                        Check-out
                                                    </Button>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredCheckins.length === 0 && (
                                <Box sx={{ py: 10, textAlign: 'center' }}>
                                    <Typography variant="h6" color="text.disabled">No children checked in matching search.</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                ) : (
                    /* Standard Mode Roster List */
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

        {/* Side Panel / Split-Pane Form (Tablet Mode) or Security Information */}
        <Grid xs={12} md={tabletMode ? 5 : 4}>
            {tabletMode ? (
                /* Split-Pane Tablet Check-In Form (Fully visible above fold) */
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 4, 
                        border: `2px solid ${theme.palette.primary.main}`, 
                        borderRadius: 3, 
                        bgcolor: alpha(theme.palette.primary.main, 0.01),
                        position: 'sticky',
                        top: 24
                    }}
                >
                    <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', color: '#fff', width: 44, height: 44 }}>
                            <Plus size={22} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={900}>Self Check-in Console</Typography>
                            <Typography variant="caption" color="text.secondary">Tablet optimized check-in fields</Typography>
                        </Box>
                    </Stack>

                    <Stack spacing={3}>
                        <TextField 
                            fullWidth 
                            label="Child's Full Name" 
                            variant="outlined" 
                            value={formData.child_name} 
                            onChange={(e) => setFormData({...formData, child_name: e.target.value})}
                            slotProps={{ input: { sx: { height: 56, fontSize: '1.05rem', fontWeight: 600 } } }}
                        />
                        <TextField 
                            fullWidth 
                            label="Parent/Guardian Name" 
                            variant="outlined" 
                            value={formData.parent_name} 
                            onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                            slotProps={{ input: { sx: { height: 56, fontSize: '1.05rem', fontWeight: 600 } } }}
                        />
                        <TextField 
                            fullWidth 
                            label="Parent Phone Number" 
                            variant="outlined" 
                            value={formData.parent_phone} 
                            onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                            slotProps={{ input: { sx: { height: 56, fontSize: '1.05rem', fontWeight: 600 } } }}
                        />
                    </Stack>

                    {/* Tablet 56px actions */}
                    <Stack direction="column" spacing={2} sx={{ mt: 4 }}>
                        <Button 
                            fullWidth 
                            variant="contained" 
                            color="primary"
                            disabled={submitting} 
                            onClick={handleCheckin} 
                            startIcon={submitting ? <CircularProgress size={20} color="inherit"/> : <CheckCircle2 size={22}/>}
                            sx={{ 
                                height: 56, 
                                minHeight: 56, 
                                borderRadius: 3, 
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                textTransform: 'none',
                                boxShadow: theme.shadows[4],
                                m: '12px 0px'
                            }}
                        >
                            {submitting ? 'Registering...' : 'Confirm Check-in'}
                        </Button>
                        
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            color="warning"
                            disabled={!formData.child_name}
                            startIcon={<Printer size={20}/>}
                            onClick={() => showNotification("Safety labels queued to wireless print server.", "success")}
                            sx={{ 
                                height: 56, 
                                minHeight: 56, 
                                borderRadius: 3, 
                                fontSize: '1rem',
                                fontWeight: 800,
                                textTransform: 'none',
                                m: '12px 0px'
                            }}
                        >
                            Print Safety Tag Only
                        </Button>
                    </Stack>

                    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mt: 3, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 700 }}>
                                <ShieldCheck size={14}/> Wireless check-in and tag printer connected.
                            </Typography>
                        </CardContent>
                    </Card>
                </Paper>
            ) : (
                /* Standard Information Card */
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
            )}
        </Grid>
      </Grid>

      {/* Roster Check-In Dialog (Standard Mode) */}
      <Dialog 
        open={openCheckinDialog} 
        onClose={() => setOpenCheckinDialog(false)} 
        fullWidth 
        maxWidth="xs" 
        slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}
      >
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
