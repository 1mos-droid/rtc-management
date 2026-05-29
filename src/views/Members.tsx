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
  useMediaQuery,
  Grid,
  Skeleton,
  CircularProgress,
  alpha,
  Paper,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Drawer
} from '@mui/material';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  X
} from 'lucide-react';
import AddMemberDialog from '../components/AddMemberDialog';
import MemberDetailsDialog from '../components/MemberDetailsDialog';
import MemberDetailsContent from '../components/members/MemberDetailsContent';

import { supabase } from '../supabase';

const MemberMobileCard = ({ member, onClick }) => {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    return (
        <Box sx={{ 
            p: 0.75, 
            borderRadius: '32px', 
            bgcolor: isLight ? 'rgba(44,36,33,0.02)' : 'rgba(242,240,235,0.02)',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              bgcolor: isLight ? 'rgba(44,36,33,0.04)' : 'rgba(242,240,235,0.04)',
            }
        }}>
            <Paper 
                elevation={0}
                onClick={onClick}
                sx={{ 
                    p: 2.5, borderRadius: '28px', cursor: 'pointer',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800 }}>
                        {member.name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" noWrap>{member.name}</Typography>
                        <Typography variant="body2" noWrap sx={{ display: 'block', mb: 0.5 }}>{member.email || 'No email'}</Typography>
                        <Chip 
                            label={member.status || 'Active'} 
                            size="small" 
                            sx={{ borderRadius: 1, fontWeight: 800, fontSize: '0.6rem', height: 20, textTransform: 'uppercase' }} 
                            color={member.status === 'active' ? 'success' : 'default'}
                            variant="soft"
                        />
                    </Box>
                    <IconButton size="small" sx={{ color: 'text.disabled' }}><MoreHorizontal size={18} /></IconButton>
                </Box>
                
                <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="overline" color="text.disabled" display="block" sx={{ mb: 0.5 }}>Department</Typography>
                        <Typography variant="body2" fontWeight={800} noWrap>{member.department || 'General'}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="overline" color="text.disabled" display="block" sx={{ mb: 0.5 }}>Phone</Typography>
                        <Typography variant="body2" fontWeight={800} noWrap>{member.phone || 'N/A'}</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

const MemberTableRow = ({ member, onClick }) => {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    return (
        <Box sx={{ 
            p: 0.75, 
            borderRadius: '24px', 
            bgcolor: isLight ? 'rgba(44,36,33,0.015)' : 'rgba(242,240,235,0.015)',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1)',
            '&:hover': {
              bgcolor: isLight ? 'rgba(44,36,33,0.04)' : 'rgba(242,240,235,0.04)',
            }
        }}>
            <Paper 
                elevation={0}
                onClick={onClick}
                sx={{ 
                    p: 1.5, px: 3, borderRadius: '20px', cursor: 'pointer',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    border: 'none',
                    transition: 'all 0.4s ease'
                }}
            >
                <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', fontWeight: 800 }}>
                    {member.name?.charAt(0)}
                </Avatar>
                
                <Box sx={{ flex: 2, minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>{member.name}</Typography>
                    <Typography variant="body2" noWrap>{member.email || 'No email'}</Typography>
                </Box>

                <Box sx={{ flex: 1.5, display: { xs: 'none', md: 'block' } }}>
                    <Typography variant="overline" color="text.disabled" display="block">Department</Typography>
                    <Typography variant="body2" fontWeight={800} noWrap>{member.department || 'General'}</Typography>
                </Box>

                <Box sx={{ flex: 1, display: { xs: 'none', lg: 'block' } }}>
                    <Typography variant="overline" color="text.disabled" display="block">Phone</Typography>
                    <Typography variant="body2" fontWeight={800} noWrap>{member.phone || 'N/A'}</Typography>
                </Box>

                <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                    <Chip 
                        label={member.status || 'Active'} 
                        size="small" 
                        sx={{ borderRadius: 1, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }} 
                        color={member.status === 'active' ? 'success' : 'default'}
                        variant="soft"
                    />
                </Box>

                <IconButton size="small"><MoreHorizontal size={18} /></IconButton>
            </Paper>
        </Box>
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
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

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

  const masterContent = (
    <Box sx={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: { xs: 4, sm: 8 } }}>
        <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1.5 }}>Member Directory</Typography>
            <Typography variant="body1" color="text.secondary">Manage and view all registered members.</Typography>
        </Box>
        {isDeptHead && (
          <Button variant="contained" startIcon={<UserPlus size={18}/>} onClick={() => setOpenAddMemberDialog(true)}>Register Member</Button>
        )}
      </Stack>

      {/* Toolbar */}
      <Box sx={{ p: 1, mb: 4, borderRadius: '999px', bgcolor: theme.palette.mode === 'light' ? 'rgba(44,36,33,0.02)' : 'rgba(242,240,235,0.02)', border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 1.5, borderRadius: '999px', bgcolor: 'background.paper', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField 
              size="small"
              placeholder="Search members..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
              slotProps={{
                  input: {
                      startAdornment: (
                          <InputAdornment position="start">
                              <Search size={18} style={{ color: theme.palette.text.disabled }} />
                          </InputAdornment>
                      ),
                  },
              }}
          />
          <Button variant="outlined" startIcon={<Filter size={16} />} size="small" sx={{ borderRadius: 999 }}>Filter</Button>
          <Button variant="outlined" startIcon={<ArrowUpDown size={16} />} size="small" sx={{ borderRadius: 999 }}>Sort</Button>
        </Box>
      </Box>

      {/* List */}
      {loading && members.length === 0 ? (
        <Stack spacing={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={isMobile ? 160 : 80} sx={{ borderRadius: isMobile ? 3 : 2 }} />
          ))}
        </Stack>
      ) : (
          <Grid container spacing={2}>
              {filteredMembers.map((m) => (
                  <Grid xs={12} key={m.id}>
                      {isMobile || isTablet ? (
                          <MemberMobileCard 
                              member={m} 
                              onClick={() => setSelectedMember(m)} 
                          />
                      ) : (
                          <MemberTableRow member={m} onClick={() => setSelectedMember(m)} />
                      )}
                  </Grid>
              ))}
              {filteredMembers.length === 0 && (
                  <Grid xs={12}>
                      <Box sx={{ py: 10, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.disabled">No members found matching your search.</Typography>
                      </Box>
                  </Grid>
              )}
          </Grid>
      )}
    </Box>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 120px)' }}>
      {isTablet ? (
        // Split-Pane Layout for Tablet
        <Box sx={{ display: 'flex', height: '100%', gap: 3 }}>
            <Box sx={{ width: '40%', height: '100%', overflowY: 'auto' }}>
                {masterContent}
            </Box>
            <Box sx={{ width: '60%', height: '100%', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                <MemberDetailsContent 
                    member={selectedMember} 
                    onClose={() => setSelectedMember(null)}
                    onEdit={handleEditMember}
                    onDelete={handleDeleteMember}
                    showCloseButton={false}
                />
            </Box>
        </Box>
      ) : (
        // Standard View for Mobile & Desktop
        <Box sx={{ height: '100%', overflowY: 'auto' }}>
            {masterContent}
        </Box>
      )}

      <AddMemberDialog 
        key={openAddMemberDialog ? 'open' : 'closed'}
        open={openAddMemberDialog} 
        onClose={() => setOpenAddMemberDialog(false)} 
        onAddMember={handleAddMember} 
      />

      {isDesktop && (
        <Drawer
          anchor="right"
          open={selectedMember !== null}
          onClose={() => setSelectedMember(null)}
          PaperProps={{ sx: { width: 500, p: 0, bgcolor: 'background.default' } }}
        >
          <MemberDetailsContent 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
          />
        </Drawer>
      )}

      {isMobile && (
        <MemberDetailsDialog 
          open={selectedMember !== null} 
          onClose={() => setSelectedMember(null)} 
          member={selectedMember} 
          onEdit={handleEditMember} 
          onDelete={handleDeleteMember} 
        />
      )}
    </Box>
  );
};

export default Members;
