import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  IconButton, 
  useTheme, 
  Stack, 
  alpha,
  Chip,
  Paper,
  Dialog,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Plus, 
  Users, 
  User,
  MoreVertical,
  Layers,
  Home,
  Heart
} from 'lucide-react';
import { supabase } from '../supabase';
import { sanitize } from '../utils/sanitizer';

const Groups = () => {
  const theme = useTheme();
  const { filterData, showNotification } = useWorkspace();
  const { isDeptHead } = useAuth();
  const canManage = isDeptHead;

  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: '', description: '', type: 'ministry', leader_id: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, memRes] = await Promise.all([
        supabase.from('groups').select('*, leader:members(name)').order('name', { ascending: true }),
        supabase.from('members').select('id, name').order('name', { ascending: true })
      ]);
      setGroups(grpRes.data || []);
      setMembers(memRes.data || []);
    } catch {
      showNotification("Failed to load groups.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('group-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchData]);

  const filteredGroups = useMemo(() => {
    let filtered = filterData(groups);
    if (activeTab !== 'all') filtered = filtered.filter(g => g.type === activeTab);
    return filtered;
  }, [groups, activeTab, filterData]);

  const handleCreateGroup = async () => {
    if (!formData.name) return showNotification("Group name is required.", "warning");
    setSubmitting(true);
    try {
      const { error } = await supabase.from('groups').insert([{
        name: sanitize(formData.name),
        description: sanitize(formData.description),
        type: formData.type,
        leader_id: formData.leader_id || null
      }]);
      
      if (error) throw error;
      showNotification("Group created successfully.");
      setOpenAddDialog(false);
      setFormData({ name: '', description: '', type: 'ministry', leader_id: '' });
    } catch {
      showNotification("Failed to create group.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'home_cell': return <Home size={20} />;
      case 'volunteer_rota': return <Heart size={20} />;
      default: return <Layers size={20} />;
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 6 }}>
        <Box>
            <Typography variant="h2">Groups & Cells</Typography>
            <Typography variant="body1" color="text.secondary">Organize and monitor ministries, home cells, and volunteer teams.</Typography>
        </Box>
        {canManage && (
            <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => setOpenAddDialog(true)}>Create Group</Button>
        )}
      </Stack>

      <Box sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="All Groups" value="all" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Ministries" value="ministry" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Home Cells" value="home_cell" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Volunteers" value="volunteer_rota" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>
      </Box>

      {loading && groups.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={32} /></Box>
      ) : (
          <Grid container spacing={3}>
              {filteredGroups.map((group) => (
                  <Grid xs={12} md={4} key={group.id}>
                      <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                          <CardContent sx={{ p: 3 }}>
                              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                      {getIcon(group.type)}
                                  </Box>
                                  <IconButton size="small"><MoreVertical size={18}/></IconButton>
                              </Stack>
                              
                              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>{group.name}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>{group.description || 'No description provided.'}</Typography>
                              
                              <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                              
                              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.text.primary, 0.05), color: 'text.secondary' }}>
                                      <User size={16} />
                                  </Avatar>
                                  <Box>
                                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Group Leader</Typography>
                                      <Typography variant="body2" fontWeight={700}>{group.leader?.name || 'Unassigned'}</Typography>
                                  </Box>
                              </Stack>
                          </CardContent>
                      </Card>
                  </Grid>
              ))}
              {filteredGroups.length === 0 && (
                  <Grid xs={12}>
                      <Box sx={{ py: 10, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.disabled">No groups found in this category.</Typography>
                      </Box>
                  </Grid>
              )}
          </Grid>
      )}

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Create New Group</Typography>
          <Stack spacing={3}>
              <TextField fullWidth label="Group Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} label="Type">
                      <MenuItem value="ministry">Ministry / Fellowship</MenuItem>
                      <MenuItem value="home_cell">Home Cell</MenuItem>
                      <MenuItem value="volunteer_rota">Volunteer Team</MenuItem>
                  </Select>
              </FormControl>
              <FormControl fullWidth>
                  <InputLabel>Leader</InputLabel>
                  <Select value={formData.leader_id} onChange={(e) => setFormData({...formData, leader_id: e.target.value})} label="Leader">
                      <MenuItem value=""><em>Unassigned</em></MenuItem>
                      {members.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
              </FormControl>
          </Stack>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handleCreateGroup}>Create Group</Button>
          </Box>
      </Dialog>
    </Box>
  );
};

export default Groups;
