import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { safeParseDate } from '../utils/dateUtils';
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
  Divider
} from '@mui/material';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Leaf
} from 'lucide-react';
import AddMemberDialog from '../components/AddMemberDialog';
import MemberDetailsDialog from '../components/MemberDetailsDialog';

import { supabase } from '../supabase';

const FamilyCard = ({ member, onClick }) => {
    const theme = useTheme();
    return (
        <Paper 
            elevation={0}
            onClick={onClick}
            sx={{ 
                p: { xs: 2.5, md: 3 }, borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': { borderColor: theme.palette.primary.main, transform: 'translateY(-5px)', boxShadow: '0 12px 30px -10px rgba(74, 103, 65, 0.15)' }
            }}
        >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.03, color: 'primary.main' }}>
                <Leaf size={100} />
            </Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, fontWeight: 900, fontSize: '1.2rem' }}>
                    {member.name?.charAt(0)}
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1rem' }}>{member.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>{member.department || 'General'}</Typography>
                </Box>
            </Stack>
            
            <Stack spacing={1} sx={{ color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Mail size={12} /> <Typography variant="caption" fontWeight={600}>{member.email || 'No email registered'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Phone size={12} /> <Typography variant="caption" fontWeight={600}>{member.phone || 'No phone registered'}</Typography>
                </Box>
            </Stack>
            
            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
            
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Chip label={member.status || 'Active'} size="small" sx={{ borderRadius: 2, fontWeight: 900, fontSize: '0.6rem', bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main' }} />
                <Typography variant="caption" fontWeight={800} color="text.disabled">EST. {member.created_at ? format(safeParseDate(member.created_at), 'yyyy') : '2026'}</Typography>
            </Stack>
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
      const { error } = await supabase
        .from('members')
        .insert([{ ...newMember }]);
      
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
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: { xs: 4, md: 6 } }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>THE CONGREGATION</Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mt: 1, fontSize: { xs: '2rem', md: '3rem' } }}>Family Directory</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 600, fontSize: '1rem' }}>
             A beautiful record of every soul connected to the Redeemed Transformation Chapel International family.        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: { xs: 4, md: 6 }, alignItems: "center" }}>
          <Paper elevation={0} sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', p: 0.75, borderRadius: 100, border: `1px solid ${theme.palette.divider}`, px: 2.5, width: '100%' }}>
            <Search size={18} color={theme.palette.text.disabled} />
            <TextField 
                fullWidth variant="standard" placeholder="Find a family member..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{ input: { disableUnderline: true, sx: { px: 1.5, py: 0.75, fontFamily: 'Lora', fontWeight: 500 } } }} 
            />
          </Paper>
          {isDeptHead && (
            <Button variant="contained" startIcon={<UserPlus size={18}/>} onClick={() => setOpenAddMemberDialog(true)} sx={{ height: 50, px: 4, borderRadius: 100 }}>Register Soul</Button>
          )}
      </Stack>

      {loading && members.length === 0 ? (
        <Grid container spacing={4}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 6 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
          <Grid container spacing={4}>
              {filteredMembers.map((m) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={m.id}>
                      <FamilyCard member={m} onClick={() => setSelectedMember(m)} />
                  </Grid>
              ))}
          </Grid>
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
