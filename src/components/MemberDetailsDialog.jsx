import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { safeParseDate } from '../utils/dateUtils';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  Dialog,
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
  CircularProgress
} from '@mui/material';
import { 
  X, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Cake, 
  Users, 
  DollarSign
} from 'lucide-react';

import { supabase } from '../supabase';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MemberDetailsDialog = ({ open, onClose, member, onEdit, onDelete }) => {
  const theme = useTheme();
  const { showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [contributions, setContributions] = useState([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', 
    status: '', department: '', occupation: '', family_id: '',
    baptism_date: '', confirmation_date: '', campus: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({ // eslint-disable-line react-hooks/set-state-in-effect
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        dob: member.dob || '', 
        status: member.status || 'active',
        department: member.department || '',
        occupation: member.occupation || '',
        family_id: member.family_id || '',
        baptism_date: member.baptism_date || '',
        confirmation_date: member.confirmation_date || '',
        campus: member.campus || ''
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
        .eq('member_id', member.id)
        .order('date', { ascending: false })
        .limit(100);

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
      fetchContributions(); // eslint-disable-line react-hooks/set-state-in-effect
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
      slots={{ transition: Transition }}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 600 }}>
        
        {/* Left Side: Profile Summary */}
        <Box sx={{ 
            width: { xs: '100%', md: 300 }, 
            bgcolor: alpha(theme.palette.primary.main, 0.02), 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRight: `1px solid ${theme.palette.divider}`
        }}>
            <Avatar 
                sx={{ 
                    width: 120, height: 120, 
                    bgcolor: 'primary.main', 
                    fontSize: '3rem', 
                    fontWeight: 700,
                    mb: 3,
                    boxShadow: theme.shadows[2]
                }}
            >
                {member.name?.charAt(0)}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 1 }}>{member.name}</Typography>
            <Chip 
                label={member.status || 'Active'} 
                size="small"
                color={member.status === 'active' ? 'success' : 'default'}
                sx={{ fontWeight: 700, mb: 4, borderRadius: 1 }} 
            />
            
            <Stack spacing={2} sx={{ width: '100%', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Users size={16} color={theme.palette.text.secondary} />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{member.department || 'General'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Cake size={16} color={theme.palette.text.secondary} />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{member.dob ? format(safeParseDate(member.dob), 'MMMM do') : 'N/A'}</Typography>
                </Box>
            </Stack>

            {isDeptHead && (
                <Box sx={{ mt: 'auto', width: '100%', pt: 4 }}>
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        startIcon={<Trash2 size={16}/>}
                        onClick={handleDelete}
                    >
                        Delete Record
                    </Button>
                </Box>
            )}
        </Box>

        {/* Right Side: Tabs & Details */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <IconButton size="small" onClick={onClose}><X size={20}/></IconButton>
            </Box>
            
            <Tabs 
                value={tabValue} 
                onChange={(_, v) => setTabValue(v)} 
                sx={{ px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
                <Tab label="Personal Details" sx={{ textTransform: 'none', fontWeight: 700 }} />
                <Tab label="Contribution History" sx={{ textTransform: 'none', fontWeight: 700 }} />
            </Tabs>

            <Box sx={{ p: 4, flexGrow: 1 }}>
                {tabValue === 0 ? (
                    <Box>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Typography variant="h6" fontWeight={800}>Contact Information</Typography>
                            {isDeptHead && (
                                <Button 
                                    size="small"
                                    startIcon={isEditing ? <X size={16}/> : <Edit2 size={16}/>} 
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Cancel' : 'Edit Details'}
                                </Button>
                            )}
                        </Stack>

                        <Grid container spacing={3}>
                            <Grid xs={12} sm={6}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Email Address</Typography>
                                {isEditing ? <TextField fullWidth size="small" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.email || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Phone Number</Typography>
                                {isEditing ? <TextField fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.phone || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Occupation</Typography>
                                {isEditing ? <TextField fullWidth size="small" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.occupation || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12} sm={6}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Family ID/Name</Typography>
                                {isEditing ? <TextField fullWidth size="small" value={formData.family_id} onChange={(e) => setFormData({...formData, family_id: e.target.value})} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.family_id || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Baptism Date</Typography>
                                {isEditing ? <TextField fullWidth size="small" type="date" value={formData.baptism_date} onChange={(e) => setFormData({...formData, baptism_date: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.baptism_date ? format(safeParseDate(member.baptism_date), 'MMM dd, yyyy') : '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Confirmation Date</Typography>
                                {isEditing ? <TextField fullWidth size="small" type="date" value={formData.confirmation_date} onChange={(e) => setFormData({...formData, confirmation_date: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.confirmation_date ? format(safeParseDate(member.confirmation_date), 'MMM dd, yyyy') : '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12} sm={4}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Campus/Branch</Typography>
                                {isEditing ? <TextField fullWidth size="small" value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.campus || '—'}</Typography>
                                )}
                            </Grid>
                            <Grid xs={12}>
                                <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>Home Address</Typography>
                                {isEditing ? <TextField fullWidth size="small" multiline rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /> : (
                                    <Typography variant="body2" fontWeight={600}>{member.address || '—'}</Typography>
                                )}
                            </Grid>
                        </Grid>

                        {isEditing && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" onClick={handleSave}>Save Changes</Button>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                            <Typography variant="h6" fontWeight={800}>Contributions</Typography>
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                                <Typography variant="caption" fontWeight={700} color="success.main" sx={{ display: 'block' }}>TOTAL CONTRIBUTED</Typography>
                                <Typography variant="h6" fontWeight={800} color="success.main">GHC {contributions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString()}</Typography>
                            </Box>
                        </Stack>

                        {loadingContributions ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
                        ) : contributions.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.disabled">No records found.</Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {contributions.map((c, i) => (
                                    <React.Fragment key={c.id}>
                                        <ListItem sx={{ py: 2, px: 0 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', borderRadius: 2 }}>
                                                    <DollarSign size={18}/>
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={<Typography variant="body2" fontWeight={700}>{c.description}</Typography>}
                                                secondary={<Typography variant="caption" color="text.secondary">{format(safeParseDate(c.date), 'MMM dd, yyyy')}</Typography>}
                                            />
                                            <Typography variant="body2" fontWeight={800}>GHC {Number(c.amount).toLocaleString()}</Typography>
                                        </ListItem>
                                        {i < contributions.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default MemberDetailsDialog;
