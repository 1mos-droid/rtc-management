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
  Tabs
} from '@mui/material';
import { 
  Plus, 
  Download,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Filter,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';
import { safeParseDate } from '../utils/dateUtils';

const StatCard = ({ title, value, label, color, icon }) => {
    const theme = useTheme();
    const Icon = icon;
    return (
        <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(color, 0.1), color: color }}>
                        <Icon size={20} />
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{title}</Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>{value}</Typography>
                <Typography variant="caption" fontWeight={600} color="text.disabled">{label}</Typography>
            </CardContent>
        </Card>
    );
};

const Financials = () => {
  const theme = useTheme();
  const { filterData, showNotification, showConfirmation } = useWorkspace();
  const { isDeptHead } = useAuth();
  const canManage = isDeptHead;
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({ amount: '', description: '', type: 'contribution' });
  const [editingTransaction, setEditingTransaction] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(2000);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) { // eslint-disable-line no-unused-vars
      showNotification("Failed to fetch financial records.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTransactions(); // eslint-disable-line react-hooks/set-state-in-effect
    const channel = supabase.channel('financial-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchTransactions]);

  const filteredTx = useMemo(() => {
    let filtered = filterData(transactions);
    if (activeTab === 'income') filtered = filtered.filter(t => t.type === 'contribution');
    if (activeTab === 'expense') filtered = filtered.filter(t => t.type === 'expense');
    return filtered;
  }, [transactions, activeTab, filterData]);

  const stats = useMemo(() => {
    const income = filteredTx.filter(t => t.type === 'contribution').reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const expense = filteredTx.filter(t => t.type === 'expense').reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTx]);

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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 6 }}>
        <Box>
            <Typography variant="h2">Financial Management</Typography>
            <Typography variant="body1" color="text.secondary">Track contributions and expenditures across the ministry.</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<Download size={18}/>}>Export</Button>
            {canManage && (
                <Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => { resetForm(); setOpenLogDialog(true); }}>Add Entry</Button>
            )}
        </Stack>
      </Stack>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
              <StatCard title="Net Balance" value={`GHC ${stats.balance.toLocaleString()}`} label="Available funds" color={theme.palette.primary.main} icon={DollarSign} />
          </Grid>
          <Grid item xs={12} md={4}>
              <StatCard title="Total Revenue" value={`GHC ${stats.income.toLocaleString()}`} label="Cumulative contributions" color={theme.palette.success.main} icon={TrendingUp} />
          </Grid>
          <Grid item xs={12} md={4}>
              <StatCard title="Total Expenses" value={`GHC ${stats.expense.toLocaleString()}`} label="Cumulative spending" color={theme.palette.error.main} icon={TrendingDown} />
          </Grid>
      </Grid>

      {/* Toolbar */}
      <Box sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="All Transactions" value="all" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Revenue" value="income" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Expenses" value="expense" sx={{ textTransform: 'none', fontWeight: 700 }} />
          </Tabs>
      </Box>

      {/* Ledger Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
                  <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                  {loading && transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : filteredTx.map((tx) => (
                      <TableRow key={tx.id} hover>
                          <TableCell sx={{ py: 2, color: 'text.secondary', fontSize: '0.85rem' }}>{format(safeParseDate(tx.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{tx.description}</TableCell>
                          <TableCell>
                              <Chip 
                                label={tx.type === 'contribution' ? 'Revenue' : 'Expense'} 
                                size="small" 
                                color={tx.type === 'contribution' ? 'success' : 'error'}
                                variant="soft"
                                sx={{ borderRadius: 1, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} 
                              />
                          </TableCell>
                          <TableCell align="right">
                              <Typography variant="body2" fontWeight={800} color={tx.type === 'contribution' ? 'success.main' : 'error.main'}>
                                  {tx.type === 'contribution' ? '+' : '-'} GHC {Number(tx.amount).toLocaleString()}
                              </Typography>
                          </TableCell>
                          <TableCell align="right">
                              {canManage && (
                                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                  <IconButton size="small" onClick={() => { setEditingTransaction(tx); setFormData({ amount: tx.amount, description: tx.description, type: tx.type }); setOpenLogDialog(true); }}><Edit2 size={16}/></IconButton>
                                  <IconButton size="small" color="error" onClick={() => handleDelete(tx.id)}><Trash2 size={16}/></IconButton>
                                </Stack>
                              )}
                          </TableCell>
                      </TableRow>
                  ))}
                  {filteredTx.length === 0 && !loading && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography variant="body2" color="text.disabled">No records found matching current filters.</Typography></TableCell></TableRow>
                  )}
              </TableBody>
          </Table>
      </TableContainer>

      {/* Log Dialog */}
      <Dialog open={openLogDialog} onClose={() => setOpenLogDialog(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3, p: 3 } }}>
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
    </Box>
  );
};

export default Financials;
