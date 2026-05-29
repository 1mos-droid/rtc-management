import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { safeParseDate } from '../../utils/dateUtils';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import {
  Button,
  Box,
  IconButton,
  Typography,
  useTheme,
  Avatar,
  Grid,
  TextField,
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
  Cake, 
  Users, 
  DollarSign
} from 'lucide-react';

import { supabase } from '../../supabase';

// This is the inner content of the details. 
// It doesn't know if it's in a Drawer, Dialog, or embedded on the page.
const MemberDetailsContent = ({ member, onClose, onEdit, onDelete, showCloseButton = true }) => {
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
      setFormData({
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
  }, [member]);

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
    if (member && tabValue === 1) {
      fetchContributions();
    }
  }, [member, tabValue, fetchContributions]);

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

  if (!member) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.disabled' }}>
        <Typography>Select a member to view details</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper', overflow: 'hidden' }}>
      
      {/* Top Banner / Profile Summary */}
      <Box sx={{ 
          bgcolor: alpha(theme.palette.primary.main, 0.02), 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative'
      }}>
          {showCloseButton && onClose && (
            <IconButton 
                size="small" 
                onClick={onClose} 
                sx={{ position: 'absolute', top: 8, right: 8 }}
            >
                <X size={20}/>
            </IconButton>
          )}

          <Avatar 
              sx={{ 
                  width: 80, height: 80, 
                  bgcolor: 'primary.main', 
                  fontSize: '2rem', 
                  fontWeight: 700,
                  mb: 2,
                  boxShadow: theme.shadows[2]
              }}
          >
              {member.name?.charAt(0)}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', mb: 0.5 }}>{member.name}</Typography>
          <Chip 
              label={member.status || 'Active'} 
              size="small"
              color={member.status === 'active' ? 'success' : 'default'}
              sx={{ fontWeight: 700, mb: 2, borderRadius: '12px', height: 20, fontSize: '0.65rem' }} 
          />
          
          <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Users size={14} color={theme.palette.text.secondary} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">{member.department || 'General'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Cake size={14} color={theme.palette.text.secondary} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">{member.dob ? format(safeParseDate(member.dob), 'MMM do') : 'N/A'}</Typography>
              </Box>
          </Stack>
      </Box>

      {/* Tabs */}
      <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)} 
          variant="fullWidth"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
      >
          <Tab label="Details" sx={{ textTransform: 'none', fontWeight: 700, py: 2 }} />
          <Tab label="Giving" sx={{ textTransform: 'none', fontWeight: 700, py: 2 }} />
      </Tabs>

      {/* Scrollable Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          {tabValue === 0 ? (
              <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800}>Contact Information</Typography>
                      {isDeptHead && (
                          <Button 
                              size="small"
                              variant="outlined"
                              sx={{ py: 0.5, px: 1, minWidth: 0, fontSize: '0.7rem' }}
                              startIcon={isEditing ? <X size={14}/> : <Edit2 size={14}/>} 
                              onClick={() => setIsEditing(!isEditing)}
                          >
                              {isEditing ? 'Cancel' : 'Edit'}
                          </Button>
                      )}
                  </Stack>

                  <Grid container spacing={2}>
                      <Grid xs={12}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Email Address</Typography>
                          {isEditing ? <TextField fullWidth size="small" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.email || '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12} sm={6}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Phone Number</Typography>
                          {isEditing ? <TextField fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.phone || '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12} sm={6}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Occupation</Typography>
                          {isEditing ? <TextField fullWidth size="small" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.occupation || '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12} sm={6}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Family ID/Name</Typography>
                          {isEditing ? <TextField fullWidth size="small" value={formData.family_id} onChange={(e) => setFormData({...formData, family_id: e.target.value})} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.family_id || '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12} sm={6}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Campus/Branch</Typography>
                          {isEditing ? <TextField fullWidth size="small" value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.campus || '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12} sm={6}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Baptism Date</Typography>
                          {isEditing ? <TextField fullWidth size="small" type="date" value={formData.baptism_date} onChange={(e) => setFormData({...formData, baptism_date: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.baptism_date ? format(safeParseDate(member.baptism_date), 'MMM dd, yyyy') : '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12} sm={6}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Confirmation Date</Typography>
                          {isEditing ? <TextField fullWidth size="small" type="date" value={formData.confirmation_date} onChange={(e) => setFormData({...formData, confirmation_date: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.confirmation_date ? format(safeParseDate(member.confirmation_date), 'MMM dd, yyyy') : '—'}</Typography>
                          )}
                      </Grid>
                      <Grid xs={12}>
                          <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Home Address</Typography>
                          {isEditing ? <TextField fullWidth size="small" multiline rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /> : (
                              <Typography variant="body2" fontWeight={600}>{member.address || '—'}</Typography>
                          )}
                      </Grid>
                  </Grid>

                  {isEditing && (
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button variant="contained" onClick={handleSave} size="small">Save</Button>
                      </Box>
                  )}

                  {isDeptHead && !isEditing && (
                      <Box sx={{ mt: 6, pt: 3, borderTop: `1px dashed ${theme.palette.divider}` }}>
                          <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>Danger Zone</Typography>
                          <Button 
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
          ) : (
              <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800}>History</Typography>
                      <Box sx={{ px: 1.5, py: 0.5, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: '12px', border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
                          <Typography variant="caption" fontWeight={800} color="success.main">GHC {contributions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString()}</Typography>
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
                                  <ListItem sx={{ py: 1.5, px: 0 }}>
                                      <ListItemAvatar sx={{ minWidth: 40 }}>
                                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', borderRadius: '12px' }}>
                                              <DollarSign size={16}/>
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
  );
};

export default MemberDetailsContent;
