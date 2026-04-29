import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Box, Typography, useTheme, Grid, alpha, Paper, CircularProgress } from '@mui/material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';

const Graph = () => {
  const theme = useTheme();
  const { filterData } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aRes, tRes, mRes] = await Promise.all([
          supabase.from('attendance').select('*').order('date', { ascending: false }).limit(100),
          supabase.from('transactions').select('*').order('date', { ascending: false }).limit(500),
          supabase.from('members').select('*').limit(2000),
        ]);

        const mData = mRes.data || [];
        const tData = tRes.data || [];
        const aData = aRes.data || [];

        const filteredMembers = filterData(mData);
        const totalCount = filteredMembers.length;

        const combined = aData.map(record => {
          const rDate = safeParseDate(record.date);
          const attCount = record.attendees?.length || 0;
          const rate = totalCount > 0 ? Math.round((attCount / totalCount) * 100) : 0;
          const income = tData.filter(t => t.type === 'contribution' && format(safeParseDate(t.date), 'yyyy-MM-dd') === format(rDate, 'yyyy-MM-dd'))
                               .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
          return { date: format(rDate, 'MMM dd'), attendance: rate, income };
        }).sort((a, b) => safeParseDate(a.date) - safeParseDate(b.date));
        
        setChartData(combined);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [filterData]);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={3}>ANALYTICAL INSIGHTS</Typography>
        <Typography variant="h2" sx={{ fontWeight: 900, mt: 1 }}>Ministerial Performance</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600 }}>
             Visualizing data-driven metrics to track the reach and impact of our chapel's mission.
        </Typography>
      </Box>

      {loading ? <CircularProgress /> : (
      <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
              <Paper elevation={0} sx={{ p: 6, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                  <Typography variant="h5" fontWeight={900} sx={{ mb: 4, fontFamily: 'Merriweather' }}>Engagement Trajectory</Typography>
                  <Box sx={{ height: 400, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.primary.main, 0.1)} />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} unit="%" />
                              <Tooltip contentStyle={{ borderRadius: 0, border: `1px solid ${theme.palette.divider}` }} />
                              <Area type="monotone" dataKey="attendance" stroke={theme.palette.primary.main} strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </Box>
              </Paper>
          </Grid>
          
          <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={0} sx={{ p: 6, borderRadius: 0, border: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h5" fontWeight={900} sx={{ mb: 4, fontFamily: 'Merriweather' }}>Revenue Breakdown</Typography>
                  <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.primary.main, 0.1)} />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                              <Tooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.03) }} />
                              <Bar dataKey="income" fill={theme.palette.primary.main} radius={0} />
                          </BarChart>
                      </ResponsiveContainer>
                  </Box>
              </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 6, borderRadius: 0, border: `1px solid ${theme.palette.divider}`, bgcolor: 'primary.main', color: '#fff' }}>
                  <Zap size={32} style={{ marginBottom: 24 }} />
                  <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'Merriweather' }}>Real-time Intelligence</Typography>
                  <Typography variant="body2" sx={{ mt: 2, opacity: 0.8, lineHeight: 1.8 }}>
                      All data points are synchronized with the central sanctuary database to ensure accurate decision-making for leadership.
                  </Typography>
              </Paper>
          </Grid>
      </Grid>
      )}
    </Box>
  );
};

export default Graph;
