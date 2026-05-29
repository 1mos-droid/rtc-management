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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Plus, 
  Download,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Filter,
  DollarSign,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';
import { safeParseDate } from '../utils/dateUtils';

const FLUID_TRANSITION = 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1)';

const StatCard = ({ title, value, label, color, icon }) => {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    const Icon = icon;
    
    return (
        <Box sx={{ 
            p: 1, 
            borderRadius: '36px', 
            bgcolor: isLight ? 'rgba(44,36,33,0.02)' : 'rgba(242,240,235,0.02)',
            border: `1px solid ${theme.palette.divider}`,
            transition: FLUID_TRANSITION,
            '&:hover': {
              transform: 'translateY(-2px)',
              bgcolor: isLight ? 'rgba(44,36,33,0.04)' : 'rgba(242,240,235,0.04)',
            }
        }}>
            <Card 
                elevation={0} 
                sx={{ 
                    height: '100%', 
                    borderRadius: '28px',
                    boxShadow: 'none',
                    border: 'none',
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <CardContent sx={{ p: {xs: 3, md: 4}, position: 'relative', zIndex: 1 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: 3, 
                            bgcolor: alpha(color || theme.palette.primary.main, 0.06), 
                            color: color || theme.palette.primary.main,
                        }}>
                            <Icon size={20} strokeWidth={1.5} />
                        </Box>
                        <Typography variant="overline" color="text.secondary">{title}</Typography>
                    </Stack>
                    <Typography variant="h3" sx={{ mb: 1.5, color: theme.palette.text.primary }}>{value}</Typography>
                    <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ fontSize: '0.75rem' }}>{label}</Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

const Financials = () => {
  const theme = useTheme();
  const { filterData, showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const canManage = isDeptHead;
  
  const [transactions, setTransactions] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [openPledgeDialog, setOpenPledgeDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [inlineEditTx, setInlineEditTx] = useState(null);

  const handleInlineSave = async () => {
    if (!inlineEditTx.amount || !inlineEditTx.description) return showNotification("Fields required.", "warning");
    
    if (containsMaliciousPattern(inlineEditTx.description)) {
      showNotification("Invalid input detected.", "error");
      return;
    }

    try {
      const { error } = await supabase.from('transactions').update({
          description: sanitize(inlineEditTx.description),
          type: inlineEditTx.type,
          amount: Number(inlineEditTx.amount)
      }).eq('id', inlineEditTx.id);
      
      if (error) throw error;
      showNotification("Record updated successfully.");
      setInlineEditTx(null);
    } catch (e) {
      showNotification("Error updating record.", "error");
    }
  };
  const [formData, setFormData] = useState({ amount: '', description: '', type: 'contribution' });
  const [pledgeData, setPledgeData] = useState({ amount: '', purpose: '', due_date: '', member_id: '' });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [members, setMembers] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, plRes, memRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(1000),
        supabase.from('pledges').select('*, members(name)').order('created_at', { ascending: false }).limit(500),
        supabase.from('members').select('id, name').order('name', { ascending: true })
      ]);
      
      setTransactions(txRes.data || []);
      setPledges(plRes.data || []);
      setMembers(memRes.data || []);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Failed to fetch financial records.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const txChannel = supabase.channel('financial-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData).subscribe();
    const plChannel = supabase.channel('pledge-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'pledges' }, fetchData).subscribe();
    return () => {
        supabase.removeChannel(txChannel);
        supabase.removeChannel(plChannel);
    };
  }, [fetchData]);

  const filteredTx = useMemo(() => {
    let filtered = filterData(transactions);
    if (activeTab === 'income') filtered = filtered.filter(t => t.type === 'contribution');
    if (activeTab === 'expense') filtered = filtered.filter(t => t.type === 'expense');
    return filtered;
  }, [transactions, activeTab, filterData]);

  const filteredPledges = useMemo(() => {
    return filterData(pledges);
  }, [pledges, filterData]);

  const stats = useMemo(() => {
    const income = filterData(transactions).filter(t => t.type === 'contribution').reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const expense = filterData(transactions).filter(t => t.type === 'expense').reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const totalPledged = filterData(pledges).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    return { income, expense, balance: income - expense, totalPledged };
  }, [transactions, pledges, filterData]);

  const handleTransaction = async () => {
    if (!canManage) return;
    if (!formData.amount || !formData.description) return showNotification("Fields required.", "warning");
    
    if (containsMaliciousPattern(formData.description)) {
      showNotification("Invalid input detected.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const sanitizedDescription = sanitize(formData.description);
      const txData = { 
        amount: Number(formData.amount),
        description: sanitizedDescription,
        type: formData.type,
        date: editingTransaction ? editingTransaction.date : new Date().toISOString() 
      };

      if (editingTransaction) {
        const { error } = await supabase.from('transactions').update(txData).eq('id', editingTransaction.id);
        if (error) throw error;
        showNotification("Record updated successfully.");
      } else {
        const { error } = await supabase.from('transactions').insert([txData]);
        if (error) throw error;
        showNotification("Entry recorded successfully.");
      }
      setOpenLogDialog(false);
      resetForm();
    } catch (error) {
        console.error(error);
        showNotification("Error logging transaction.", "error"); 
    } finally { setSubmitting(false); }
  };

  const handlePledge = async () => {
    if (!canManage) return;
    if (!pledgeData.amount || !pledgeData.purpose || !pledgeData.member_id) return showNotification("Fields required.", "warning");

    setSubmitting(true);
    try {
      const { error } = await supabase.from('pledges').insert([{
        amount: Number(pledgeData.amount),
        purpose: sanitize(pledgeData.purpose),
        due_date: pledgeData.due_date,
        member_id: pledgeData.member_id
      }]);
      
      if (error) throw error;
      showNotification("Pledge recorded.");
      setOpenPledgeDialog(false);
      setPledgeData({ amount: '', purpose: '', due_date: '', member_id: '' });
    } catch {
      showNotification("Error recording pledge.", "error");
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({ amount: '', description: '', type: 'contribution' });
    setEditingTransaction(null);
  };

  const handleDelete = (id) => {
    if (!canManage) return;
    showConfirmation({
        title: "Delete Entry",
        message: "Are you sure you want to permanently remove this financial record?",
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('transactions').delete().eq('id', id);
                if (error) throw error;
                showNotification("Record removed successfully.");
            } catch (err) { // eslint-disable-line no-unused-vars
                showNotification("Failed to delete record.", "error");
            }
        }
    });
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 8 }}>
        <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 1.5 }}>Financial Management</Typography>
            <Typography variant="body1" color="text.secondary">Track contributions and expenditures across the ministry.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<Download size={18}/>} sx={{ borderRadius: 999 }}>Export</Button>
            {canManage && (
                <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => { resetForm(); setOpenLogDialog(true); }} sx={{ borderRadius: 999 }}>Add Entry</Button>
            )}
        </Stack>
      </Stack>

      {/* Stats Grid */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid xs={12} md={3}>
              <StatCard title="Net Balance" value={`GHC ${stats.balance.toLocaleString()}`} label="Available funds" color={theme.palette.primary.main} icon={DollarSign} />
          </Grid>
          <Grid xs={12} md={3}>
              <StatCard title="Total Revenue" value={`GHC ${stats.income.toLocaleString()}`} label="Cumulative contributions" color={theme.palette.success.main} icon={TrendingUp} />
          </Grid>
          <Grid xs={12} md={3}>
              <StatCard title="Total Expenses" value={`GHC ${stats.expense.toLocaleString()}`} label="Cumulative spending" color={theme.palette.error.main} icon={TrendingDown} />
          </Grid>
          <Grid xs={12} md={3}>
              <StatCard title="Total Pledges" value={`GHC ${stats.totalPledged.toLocaleString()}`} label="Outstanding commitments" color={theme.palette.warning.main} icon={Filter} />
          </Grid>
      </Grid>

      {/* Toolbar */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 48, '& .MuiTab-root': { py: 1, px: 3, borderRadius: 999, minHeight: 48, textTransform: 'none', fontWeight: 800, fontSize: '0.9rem' }, '& .MuiTabs-indicator': { display: 'none' }, '& .Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main } }}>
              <Tab label="All Transactions" value="all" />
              <Tab label="Revenue" value="income" />
              <Tab label="Expenses" value="expense" />
              <Tab label="Pledges & Welfare" value="pledges" />
          </Tabs>
          {activeTab === 'pledges' && canManage && (
              <Button size="small" variant="outlined" startIcon={<Plus size={16}/>} onClick={() => setOpenPledgeDialog(true)} sx={{ borderRadius: 999 }}>Record Pledge</Button>
          )}
      </Box>

      {/* Ledger Table (Double-Bezel) */}
      <Box sx={{ p: 1, borderRadius: '36px', bgcolor: theme.palette.mode === 'light' ? 'rgba(44,36,33,0.02)' : 'rgba(242,240,235,0.02)', border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ borderRadius: '28px', bgcolor: 'background.paper', overflow: 'hidden' }}>
              <TableContainer sx={{ maxHeight: '700px', overflow: 'auto' }}>
          <Table stickyHeader size="small">
              <TableHead>
                  {activeTab === 'pledges' ? (
                      <TableRow>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }}>Member</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }}>Purpose</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }}>Due Date</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }} align="right">Amount</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }} align="right">Status</TableCell>
                      </TableRow>
                  ) : (
                      <TableRow>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }} align="right">Amount</TableCell>
                          <TableCell sx={{ fontWeight: 800, bgcolor: theme.palette.background.paper, py: 1.5 }} align="right">Actions</TableCell>
                      </TableRow>
                  )}
              </TableHead>
              <TableBody>
                  {loading && transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : activeTab === 'pledges' ? (
                      filteredPledges.map((p) => (
                          <TableRow key={p.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{p.members?.name || 'Unknown'}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{p.purpose}</TableCell>
                              <TableCell sx={{ fontSize: '0.85rem' }}>{p.due_date ? format(safeParseDate(p.due_date), 'MMM dd, yyyy') : 'No date'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800 }}>GHC {Number(p.amount).toLocaleString()}</TableCell>
                              <TableCell align="right">
                                  <Chip label={p.status || 'Pending'} size="small" color={p.status === 'paid' ? 'success' : 'warning'} variant="soft" sx={{ borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} />
                              </TableCell>
                          </TableRow>
                      ))
                  ) : filteredTx.map((tx) => (
                      inlineEditTx?.id === tx.id ? (
                          <TableRow key={tx.id} hover sx={{ '& > *': { borderBottom: 'none' }, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                              <TableCell sx={{ py: 1, color: 'text.secondary', fontSize: '0.85rem' }}>{format(safeParseDate(tx.date), 'MMM dd, yyyy')}</TableCell>
                              <TableCell sx={{ py: 1 }}>
                                  <TextField size="small" fullWidth value={inlineEditTx.description} onChange={e => setInlineEditTx({...inlineEditTx, description: e.target.value})} sx={{ minWidth: 150 }} />
                              </TableCell>
                              <TableCell sx={{ py: 1 }}>
                                  <Select size="small" value={inlineEditTx.type} onChange={e => setInlineEditTx({...inlineEditTx, type: e.target.value})} sx={{ minWidth: 120 }}>
                                      <MenuItem value="contribution">Revenue</MenuItem>
                                      <MenuItem value="expense">Expense</MenuItem>
                                  </Select>
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1 }}>
                                  <TextField size="small" type="number" fullWidth value={inlineEditTx.amount} onChange={e => setInlineEditTx({...inlineEditTx, amount: e.target.value})} sx={{ minWidth: 100, textAlign: 'right' }} inputProps={{ style: { textAlign: 'right' } }} />
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1 }}>
                                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                      <IconButton size="small" color="primary" onClick={handleInlineSave}><Save size={16}/></IconButton>
                                      <IconButton size="small" color="error" onClick={() => setInlineEditTx(null)}><X size={16}/></IconButton>
                                  </Stack>
                              </TableCell>
                          </TableRow>
                      ) : (
                      <TableRow key={tx.id} hover>
                          <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: '0.85rem' }}>{format(safeParseDate(tx.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{tx.description}</TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                              <Chip 
                                label={tx.type === 'contribution' ? 'Revenue' : 'Expense'} 
                                size="small" 
                                color={tx.type === 'contribution' ? 'success' : 'error'}
                                variant="soft"
                                sx={{ borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} 
                              />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" fontWeight={800} color={tx.type === 'contribution' ? 'success.main' : 'error.main'}>
                                  {tx.type === 'contribution' ? '+' : '-'} GHC {Number(tx.amount).toLocaleString()}
                              </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                              {canManage && (
                                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', opacity: 0.6, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                                  <IconButton size="small" onClick={() => setInlineEditTx(tx)}><Edit2 size={16}/></IconButton>
                                  <IconButton size="small" color="error" onClick={() => handleDelete(tx.id)}><Trash2 size={16}/></IconButton>
                                </Stack>
                              )}
                          </TableCell>
                      </TableRow>
                      )
                  ))}
                  {((activeTab === 'pledges' && filteredPledges.length === 0) || (activeTab !== 'pledges' && filteredTx.length === 0)) && !loading && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography variant="body2" color="text.disabled">No records found matching current filters.</Typography></TableCell></TableRow>
                  )}
              </TableBody>
          </Table>
              </TableContainer>
          </Box>
      </Box>

      {/* Log Dialog */}
      <Dialog open={openLogDialog} onClose={() => setOpenLogDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>{editingTransaction ? 'Edit Transaction' : 'Record New Entry'}</Typography>
          
          <Stack spacing={3}>
              <Stack direction="row" spacing={1} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04), p: 0.5, borderRadius: 2 }}>
                  <Button 
                    fullWidth 
                    size="small"
                    variant={formData.type === 'contribution' ? 'contained' : 'text'} 
                    onClick={() => setFormData({...formData, type: 'contribution'})}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Revenue
                  </Button>
                  <Button 
                    fullWidth 
                    size="small"
                    variant={formData.type === 'expense' ? 'contained' : 'text'} 
                    color="error" 
                    onClick={() => setFormData({...formData, type: 'expense'})}
                    sx={{ borderRadius: 1.5 }}
                  >
                    Expense
                  </Button>
              </Stack>
              <TextField fullWidth label="Amount (GHC)" type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              <TextField fullWidth label="Description" multiline rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </Stack>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenLogDialog(false)}>Cancel</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handleTransaction}>{editingTransaction ? 'Update' : 'Confirm'}</Button>
          </Box>
      </Dialog>

      {/* Pledge Dialog */}
      <Dialog open={openPledgeDialog} onClose={() => setOpenPledgeDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 3, p: 3 } } }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Record Member Pledge</Typography>
          <Stack spacing={3}>
              <FormControl fullWidth>
                  <InputLabel>Member</InputLabel>
                  <Select 
                    value={pledgeData.member_id} 
                    onChange={(e) => setPledgeData({...pledgeData, member_id: e.target.value})}
                    label="Member"
                  >
                      {members.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
              </FormControl>
              <TextField fullWidth label="Amount (GHC)" type="number" value={pledgeData.amount} onChange={(e) => setPledgeData({...pledgeData, amount: e.target.value})} />
              <TextField fullWidth label="Purpose / Project" value={pledgeData.purpose} onChange={(e) => setPledgeData({...pledgeData, purpose: e.target.value})} />
              <TextField fullWidth label="Due Date" type="date" value={pledgeData.due_date} onChange={(e) => setPledgeData({...pledgeData, due_date: e.target.value})} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenPledgeDialog(false)}>Cancel</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handlePledge}>Confirm Pledge</Button>
          </Box>
      </Dialog>
    </Box>
  );
};

export default Financials;
