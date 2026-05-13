import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Skeleton,
  Stack,
  Divider,
  alpha,
  Paper,
  Container,
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Users,
  DollarSign,
  Calendar,
  ArrowRight,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Heart,
  Quote as QuoteIcon,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';
import AddDailyInsightDialog from '../components/AddDailyInsightDialog';

const StatCard = ({ title, value, subValue, icon, color }) => {
  const theme = useTheme();
  const Icon = icon;
  return (
    <Card elevation={0} sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(color || theme.palette.primary.main, 0.1), color: color || theme.palette.primary.main }}>
            <Icon size={20} />
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.secondary">{title}</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>{value}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TrendingUp size={14} style={{ color: theme.palette.success.main }} />
          <Typography variant="caption" fontWeight={600} color="success.main">{subValue}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const { workspace, filterData } = useWorkspace();
  const { isDeptHead, isAdmin, user, hasRole, ROLES } = useAuth();
  
  const canViewFinancials = isDeptHead || isAdmin;
  const canViewFamily = isDeptHead || isAdmin; 
  const isMemberOnly = !isDeptHead && !isAdmin;
  const canManageInsights = hasRole([ROLES.PASTOR, ROLES.ADMIN]);
  
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const queries = [
        supabase.from('events').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5),
        supabase.from('bible_studies').select('*').limit(5),
        supabase.from('members').select('*').order('name', { ascending: true }),
        supabase.from('daily_insights').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(2)
      ];

      if (canViewFinancials) {
        queries.push(supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100));
      }

      const results = await Promise.all(queries);
      let myTx = [];
      
      if (isMemberOnly && user?.email) {
          const { data: mem } = await supabase.from('members').select('id').eq('email', user.email).maybeSingle();
          if (mem) {
              const { data: tx } = await supabase.from('transactions').select('*').eq('member_id', mem.id).order('date', { ascending: false }).limit(5);
              myTx = tx || [];
          }
      }
      
      setData({
        events: results[0].data || [],
        bibleStudies: results[1].data || [],
        allMembers: results[2].data || [],
        insights: results[3].data || [],
        members: canViewFamily ? (results[2]?.data || []).slice(0, 5) : [],
        transactions: canViewFinancials ? (results[4]?.data || []) : [],
        myContributions: myTx,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [canViewFamily, canViewFinancials, isMemberOnly, user]);

  const filteredData = useMemo(() => ({
    allMembers: filterData(data.allMembers || []) || [],
    members: filterData(data.members || []) || [],
    transactions: filterData(data.transactions || []) || [],
    events: filterData(data.events || []) || [],
    bibleStudies: filterData(data.bibleStudies || []) || [],
    myContributions: data.myContributions || [],
  }), [data, filterData]);

  const birthdaysToday = useMemo(() => {
    const today = format(new Date(), 'MM-dd');
    return filteredData.allMembers.filter(m => m.dob && format(safeParseDate(m.dob), 'MM-dd') === today);
  }, [filteredData.allMembers]);

  const totalFunds = useMemo(() => {
    return filteredData.transactions
      .filter(t => t.type === 'contribution')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredData.transactions]);

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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={32} thickness={5} />
    </Box>
  );

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
            <Typography variant="h2" sx={{ mb: 1 }}>Welcome back,</Typography>
            <Typography variant="body1" color="text.secondary">
            Here's what's happening in the {workspace === 'main' ? 'Main Sanctuary' : workspace} today.
            </Typography>
        </Box>
        {canManageInsights && (
            <Button 
                variant="outlined" 
                startIcon={<Plus size={18} />} 
                onClick={() => setInsightDialogOpen(true)}
                sx={{ borderRadius: 100 }}
            >
                Share Inspiration
            </Button>
        )}
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {canViewFamily && (
          <Grid xs={12} sm={6} md={3}>
            <StatCard title="Total Members" value={filteredData.allMembers.length.toLocaleString()} subValue="+12% from last month" icon={Users} color={theme.palette.primary.main} />
          </Grid>
        )}
        {canViewFinancials && (
          <Grid xs={12} sm={6} md={3}>
            <StatCard title="Total Giving" value={`GHC ${totalFunds.toLocaleString()}`} subValue="+5.4% from last week" icon={DollarSign} color={theme.palette.success.main} />
          </Grid>
        )}
        <Grid xs={12} sm={6} md={3}>
          <StatCard title="Upcoming Events" value={filteredData.events.length} subValue="Next 7 days" icon={Calendar} color={theme.palette.info.main} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard title="System Health" value="Active" subValue="All services online" icon={Activity} color={theme.palette.secondary.main} />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Main Chart Area or Member Welcome */}
        {canViewFinancials && chartData.length > 0 ? (
          <Grid xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Giving Overview</Typography>
                  <Typography variant="caption" color="text.secondary">Financial trajectory for the current period</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowUpRight size={16} />}>View Report</Button>
              </Stack>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3], padding: '12px' }}
                      itemStyle={{ fontWeight: 700, fontSize: '14px' }}
                    />
                    <Area type="monotone" dataKey="amt" stroke={theme.palette.primary.main} strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        ) : (
            <Grid xs={12} lg={8}>
                <Paper elevation={0} sx={{ p: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${theme.palette.divider}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h4" fontWeight={900} gutterBottom>Grace & Peace, {user?.name?.split(' ')[0]}</Typography>
                    
                    {data.insights.length > 0 ? (
                        <Box sx={{ mt: 2 }}>
                            {data.insights.map((insight, idx) => (
                                <Box key={insight.id} sx={{ mb: idx === 0 && data.insights.length > 1 ? 4 : 0 }}>
                                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, color: 'secondary.main' }}>
                                        {insight.type === 'verse' ? <BookOpen size={16} /> : <QuoteIcon size={16} />}
                                        <Typography variant="overline" sx={{ fontWeight: 800 }}>{insight.type === 'verse' ? 'Verse of the Day' : 'Daily Quote'}</Typography>
                                    </Stack>
                                    <Typography variant="h5" sx={{ mb: 2, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', color: 'text.primary' }}>
                                        "{insight.content}"
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                                        — {insight.type === 'verse' ? insight.reference : insight.author}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
                            "But grow in the grace and knowledge of our Lord and Savior Jesus Christ. To him be glory both now and forever! Amen." — 2 Peter 3:18
                        </Typography>
                    )}
                    
                    <Button variant="contained" component={Link} to="/prayer-requests" sx={{ alignSelf: 'flex-start', mt: 4 }}>Submit Prayer Request</Button>
                </Paper>
            </Grid>
        )}

        {/* Side Feed */}
        <Grid xs={12} lg={4}>
          <Stack spacing={4}>
            {/* My Recent Giving (For Members) */}
            {isMemberOnly && filteredData.myContributions.length > 0 && (
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>My Recent Giving</Typography>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                        <Stack spacing={2}>
                            {filteredData.myContributions.map(tx => (
                                <Stack key={tx.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={700}>{tx.description}</Typography>
                                        <Typography variant="caption" color="text.secondary">{format(safeParseDate(tx.date), 'MMM dd, yyyy')}</Typography>
                                    </Box>
                                    <Typography variant="body2" fontWeight={800} color="success.main">GHC {Number(tx.amount).toLocaleString()}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Paper>
                </Box>
            )}

            {/* Birthdays Today */}
            {birthdaysToday.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Today's Birthdays 🎂</Typography>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}` }}>
                  <Stack spacing={2}>
                    {birthdaysToday.map(m => (
                      <Stack key={m.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.main', fontSize: '0.75rem', fontWeight: 800 }}>{m.name?.charAt(0)}</Avatar>
                        <Typography variant="body2" fontWeight={700}>{m.name}</Typography>
                        <Chip label="Celebrate" size="small" variant="soft" color="warning" sx={{ ml: 'auto', fontWeight: 800, fontSize: '0.6rem' }} />
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Box>
            )}

            {/* Recent Members */}
            {canViewFamily && (
              <Box>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={800}>Recent Members</Typography>
                  <Button component={Link} to="/members" size="small">See All</Button>
                </Stack>
                <Stack spacing={2}>
                  {filteredData.members.map((m) => (
                    <Paper key={m.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>
                        {m.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{m.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.department || 'General'}</Typography>
                      </Box>
                      <IconButton size="small"><ArrowRight size={16} /></IconButton>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Upcoming Events */}
            <Box>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={800}>Upcoming Events</Typography>
                <Button component={Link} to="/events" size="small">View Calendar</Button>
              </Stack>
              <Stack spacing={2}>
                {filteredData.events.map((e) => (
                  <Paper key={e.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ lineHeight: 1 }}>{format(safeParseDate(e.date), 'MMM')}</Typography>
                      <Typography variant="body2" fontWeight={900}>{format(safeParseDate(e.date), 'dd')}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{e.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{e.location}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
      
      <AddDailyInsightDialog 
        open={insightDialogOpen} 
        onClose={() => setInsightDialogOpen(false)} 
        onSuccess={fetchDashboardData}
      />
    </Box>
  );
};

export default Dashboard;
