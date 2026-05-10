import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Avatar, 
  Chip,
  useTheme,
  Grid,
  Skeleton,
  CircularProgress,
  alpha,
  Paper,
  Stack,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MoreHorizontal,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import AddMemberDialog from '../components/AddMemberDialog';
import MemberDetailsDialog from '../components/MemberDetailsDialog';

import { supabase } from '../supabase';

const MemberTableRow = ({ member, onClick }) => {
    const theme = useTheme();
    return (
        <Paper 
            elevation={0}
            onClick={onClick}
            sx={{ 
                p: 2, borderRadius: 2, cursor: 'pointer',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: theme.palette.primary.main }
            }}
        >
            <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', fontWeight: 700 }}>
                {member.name?.charAt(0)}
            </Avatar>
            
            <Box sx={{ flex: 2, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{member.name}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{member.email || 'No email'}</Typography>
            </Box>

            <Box sx={{ flex: 1.5, display: { xs: 'none', md: 'block' } }}>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Department</Typography>
                <Typography variant="body2" fontWeight={600} noWrap>{member.department || 'General'}</Typography>
            </Box>

            <Box sx={{ flex: 1, display: { xs: 'none', lg: 'block' } }}>
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>Phone</Typography>
                <Typography variant="body2" fontWeight={600} noWrap>{member.phone || 'N/A'}</Typography>
            </Box>

            <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Chip 
                    label={member.status || 'Active'} 
                    size="small" 
                    sx={{ borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} 
                    color={member.status === 'active' ? 'success' : 'default'}
                    variant="soft"
                />
            </Box>

            <IconButton size="small"><MoreHorizontal size={18} /></IconButton>
        </Paper>
    );
};

const Members = () => {
  const theme = useTheme();
  const { filterData, showNotification } = useWorkspace();
  const { isDeptHead } = useAuth();
  
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })
        .limit(2000);
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Family records fetch failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchMembers(); // eslint-disable-line react-hooks/set-state-in-effect

    const channel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => {
    const environmentFiltered = filterData(members);
    return environmentFiltered.filter(m => 
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm, filterData]);

  const handleAddMember = async (newMember) => {
    if (!isDeptHead) return;
    try {
      const { name, email, phone, address, dob, membershipType } = newMember;
      
      const { error } = await supabase
        .from('members')
        .insert([{ 
            name, email, phone, address, dob, 
            membership_type: membershipType,
            status: 'active'
        }]);
      
      if (error) throw error;

      setOpenAddMemberDialog(false);
      showNotification("Soul registered to the family.", "success");
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Registration failed.", "error");
    }
  };

  const handleEditMember = async (id, data) => {
    if (!isDeptHead) return;
    try {
      const { error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;

      showNotification("Record updated successfully.", "success");
      setSelectedMember(null);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Update failed.", "error");
    }
  };

  const handleDeleteMember = async (id) => {
    if (!isDeptHead) return;
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      showNotification("Record removed.", "info");
      setSelectedMember(null);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Deletion failed.", "error");
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 6 }}>
        <Box>
            <Typography variant="h2">Member Directory</Typography>
            <Typography variant="body1" color="text.secondary">Manage and view all registered members of the congregation.</Typography>
        </Box>
        {isDeptHead && (
          <Button variant="contained" startIcon={<UserPlus size={18}/>} onClick={() => setOpenAddMemberDialog(true)}>Register Member</Button>
        )}
      </Stack>

      {/* Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField 
            size="small"
            placeholder="Search members..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search size={18} style={{ color: theme.palette.text.disabled }} />
                    </InputAdornment>
                ),
            }}
        />
        <Button variant="outlined" startIcon={<Filter size={16} />} size="small">Filter</Button>
        <Button variant="outlined" startIcon={<ArrowUpDown size={16} />} size="small">Sort</Button>
      </Paper>

      {/* List */}
      {loading && members.length === 0 ? (
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : (
          <Stack spacing={2}>
              {filteredMembers.map((m) => (
                  <MemberTableRow key={m.id} member={m} onClick={() => setSelectedMember(m)} />
              ))}
              {filteredMembers.length === 0 && (
                  <Box sx={{ py: 10, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.disabled">No members found matching your search.</Typography>
                  </Box>
              )}
          </Stack>
      )}

      <AddMemberDialog 
        key={openAddMemberDialog ? 'open' : 'closed'}
        open={openAddMemberDialog} 
        onClose={() => setOpenAddMemberDialog(false)} 
        onAddMember={handleAddMember} 
      />
      <MemberDetailsDialog 
        open={selectedMember !== null} 
        onClose={() => setSelectedMember(null)} 
        member={selectedMember} 
        onEdit={handleEditMember} 
        onDelete={handleDeleteMember} 
      />
    </Box>
  );
};

export default Members;
