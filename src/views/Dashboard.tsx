"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Grid,
  Typography,
  Avatar,
  Button,
  IconButton,
  useTheme,
  Stack,
  Divider,
  alpha,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Users,
  DollarSign,
  Calendar,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Heart,
  BookOpen,
  Mail,
  Plane,
  Clock,
  Send,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip 
} from 'recharts';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';
import AddDailyInsightDialog from '../components/AddDailyInsightDialog';

const VANGUARD_MOTION = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

const HUDCard = ({ children, title, subtitle, icon, action }) => {
    const theme = useTheme();
    const Icon = icon;
    return (
        <Box sx={{ 
            height: '100%',
            p: 0.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.divider, 0.5)} 0%, transparent 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            transition: VANGUARD_MOTION,
            '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.4),
                boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.05)}`
            }
        }}>
            <Paper sx={{ 
                height: '100%', 
                p: 3.5, 
                borderRadius: 1.5, 
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                backdropFilter: 'blur(40px)',
                display: 'flex', flexDirection: 'column'
            }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <Box>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                <Icon size={18} />
                            </Box>
                            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 900 }}>{title}</Typography>
                        </Stack>
                        <Typography variant="h4" sx={{ color: 'text.primary' }}>{subtitle}</Typography>
                    </Box>
                    {action}
                </Stack>
                <Box sx={{ flexGrow: 1 }}>
                    {children}
                </Box>
            </Paper>
        </Box>
    );
}

const NestedButton = ({ children, icon, color = 'primary', variant = 'contained', onClick, href, component }) => {
    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';
    const Icon = icon;
    
    const isContained = variant === 'contained';
    
    return (
        <Button 
            variant={variant}
            color={color as any}
            component={component}
            href={href}
            onClick={onClick}
            sx={{ 
                py: 1, 
                pl: 3, 
                pr: 1,
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 2,
                borderRadius: 1,
                '& .icon-circle': {
                    transition: VANGUARD_MOTION,
                },
                '&:hover .icon-circle': {
                    transform: 'scale(1.05) translate(2px, -1px)',
                    bgcolor: isContained ? (isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') : alpha(theme.palette.primary.main, 0.15)
                }
            }}
        >
            {children}
            <Box 
                className="icon-circle"
                sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    bgcolor: isContained ? (isLight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : alpha(theme.palette.primary.main, 0.08), 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: isContained ? 'inherit' : 'primary.main'
                }}
            >
                <Icon size={16} strokeWidth={2.5} />
            </Box>
        </Button>
    );
}

const Dashboard = () => {
  const theme = useTheme();
  const { workspace, filterData, showNotification } = useWorkspace();
  const { isDeptHead, isAdmin, user, hasRole, ROLES } = useAuth();
  
  const canViewFinancials = isDeptHead || isAdmin;
  const canViewFamily = isDeptHead || isAdmin; 
  const canManageInsights = hasRole([ROLES.PASTOR, ROLES.ADMIN]);
  const canViewCareQueue = hasRole([ROLES.PASTOR, ROLES.ADMIN, ROLES.DEVELOPER]);
  
  const [data, setData] = useState({
    members: [],
    transactions: [],
    events: [],
    bibleStudies: [],
    allMembers: [],
    myContributions: [],
    insights: []
  });
  const [loading, setLoading] = useState(true);
  const [insightDialogOpen, setInsightDialogOpen] = useState(false);
  const [careQueue, setCareQueue] = useState<any[]>([]);
  const [careDialogOpen, setCareDialogOpen] = useState(false);
  const [selectedCareItem, setSelectedCareItem] = useState<any>(null);
  const [customCareMessage, setCustomCareMessage] = useState('');

  const handleResolveCare = async (id, memberName) => {
    try {
      const { error } = await supabase
        .from('care_recommendations')
        .update({ status: 'Resolved' })
        .eq('id', id);
      if (error) throw error;
      setCareQueue(prev => prev.filter(item => item.id !== id));
      showNotification(`Care follow-up for ${memberName} marked as resolved.`, 'success');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to resolve care follow-up for ${memberName}.`, 'error');
    }
  };

  const handleSnoozeCare = async (id, memberName, graceReason) => {
    try {
      const { error } = await supabase
        .from('care_recommendations')
        .update({ status: 'Ignored', pastoral_notes: `Snoozed: ${graceReason}` })
        .eq('id', id);
      if (error) throw error;
      setCareQueue(prev => prev.filter(item => item.id !== id));
      showNotification(`Grace applied for ${memberName} (Status: ${graceReason}).`, 'info');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to apply grace for ${memberName}.`, 'error');
    }
  };

  const handleOpenCareDialog = (item) => {
    setSelectedCareItem(item);
    setCustomCareMessage(`Dear ${item.members?.name || 'Disciple'},\n\nWe missed your warm presence at fellowship recently! Hoping all is well. Please reach out if there is anything we can support or pray with you for.\n\nBlessings,\nYour pastoral care team at RTCI.`);
    setCareDialogOpen(true);
  };

  const handleSendCareMessage = async () => {
    if (!selectedCareItem) return;
    try {
      const { error } = await supabase
        .from('care_recommendations')
        .update({ 
          status: 'Contacted', 
          pastoral_notes: customCareMessage 
        })
        .eq('id', selectedCareItem.id);
      if (error) throw error;

      setCareQueue(prev => prev.map(item => 
        item.id === selectedCareItem.id 
          ? { ...item, status: 'Contacted', pastoral_notes: customCareMessage } 
          : item
      ));
      setCareDialogOpen(false);
      showNotification(`Care message dispatched successfully to ${selectedCareItem.members?.name || 'Disciple'}.`, 'success');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to send care message to ${selectedCareItem.members?.name || 'Disciple'}.`, 'error');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const queries = [
        supabase.from('events').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5),
        supabase.from('members').select('*').order('name', { ascending: true }),
        supabase.from('daily_insights').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1)
      ];

      if (canViewFinancials) {
        queries.push(supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100));
      }

      const results = await Promise.all(queries);
      
      setData({
        events: results[0].data || [],
        allMembers: results[1].data || [],
        insights: results[2].data || [],
        members: canViewFamily ? (results[1]?.data || []).slice(0, 5) : [],
        transactions: canViewFinancials ? (results[3]?.data || []) : [],
        bibleStudies: [],
        myContributions: []
      });

      if (canViewCareQueue) {
        const { data: careData, error: careErr } = await supabase
          .from('care_recommendations')
          .select('*, members(name, email, department, phone)')
          .neq('status', 'Resolved')
          .neq('status', 'Ignored')
          .order('created_at', { ascending: false })
          .limit(10);
        if (careErr) throw careErr;
        setCareQueue(careData || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [canViewFamily, canViewFinancials]);

  const filteredData = useMemo(() => ({
    allMembers: filterData(data.allMembers || []) || [],
    transactions: filterData(data.transactions || []) || [],
    events: filterData(data.events || []) || [],
  }), [data, filterData]);

  const chartData = useMemo(() => {
    const incomeByDate = filteredData.transactions
      .filter(t => t.type === 'contribution')
      .reduce((acc, t) => {
        const d = format(safeParseDate(t.date), 'MMM dd');
        acc[d] = (acc[d] || 0) + (Number(t.amount) || 0);
        return acc;
      }, {});
    return Object.entries(incomeByDate).map(([name, amt]) => ({ name, amt })).slice(-7);
  }, [filteredData.transactions]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress size={40} thickness={2} sx={{ color: 'primary.main' }} />
    </Box>
  );

  return (
    <Box>
      {/* Top Welcome & Insight (The Hero) */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid xs={12} lg={7}>
            <Box sx={{ p: 6, borderRadius: 2, position: 'relative', overflow: 'hidden', minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.4, backgroundImage: `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 40%), radial-gradient(circle at 0% 100%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 40%)` }} />
                
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="overline" sx={{ color: 'primary.main', mb: 2, display: 'block', fontWeight: 900 }}>VANGUARD TERMINAL // ACTIVE</Typography>
                    <Typography variant="h1" sx={{ mb: 3, fontSize: '3.5rem' }}>Welcome, {user?.name?.split(' ')[0]}</Typography>
                    <Typography variant="body1" sx={{ maxWidth: 500, color: 'text.secondary', mb: 4 }}>
                        System reporting for {workspace} sanctuary. All ministry channels are currently operational. Submit requests or analyze telemetry below.
                    </Typography>
                    <Stack direction="row" spacing={3}>
                        <NestedButton onClick={() => {}} icon={Zap}>Quick Command</NestedButton>
                        <NestedButton variant="outlined" icon={Layers} component={Link} href="/members">View Assets</NestedButton>
                    </Stack>
                </Box>
            </Box>
        </Grid>

        <Grid xs={12} lg={5}>
            <HUDCard title="Illuminated Insight" subtitle="Daily Revelation" icon={BookOpen} action={
                canManageInsights ? <IconButton onClick={() => setInsightDialogOpen(true)} color="primary"><Plus size={20}/></IconButton> : null
            }>
                <Box sx={{ py: 2 }}>
                    <Typography variant="h4" sx={{ fontStyle: 'italic', mb: 4, lineHeight: 1.4, color: 'text.primary' }}>
                        "{data.insights[0]?.content || "But grow in the grace and knowledge of our Lord and Savior Jesus Christ."}"
                    </Typography>
                    <Typography variant="overline" sx={{ color: 'primary.main' }}>
                        — {data.insights[0]?.reference || "2 Peter 3:18"}
                    </Typography>
                </Box>
            </HUDCard>
        </Grid>
      </Grid>

      {/* Care Queue Section (Restored & Redesigned) */}
      {canViewCareQueue && careQueue.length > 0 && (
          <Box sx={{ mb: 6 }}>
              <HUDCard title="Care Telemetry" subtitle="Fellowship Care Queue" icon={Heart}>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                      {careQueue.map((item) => (
                          <Grid key={item.id} xs={12} md={6}>
                              <Paper sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                                      <Avatar sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 900 }}>{item.members?.name ? item.members.name.charAt(0) : 'U'}</Avatar>
                                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                          <Typography variant="subtitle2" fontWeight={800} noWrap>{item.members?.name || 'Unknown Disciple'}</Typography>
                                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>{item.members?.department || 'General'}</Typography>
                                      </Box>
                                      <Chip label={`${item.absence_count} Absences`} size="small" color="error" sx={{ borderRadius: '12px', fontWeight: 900, fontSize: '0.6rem' }} />
                                  </Stack>
                                  <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}>"{item.pastoral_notes}"</Typography>
                                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                      <IconButton size="small" onClick={() => handleSnoozeCare(item.id, item.members?.name || 'Member', 'Leave')}><Plane size={16}/></IconButton>
                                      <IconButton size="small" onClick={() => handleOpenCareDialog(item)} color="primary"><Mail size={16}/></IconButton>
                                      <IconButton size="small" onClick={() => handleResolveCare(item.id, item.members?.name || 'Member')} color="success"><Check size={16}/></IconButton>
                                  </Stack>
                              </Paper>
                          </Grid>
                      ))}
                  </Grid>
              </HUDCard>
          </Box>
      )}

      {/* Primary Analytics (The Bento) */}
      <Grid container spacing={4}>
          <Grid xs={12} lg={8}>
              <HUDCard 
                title="Financial Telemetry" 
                subtitle="Revenue Trajectory" 
                icon={Activity} 
                action={<IconButton component={Link} href="/financials" sx={{ color: 'text.secondary' }}><ArrowUpRight size={20}/></IconButton>}
              >
                  <Box sx={{ height: 350, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="vanguardGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="10 10" vertical={false} stroke={alpha(theme.palette.divider, 0.1)} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: theme.palette.text.disabled }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: theme.palette.text.disabled }} dx={-10} />
                            <ChartTooltip 
                                cursor={{ stroke: theme.palette.primary.main, strokeWidth: 1 }}
                                contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                            />
                            <Area type="stepAfter" dataKey="amt" stroke={theme.palette.primary.main} strokeWidth={2} fillOpacity={1} fill="url(#vanguardGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                  </Box>
              </HUDCard>
          </Grid>

          <Grid xs={12} lg={4}>
              <Stack spacing={4} sx={{ height: '100%' }}>
                  <Paper sx={{ p: 3, flexGrow: 1, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.4), backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}><Users size={24} /></Box>
                      <Box>
                          <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.disabled' }}>Active Disciples</Typography>
                          <Typography variant="h3">{filteredData.allMembers.length}</Typography>
                      </Box>
                      <Chip label="+4" color="success" size="small" sx={{ ml: 'auto', fontWeight: 900, borderRadius: 0 }} />
                  </Paper>
                  <Paper sx={{ p: 3, flexGrow: 1, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.4), backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}><Calendar size={24} /></Box>
                      <Box>
                          <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.disabled' }}>Scheduled Events</Typography>
                          <Typography variant="h3">{filteredData.events.length}</Typography>
                      </Box>
                      <IconButton sx={{ ml: 'auto' }} component={Link} href="/events"><ArrowRight size={20} /></IconButton>
                  </Paper>
                  <Paper sx={{ p: 3, flexGrow: 1, borderRadius: 1.5, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.4), backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Shield size={24} /></Box>
                      <Box>
                          <Typography variant="overline" sx={{ fontWeight: 900, color: 'text.disabled' }}>Security Level</Typography>
                          <Typography variant="h3">Alpha</Typography>
                      </Box>
                  </Paper>
              </Stack>
          </Grid>
      </Grid>

      <AddDailyInsightDialog 
        open={insightDialogOpen} 
        onClose={() => setInsightDialogOpen(false)} 
        onSuccess={fetchDashboardData}
      />

      <Dialog 
        open={careDialogOpen} 
        onClose={() => setCareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 900 }}>Compose Empathy Message</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Review and personalize this care template for <strong>{selectedCareItem?.members?.name}</strong>.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            label="Pastoral Message Content"
            value={customCareMessage}
            onChange={(e) => setCustomCareMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setCareDialogOpen(false)} sx={{ color: 'text.secondary', fontWeight: 800 }}>
            Cancel
          </Button>
          <NestedButton onClick={handleSendCareMessage} icon={Send}>
            Dispatch Care
          </NestedButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
