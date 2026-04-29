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
  useTheme,
  Skeleton,
  Stack,
  Divider,
  alpha,
  Paper,
  Container,
  CircularProgress
} from '@mui/material';
import {
  Users,
  DollarSign,
  Calendar,
  ArrowRight,
  Clock,
  Plus,
  BookOpen,
  Leaf,
  Sparkles,
  Sun
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

const PulseCard = ({ title, value, subValue, color }) => {
  return (
    <Box
      style={{ height: '100%' }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 4 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: `1px solid ${alpha(color, 0.1)}`,
          boxShadow: `0 20px 40px -15px ${alpha(color, 0.08)}`,
          transition: 'all 0.4s ease',
          '&:hover': { 
            transform: 'translateY(-10px)',
            boxShadow: `0 30px 60px -15px ${alpha(color, 0.15)}`,
            '& .icon-bg': { transform: 'scale(1.2) rotate(15deg)' }
          }
        }}
      >
        <Box 
          className="icon-bg"
          sx={{ 
            position: 'absolute', top: -20, right: -20, opacity: 0.05, color: color,
            transition: 'transform 0.6s ease',
            pointerEvents: 'none'
          }}
        >
        </Box>

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 4 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha(color, 0.1), color: color }}>
            </Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={900} sx={{ textTransform: 'uppercase', letterSpacing: 3, fontSize: '0.7rem' }}>
              {title}
            </Typography>
          </Stack>
          
          <Typography variant="h2" sx={{ fontWeight: 400, color: 'text.primary', mb: 1, fontFamily: 'DM Serif Display' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.disabled" fontWeight={700}>
            {subValue}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const { workspace, filterData } = useWorkspace();
  const { isDeptHead, ROLES, effectiveRole } = useAuth();
  
  // Members can't view financials or family stats
  const canViewFinancials = isDeptHead; // RLS will handle scoping
  const canViewFamily = isDeptHead; 
  const isMember = effectiveRole === ROLES.MEMBER;
  
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
          supabase.from('events').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(500),
          supabase.from('bible_studies').select('*').limit(100),
        ];

        if (canViewFamily) {
          queries.push(supabase.from('members').select('*').limit(2000));
        }
        if (canViewFinancials) {
          queries.push(supabase.from('transactions').select('*').order('date', { ascending: false }).limit(2000));
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
    return Object.entries(incomeByDate).map(([name, amt]) => ({ name, amt })).slice(-10);
  }, [filteredData.transactions]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <CircularProgress color="primary" />
    </Box>
  );

  return (
    <Box sx={{ pb: 6 }}>
      {/* --- HERO --- */}
      <Box sx={{ mb: { xs: 4, md: 6 }, position: 'relative' }}>
        <Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                    <Sun size={20} />
                </Box>
                <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'secondary.main' }}>
                    {workspace === 'main' ? 'MAIN SANCTUARY' : workspace.toUpperCase()} PULSE
                </Typography>
            </Stack>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, color: 'primary.main', mb: 2 }}>
                The Living Vine
            </Typography>
            <Typography variant="h5" sx={{ fontStyle: 'italic', color: 'text.secondary', fontFamily: 'Lora', maxWidth: 700, lineHeight: 1.4, fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
                Gathered in grace, connected in love, and thriving in service.
            </Typography>
        </Box>
      </Box>

      {/* --- METRICS --- */}
      <Grid container spacing={3} sx={{ mb: { xs: 6, md: 8 } }}>
        {canViewFamily && (
          <Grid size={{ xs: 12, md: 4 }}>
            <PulseCard title="The Family" value={filteredData.members.length.toLocaleString()} subValue="Souls in the registry" color={theme.palette.primary.main} delay={0.1} />
          </Grid>
        )}
        {canViewFinancials && (
          <Grid size={{ xs: 12, md: 4 }}>
            <PulseCard title="Stewardship" value={`GHC ${totalFunds.toLocaleString()}`} subValue="Congregational seeds" color={theme.palette.secondary.main} delay={0.2} />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: canViewFamily && canViewFinancials ? 4 : 6 }}>
          <PulseCard title="Gatherings" value={filteredData.events.length} subValue="Moments of fellowship" color="#D48166" delay={0.3} />
        </Grid>
        {isMember && (
          <Grid size={{ xs: 12, md: 6 }}>
            <PulseCard title="Library" value={filteredData.bibleStudies.length} subValue="Spiritual resources" color={theme.palette.info.main} delay={0.4} />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={4}>
        {/* --- CHART --- */}
        {canViewFinancials && chartData.length > 0 && (
          <Grid size={{ xs: 12, lg: 7 }}>
            <Typography variant="h4" sx={{ mb: 3, fontFamily: 'DM Serif Display' }}>Abundance Trajectory</Typography>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 8, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
              <Box sx={{ height: { xs: 300, md: 400 }, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.primary.main, 0.1)} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: theme.palette.text.disabled }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 800, fill: theme.palette.text.disabled }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}` }} />
                    <Area type="monotone" dataKey="amt" stroke={theme.palette.primary.main} strokeWidth={3} fillOpacity={1} fill="url(#vGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* --- FAMILY FEED --- */}
        {canViewFamily && (
          <Grid size={{ xs: 12, lg: canViewFinancials ? 5 : 12 }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-end", mb: 5 }}>
              <Box>
                  <Typography variant="h4" sx={{ fontFamily: 'DM Serif Display' }}>New Souls</Typography>
                  <Typography variant="body2" color="text.secondary">Recent family registrations.</Typography>
              </Box>
              <Button component={Link} to="/members" sx={{ fontWeight: 800 }}>View All</Button>
            </Stack>
            <Grid container spacing={3}>
              {filteredData.members.slice(0, canViewFinancials ? 4 : 8).map((m) => (
                  <Grid item xs={12} md={canViewFinancials ? 12 : 6} key={m.id}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${theme.palette.divider}` }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main, fontWeight: 900 }}>{m.name?.charAt(0)}</Avatar>
                          <Box sx={{ flexGrow: 1 }}><Typography variant="body1" fontWeight={800}>{m.name}</Typography><Typography variant="caption" color="text.disabled">{m.department || 'General'}</Typography></Box>
                          <ArrowRight size={16} color={theme.palette.text.disabled} />
                      </Paper>
                  </Grid>
              ))}
            </Grid>
          </Grid>
        )}
        
        {/* --- EVENTS FEED FOR MEMBERS --- */}
        {isMember && (
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-end", mb: 5 }}>
              <Box>
                  <Typography variant="h4" sx={{ fontFamily: 'DM Serif Display' }}>Upcoming Gatherings</Typography>
                  <Typography variant="body2" color="text.secondary">Fellowship moments for your growth.</Typography>
              </Box>
              <Button component={Link} to="/events" sx={{ fontWeight: 800 }}>View All</Button>
            </Stack>
            <Grid container spacing={3}>
              {filteredData.events.slice(0, 6).map((e) => (
                  <Grid item xs={12} md={4} key={e.id}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="subtitle2" fontWeight={900} color="primary.main" sx={{ mb: 1 }}>{format(safeParseDate(e.date), 'MMM dd, yyyy')}</Typography>
                          <Typography variant="body1" fontWeight={800}>{e.name}</Typography>
                          <Typography variant="caption" color="text.disabled">{e.location}</Typography>
                      </Paper>
                  </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
