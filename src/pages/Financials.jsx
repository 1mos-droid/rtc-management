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
  CircularProgress
} from '@mui/material';
import { 
  Plus, 
  Download,
  Wallet,
  Trash2,
  Edit2,
  ArrowUpRight,
  Droplets,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabase';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';
import { safeParseDate } from '../utils/dateUtils';

const StewardshipCard = ({ title, value, label, color }) => {
    const theme = useTheme();
    return (
        <Box>
            <Paper elevation={0} sx={{ 
                p: { xs: 2.5, md: 3 }, borderRadius: 6, border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(color, 0.02), position: 'relative', overflow: 'hidden'
            }}>
                <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2 }}>{title}</Typography>
                <Typography variant="h3" sx={{ my: 0.5, fontWeight: 900, fontFamily: 'DM Serif Display', color: color, fontSize: { xs: '1.5rem', md: '2.5rem' } }}>{value}</Typography>
                <Chip label={label} size="small" sx={{ borderRadius: 1, fontWeight: 800, bgcolor: alpha(color, 0.1), color: color, fontSize: '0.65rem' }} />
            </Paper>
        </Box>
    );
};

const Financials = () => {
  const theme = useTheme();
  const { filterData, showNotification, showConfirmation, isBranchRestricted, userBranch } = useWorkspace();
  const { isDeptHead, user, effectiveRole, ROLES } = useAuth();
  const canManage = isDeptHead; // Includes Admin and Developer
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ amount: '', description: '', type: 'contribution', category: isBranchRestricted ? userBranch : 'Mallam' });
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
      showNotification("Financial records sync failed.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTransactions(); // eslint-disable-line react-hooks/set-state-in-effect

    const channel = supabase
      .channel('financial-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTransactions)
      .subscribe();

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
      window.dispatchEvent(new CustomEvent('rtci-security-alert', { detail: { type: 'injection_attempt' } }));
      return;
    }

    setSubmitting(true);
    try {
      const sanitizedDescription = sanitize(formData.description);
      const txDepartment = (effectiveRole === ROLES.DEPARTMENT_HEAD) ? user.department : null;
      
      const txData = { 
        ...formData, 
        description: sanitizedDescription,
        amount: Number(formData.amount), 
        department: txDepartment,
        date: editingTransaction ? editingTransaction.date : new Date().toISOString() 
      };

      if (editingTransaction) {
        const { error } = await supabase.from('transactions').update(txData).eq('id', editingTransaction.id);
        if (error) throw error;
        showNotification("Record updated.");
      } else {
        const { error } = await supabase.from('transactions').insert([txData]);
        if (error) throw error;
        showNotification("Entry recorded.");
      }
      setOpenLogDialog(false);
      resetForm();
    } catch (error) { 
        console.error(error);
        showNotification("Error logging stewardship.", "error"); 
    }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({ amount: '', description: '', type: 'contribution' });
    setEditingTransaction(null);
  };

  const handleDelete = (id) => {
    if (!canManage) return;
    showConfirmation({
        title: "Delete Entry",
        message: "Remove this financial record permanently?",
        onConfirm: async () => { 
            try {
                const { error } = await supabase.from('transactions').delete().eq('id', id);
                if (error) throw error;
                showNotification("Record removed.");
            } catch (err) { // eslint-disable-line no-unused-vars
                showNotification("Failed to delete.", "error");
            }
        }
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* --- REFINED HEADER --- */}
      <Box sx={{ mb: { xs: 5, md: 8 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                <Droplets size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'secondary.main' }}>TREASURY & STEWARDSHIP</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: "space-between", alignItems: "flex-end", gap: 3 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 400, color: 'primary.main', mb: 1.5, fontSize: { xs: '2rem', md: '3.5rem' } }}>The Flow of Grace</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, fontFamily: 'Lora', fontStyle: 'italic', fontSize: '1rem' }}>
                Diligent management of the resources entrusted to us, ensuring every seed sown bears fruit for the kingdom.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
             <Button variant="outlined" size="small" startIcon={<Download size={16} />} onClick={() => { showNotification("Export features are currently being synchronized.", "info"); }}>Export</Button>
             {canManage && (
                <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => { resetForm(); setOpenLogDialog(true); }}>New Entry</Button>
             )}
          </Stack>
        </Stack>
      </Box>

      {/* --- MASTERPIECE CARDS --- */}
      <Grid container spacing={4} sx={{ mb: 12 }}>
          <Grid size={{ xs: 12, md: 4 }}>
              <StewardshipCard title="NET STEWARDSHIP" value={`GHC ${stats.balance.toLocaleString()}`} label="Current Balance" color={theme.palette.primary.main} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
              <StewardshipCard title="ABUNDANCE" value={`GHC ${stats.income.toLocaleString()}`} label="Total Revenue" color={theme.palette.secondary.main} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
              <StewardshipCard title="ALLOCATION" value={`GHC ${stats.expense.toLocaleString()}`} label="Total Expenditure" color="#D48166" />
          </Grid>
      </Grid>

      {/* --- THE LEDGER --- */}
      <Box sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 6 }}>
          {['all', 'income', 'expense'].map((t) => (
              <Button 
                key={t}
                onClick={() => setActiveTab(t)}
                sx={{ 
                    borderRadius: 0, pb: 2, px: 0, minWidth: 'auto',
                    fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.7rem',
                    color: activeTab === t ? 'primary.main' : 'text.disabled',
                    borderBottom: `3px solid ${activeTab === t ? theme.palette.primary.main : 'transparent'}`
                }}
              >
                  {t}
              </Button>
          ))}
      </Box>

      <TableContainer component={Box}>
          <Table>
              <TableHead>
                  <TableRow>
                      {['POSTING DATE', 'DESCRIPTION', 'NATURE', 'STEWARDSHIP', ''].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.6rem', border: 'none', color: 'text.disabled' }}>{h}</TableCell>
                      ))}
                  </TableRow>
              </TableHead>
              <TableBody>
                  {loading && transactions.length === 0 ? <TableRow><TableCell colSpan={5}><CircularProgress /></TableCell></TableRow> : filteredTx.map((tx) => (
                      <TableRow key={tx.id} hover sx={{ transition: 'background 0.3s', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                          <TableCell sx={{ py: 2, fontWeight: 800, color: 'text.secondary', fontSize: '0.8rem' }}>{format(safeParseDate(tx.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'DM Serif Display' }}>{tx.description}</TableCell>
                          <TableCell>
                              <Chip label={tx.type} size="small" sx={{ borderRadius: 1, fontWeight: 900, fontSize: '0.55rem', bgcolor: tx.type === 'contribution' ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05), color: tx.type === 'contribution' ? 'success.main' : 'error.main' }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, fontFamily: 'DM Serif Display', fontSize: '1rem' }}>
                              <Typography color={tx.type === 'contribution' ? 'primary.main' : 'error.main'} fontWeight={900} sx={{ fontSize: 'inherit' }}>
                                  {tx.type === 'contribution' ? '+' : '-'} GHC {Number(tx.amount).toLocaleString()}
                              </Typography>
                          </TableCell>
                          <TableCell align="right">
                              {canManage && (
                                <>
                                  <IconButton size="small" onClick={() => { setEditingTransaction(tx); setFormData({ amount: tx.amount, description: tx.description, type: tx.type, category: tx.category }); setOpenLogDialog(true); }}><Edit2 size={14}/></IconButton>
                                  <IconButton size="small" color="error" onClick={() => handleDelete(tx.id)}><Trash2 size={14}/></IconButton>
                                </>
                              )}
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </TableContainer>

      {/* Log Dialog */}
      <Dialog open={openLogDialog} onClose={() => setOpenLogDialog(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 6, p: 6, border: `1px solid ${theme.palette.divider}` } } }}>
          <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={2}>LEDGER ENTRY</Typography>
          <Typography variant="h3" sx={{ fontWeight: 400, mt: 1, mb: 6, fontFamily: 'DM Serif Display' }}>{editingTransaction ? 'Modify Record' : 'Record Grace'}</Typography>
          
          <Stack spacing={4}>
              <Stack direction="row" spacing={1} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), p: 1, borderRadius: 100 }}>
                  <Button fullWidth variant={formData.type === 'contribution' ? 'contained' : 'text'} onClick={() => setFormData({...formData, type: 'contribution'})}>Revenue</Button>
                  <Button fullWidth variant={formData.type === 'expense' ? 'contained' : 'text'} color="error" onClick={() => setFormData({...formData, type: 'expense'})}>Expense</Button>
              </Stack>
              <TextField fullWidth label="Amount (GHC)" type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              <TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </Stack>
          
          <Box sx={{ mt: 8, display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenLogDialog(false)}>Discard</Button>
              <Button fullWidth variant="contained" disabled={submitting} onClick={handleTransaction}>Confirm Log</Button>
          </Box>
      </Dialog>
    </Box>
  );
};

export default Financials;
