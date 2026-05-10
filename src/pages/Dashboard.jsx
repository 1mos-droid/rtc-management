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
  CardContent
} from '@mui/material';
import {
  Users,
  DollarSign,
  Calendar,
  ArrowRight,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity
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
  const { isDeptHead } = useAuth();
  
  const canViewFinancials = isDeptHead;
  const canViewFamily = isDeptHead; 
  // isMember removed
  
  const [data, setData] = useState({
    members: [],
    transactions: [],
    events: [],
    bibleStudies: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queries = [
          supabase.from('events').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5),
          supabase.from('bible_studies').select('*').limit(5),
        ];

        if (canViewFamily) {
          queries.push(supabase.from('members').select('*').order('created_at', { ascending: false }).limit(5));
        }
        if (canViewFinancials) {
          queries.push(supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100));
        }

        const results = await Promise.all(queries);
        
        setData({
          events: results[0].data || [],
          bibleStudies: results[1].data || [],
          members: canViewFamily ? (results[2]?.data || []) : [],
          transactions: canViewFinancials ? (results[canViewFamily ? 3 : 2]?.data || []) : [],
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [canViewFamily, canViewFinancials]);

  const filteredData = useMemo(() => ({
    members: filterData(data.members || []) || [],
    transactions: filterData(data.transactions || []) || [],
    events: filterData(data.events || []) || [],
    bibleStudies: filterData(data.bibleStudies || []) || [],
  }), [data, filterData]);

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
      <Box sx={{ mb: 6 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Welcome back,</Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening in the {workspace === 'main' ? 'Main Sanctuary' : workspace} today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {canViewFamily && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Members" value={filteredData.members.length.toLocaleString()} subValue="+12% from last month" icon={Users} color={theme.palette.primary.main} />
          </Grid>
        )}
        {canViewFinancials && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Giving" value={`GHC ${totalFunds.toLocaleString()}`} subValue="+5.4% from last week" icon={DollarSign} color={theme.palette.success.main} />
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={StatCard ? 3 : 6}>
          <StatCard title="Upcoming Events" value={filteredData.events.length} subValue="Next 7 days" icon={Calendar} color={theme.palette.info.main} />
        </Grid>
        <Grid item xs={12} sm={6} md={StatCard ? 3 : 6}>
          <StatCard title="System Health" value="Active" subValue="All services online" icon={Activity} color={theme.palette.secondary.main} />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Main Chart Area */}
        {canViewFinancials && chartData.length > 0 && (
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>Giving Overview</Typography>
                  <Typography variant="caption" color="text.secondary">Financial trajectory for the current period</Typography>
                </Box>
                <Button size="small" endIcon={<ArrowUpRight size={16} />}>View Report</Button>
              </Stack>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
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
        )}

        {/* Side Feed */}
        <Grid item xs={12} lg={canViewFinancials ? 4 : 12}>
          <Stack spacing={4}>
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
    </Box>
  );
};

export default Dashboard;
