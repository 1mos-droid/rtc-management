import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { safeParseDate } from '../utils/dateUtils';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Box,
  IconButton,
  Typography,
  useTheme,
  Avatar,
  Grid,
  TextField,
  Slide,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tab,
  Tabs,
  alpha,
  Stack,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  X, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Cake, 
  Building, 
  Users, 
  History,
  DollarSign
} from 'lucide-react';

import { supabase } from '../supabase';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MemberDetailsDialog = ({ open, onClose, member, onEdit, onDelete }) => {
  const theme = useTheme();
  const { showNotification: _showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [contributions, setContributions] = useState([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', 
    status: '', department: '', position: ''    
  });

  useEffect(() => {
    if (member) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        dob: member.dob || '', 
        status: member.status || 'active',
        department: member.department || '', 
        position: member.position || ''      
      });
      setIsEditing(false);
      setTabValue(0);
    }
  }, [member, open]);

  const fetchContributions = useCallback(async () => {
    if (!member) return;
    setLoadingContributions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', member.id) // Assuming member_id column exists
        .order('date', { ascending: false })
        .limit(500);

      if (error) throw error;
      setContributions(data || []);
    } catch (err) {
      console.error(err);
      setContributions([]);
    } finally {
      setLoadingContributions(false);
    }
  }, [member]);

  useEffect(() => {
    if (member && open && tabValue === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchContributions();
    }
  }, [member, open, tabValue, fetchContributions]);

  const handleSave = () => {
    onEdit(member.id, formData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    showConfirmation({
        title: "Remove Member",
        message: `Are you sure you want to permanently remove ${member.name} from the directory?`,
        onConfirm: () => onDelete(member.id)
    });
  };

  if (!member) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { borderRadius: 0, overflow: 'hidden' } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 600 }}>
        
        {/* Left Side: Profile Identity */}
        <Box sx={{ 
            width: { xs: '100%', md: 320 }, 
            bgcolor: alpha(theme.palette.primary.main, 0.03), 
            p: 6, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRight: `1px solid ${theme.palette.divider}`
        }}>
            <Avatar 
                sx={{ 
                    width: 140, height: 140, 
                    borderRadius: 0, 
                    bgcolor: 'primary.main', 
                    fontSize: '4rem', 
                    fontWeight: 900,
                    mb: 4,
                    boxShadow: `0 20px 40px -10px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
            >
                {member.name?.charAt(0)}
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, textAlign: 'center', mb: 1, letterSpacing: -1 }}>{member.name}</Typography>
            <Chip 
                label={member.status || 'Active'} 
                sx={{ 
                    borderRadius: 0, 
                    fontWeight: 800, 
                    letterSpacing: 2, 
                    fontSize: '0.6rem',
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`,
                    mb: 6
                }} 
            />
            
            <Stack spacing={3} sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Users size={16} color={theme.palette.primary.main} />
                    <Typography variant="body2" fontWeight={700}>{member.department || 'General'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Cake size={16} color={theme.palette.primary.main} />
                    <Typography variant="body2" fontWeight={700}>{member.dob ? format(safeParseDate(member.dob), 'MMMM do') : 'N/A'}</Typography>
                </Box>
            </Stack>

            {isDeptHead && (
                <Box sx={{ mt: 'auto', width: '100%', pt: 6 }}>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        color="error" 
                        startIcon={<Trash2 size={16}/>}
                        onClick={handleDelete}
                        sx={{ border: 'none', '&:hover': { border: 'none', bgcolor: alpha(theme.palette.error.main, 0.05) } }}
                    >
                        Remove Member
                    </Button>
                </Box>
            )}
        </Box>

        {/* Right Side: Details & History */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <IconButton onClick={onClose}><X size={20}/></IconButton>
            </Box>
            
            <Tabs 
                value={tabValue} 
                onChange={(_, v) => setTabValue(v)} 
                sx={{ 
                    px: 4, 
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '& .MuiTab-root': { fontWeight: 900, letterSpacing: 1, py: 3 }
                }}
            >
                <Tab label="Profile Overview" />
                <Tab label="Financial Records" />
            </Tabs>

            <DialogContent sx={{ p: 6 }}>
                {tabValue === 0 ? (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Merriweather' }}>Contact Information</Typography>
                            {isDeptHead && (
                                <Button 
                                    startIcon={isEditing ? <X size={16}/> : <Edit2 size={16}/>} 
                                    onClick={() => setIsEditing(!isEditing)}
                                    sx={{ fontWeight: 800, color: 'text.secondary' }}
                                >
                                    {isEditing ? 'Cancel' : 'Edit Info'}
                                </Button>
                            )}
                        </Box>

                        <Grid container spacing={6}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2, display: 'block', mb: 1 }}>EMAIL ADDRESS</Typography>
                                {isEditing ? <TextField fullWidth variant="standard" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /> : (
                                    <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'Lora' }}>{member.email || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2, display: 'block', mb: 1 }}>TELEPHONE</Typography>
                                {isEditing ? <TextField fullWidth variant="standard" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /> : (
                                    <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'Lora' }}>{member.phone || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2, display: 'block', mb: 1 }}>RESIDENCE</Typography>
                                {isEditing ? <TextField fullWidth variant="standard" name="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /> : (
                                    <Typography variant="body1" fontWeight={500} sx={{ fontFamily: 'Lora' }}>{member.address || '—'}</Typography>
                                )}
                            </Grid>
                        </Grid>

                        {isEditing && (
                            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" onClick={handleSave} sx={{ px: 6, py: 1.5, letterSpacing: 2 }}>Save Changes</Button>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 6 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'Merriweather' }}>Contribution Ledger</Typography>
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                                <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 1 }}>TOTAL STEWARDSHIP</Typography>
                                <Typography variant="h6" fontWeight={900}>GHC {contributions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString()}</Typography>
                            </Box>
                        </Stack>

                        {loadingContributions ? <CircularProgress /> : contributions.length === 0 ? (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>No financial records found for this member.</Typography>
                        ) : (
                            <List disablePadding>
                                {contributions.map((c, i) => (
                                    <React.Fragment key={c.id}>
                                        <ListItem sx={{ py: 3, px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, borderRadius: 0 }}><DollarSign size={18}/></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={<Typography variant="body2" fontWeight={800}>{c.description}</Typography>}
                                                secondary={<Typography variant="caption" color="text.disabled" fontWeight={700}>{format(safeParseDate(c.date), 'MMMM dd, yyyy')}</Typography>}
                                            />
                                            <Typography variant="body1" fontWeight={900}>GHC {Number(c.amount).toLocaleString()}</Typography>
                                        </ListItem>
                                        {i < contributions.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Box>
      </Box>
    </Dialog>
  );
};

export default MemberDetailsDialog;
