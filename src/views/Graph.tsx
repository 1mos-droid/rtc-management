import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Box, 
  Typography, 
  useTheme, 
  Grid, 
  alpha, 
  Paper, 
  CircularProgress, 
  Stack,
  Tabs,
  Tab,
  TextField,
  Autocomplete,
  InputAdornment,
  Avatar,
  Chip
} from '@mui/material';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { format } from 'date-fns';
import { Zap, TrendingUp, Users, DollarSign, Search, GitFork, ChevronRight } from 'lucide-react';

import { supabase } from '../supabase';
import { safeParseDate } from '../utils/dateUtils';

const Graph = () => {
  const theme = useTheme();
  const { filterData } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [growthTrends, setGrowthTrends] = useState([]);
  
  const [activeTab, setActiveTab] = useState(0);
  const [allMembers, setAllMembers] = useState([]);
  const [focusedMember, setFocusedMember] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aRes, tRes, mRes] = await Promise.all([
          supabase.from('attendance').select('*').order('date', { ascending: false }).limit(100),
          supabase.from('transactions').select('*').order('date', { ascending: false }).limit(1000),
          supabase.from('members').select('*').limit(2000),
        ]);

        const mData = mRes.data || [];
        const tData = tRes.data || [];
        const aData = aRes.data || [];

        const filteredMembers = filterData(mData);
        setAllMembers(filteredMembers);
        setFocusedMember(prev => prev || filteredMembers[0] || null);
        const totalCount = filteredMembers.length;

        // Group members by month for growth trend
        const growth = filteredMembers.reduce((acc, m) => {
          const month = format(safeParseDate(m.created_at), 'MMM yy');
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const gData = Object.keys(growth).map(month => ({
          month,
          count: growth[month]
        })).sort((a, b) => {
            const dateA = new Date(a.month.split(' ')[1], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(a.month.split(' ')[0]));
            const dateB = new Date(b.month.split(' ')[1], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(b.month.split(' ')[0]));
            return dateA - dateB;
        });
        setGrowthTrends(gData);

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

      <Box sx={{ mb: 4, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Ministerial Analytics" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label="Spiritual Family Tree" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
      </Box>

      {loading ? <CircularProgress /> : (
      <>
      {activeTab === 0 && (
      <Grid container spacing={6}>
          <Grid xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.01) }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                      <TrendingUp size={20} color={theme.palette.primary.main} />
                      <Typography variant="h6" fontWeight={800}>Engagement Trajectory</Typography>
                  </Stack>
                  <Box sx={{ height: 350, width: '100%' }}>
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
                              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }} />
                              <Area type="monotone" dataKey="attendance" stroke={theme.palette.primary.main} strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </Box>
              </Paper>
          </Grid>

          <Grid xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                      <Users size={20} color={theme.palette.success.main} />
                      <Typography variant="h6" fontWeight={800}>Church Growth</Typography>
                  </Stack>
                  <Box sx={{ height: 350, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={growthTrends}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.text.primary, 0.05)} />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }} />
                              <Bar dataKey="count" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  </Box>
              </Paper>
          </Grid>
          
          <Grid xs={12} md={8}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                      <DollarSign size={20} color={theme.palette.primary.main} />
                      <Typography variant="h6" fontWeight={800}>Giving Patterns</Typography>
                  </Stack>
                  <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.text.primary, 0.05)} />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }} cursor={{ fill: alpha(theme.palette.primary.main, 0.03) }} />
                              <Bar dataKey="income" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  </Box>
              </Paper>
          </Grid>

          <Grid xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: 'none', bgcolor: 'primary.main', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Zap size={32} style={{ marginBottom: 24 }} />
                  <Typography variant="h5" fontWeight={900}>Real-time Intelligence</Typography>
                  <Typography variant="body2" sx={{ mt: 2, opacity: 0.8, lineHeight: 1.8 }}>
                      All data points are synchronized with the central sanctuary database to ensure accurate decision-making for leadership.
                  </Typography>
              </Paper>
          </Grid>
      </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={4} className="animate-entrance">
          {/* Node Graph side-bar (focused member details) */}
          <Grid xs={12} lg={4}>
            <Paper 
              elevation={0}
              className="double-border"
              sx={{ p: 4, borderRadius: 1, bgcolor: 'background.paper', height: '100%', border: `1px solid ${theme.palette.divider}` }}
            >
              {focusedMember ? (
                <Stack spacing={3} sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ 
                    width: 100, 
                    height: 100, 
                    bgcolor: alpha(theme.palette.primary.main, 0.08), 
                    color: 'primary.main', 
                    fontSize: '2.25rem', 
                    fontWeight: 900, 
                    mx: 'auto',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    boxShadow: `0 10px 25px -5px ${alpha(theme.palette.primary.main, 0.1)}`
                  }}>
                    {focusedMember.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={900}>{focusedMember.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Lora', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      {focusedMember.email}
                    </Typography>
                  </Box>

                  <Chip 
                    label={focusedMember.department || 'General Congregation'} 
                    color="primary" 
                    variant="soft" 
                    sx={{ fontWeight: 800, mx: 'auto', px: 2 }} 
                  />

                  <Divider />

                  <Stack spacing={2} sx={{ textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" fontWeight={900} color="text.disabled">SPIRITUAL DEPTH</Typography>
                      <Typography variant="caption" fontWeight={900} color="primary">DISCIPLE</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" fontWeight={900} color="text.disabled">HOME CAMPUS</Typography>
                      <Typography variant="caption" fontWeight={800}>{focusedMember.campus || 'Main Chapel'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" fontWeight={900} color="text.disabled">CONTACT PHONE</Typography>
                      <Typography variant="caption" fontWeight={800}>{focusedMember.phone || 'No phone'}</Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="caption" fontWeight={900} color="text.disabled" display="block" sx={{ mb: 1 }}>
                      SPIRITUAL FELLOWSHIP NOTES
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Lora', fontStyle: 'italic', lineHeight: 1.7 }}>
                      A dedicated disciple serving actively in the {focusedMember.department || 'General Congregation'} ministry. {focusedMember.name} walks in close spiritual alignment and regular fellowship circles under the pastoral guidance of RTCI Shepherds.
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
                  <GitFork size={36} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
                  <Typography variant="body2" color="text.disabled">Select a disciple to view spiritual mentoring tree</Typography>
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* SVG Tree Graph */}
          <Grid xs={12} lg={8}>
            <Paper 
              elevation={0}
              className="double-border"
              sx={{ p: 4, borderRadius: 1, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}
            >
              {/* Autocomplete Search input */}
              <Box sx={{ mb: 4 }}>
                <Autocomplete
                  options={allMembers}
                  getOptionLabel={(option) => option.name || ''}
                  value={focusedMember}
                  onChange={(_, newValue) => {
                    if (newValue) setFocusedMember(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search and focus a disciple..."
                      variant="outlined"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search size={16} />
                            </InputAdornment>
                          ),
                          style: { borderRadius: 100 }
                        }
                      }}
                    />
                  )}
                />
              </Box>

              {/* Render dynamic localized SVG mentoring tree */}
              <Box sx={{ 
                width: '100%', 
                height: 480, 
                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.005),
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {focusedMember ? (
                  <svg width="100%" height="100%" viewBox="0 0 800 480">
                    <defs>
                      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    {/* Background visual radial grids representing spiritual orbits */}
                    <circle cx="400" cy="240" r="140" fill="none" stroke={alpha(theme.palette.primary.main, 0.05)} strokeDasharray="5,5" strokeWidth={1} />
                    <circle cx="400" cy="240" r="220" fill="none" stroke={alpha(theme.palette.primary.main, 0.03)} strokeDasharray="10,10" strokeWidth={1} />

                    {/* Lines connecting parent/children/siblings */}
                    {(() => {
                      // Dynamically calculate 1 parent node (e.g. Shepherd)
                      // and up to 8 sibling nodes in same department or general congregation
                      const parentNode = { id: 'parent-1', name: focusedMember.department ? `${focusedMember.department} Shepherd` : 'RTCI Elder', role: 'shepherd', x: 400, y: 80 };
                      
                      const siblings = allMembers
                        .filter(m => m.id !== focusedMember.id && m.department === focusedMember.department)
                        .slice(0, 8);
                      
                      const siblingNodes = siblings.map((sib, index) => {
                        const count = Math.min(siblings.length, 8);
                        const startAngle = 0; // degrees
                        const endAngle = 360;
                        const angleStep = count > 1 ? (endAngle - startAngle) / count : 360;
                        const angleRad = ((startAngle + index * angleStep) * Math.PI) / 180;
                        const radius = 170;
                        return {
                          ...sib,
                          role: 'disciple',
                          x: 400 + Math.cos(angleRad) * radius,
                          y: 240 + Math.sin(angleRad) * radius
                        };
                      });

                      const allNodes = [parentNode, ...siblingNodes];

                      return (
                        <>
                          {/* Links */}
                          {allNodes.map((n, i) => (
                            <line
                              key={`link-${i}`}
                              x1={400}
                              y1={240}
                              x2={n.x}
                              y2={n.y}
                              stroke={n.role === 'shepherd' ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.25)}
                              strokeWidth={n.role === 'shepherd' ? 2 : 1.2}
                              strokeDasharray={n.role === 'shepherd' ? 'none' : '4,4'}
                              style={{ transition: 'all 0.5s ease' }}
                            />
                          ))}

                          {/* Nodes */}
                          {/* Center Node (Focused) */}
                          <g transform="translate(400, 240)" style={{ cursor: 'pointer' }}>
                            <circle 
                              r={30} 
                              fill={theme.palette.background.paper}
                              stroke={theme.palette.primary.main}
                              strokeWidth={3}
                              style={{ 
                                filter: `drop-shadow(0px 8px 20px ${alpha(theme.palette.primary.main, 0.25)})`
                              }}
                            />
                            <circle r={26} fill="none" stroke={theme.palette.primary.main} strokeWidth={1} strokeDasharray="3,3" />
                            <text 
                              textAnchor="middle" 
                              dy=".35em" 
                              fill={theme.palette.primary.main}
                              style={{ fontSize: '13px', fontWeight: 900 }}
                            >
                              {focusedMember.name?.substring(0, 2).toUpperCase()}
                            </text>
                            <text textAnchor="middle" y="48" fill={theme.palette.text.primary} style={{ fontSize: '12px', fontWeight: 900 }}>
                              {focusedMember.name?.split(' ')[0]}
                            </text>
                            <text textAnchor="middle" y="60" fill={theme.palette.primary.main} style={{ fontSize: '9px', fontWeight: 800, letterSpacing: 1 }}>
                              CENTER
                            </text>
                          </g>

                          {/* Outer Nodes */}
                          {allNodes.map((n, i) => (
                            <g 
                              key={`node-${i}`} 
                              transform={`translate(${n.x}, ${n.y})`} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (n.role === 'disciple') {
                                  setFocusedMember(n);
                                } else {
                                  showNotification(`Interacting with spiritual oversight: ${n.name}`, 'info');
                                }
                              }}
                            >
                              <circle 
                                r={20} 
                                fill={theme.palette.background.paper} 
                                stroke={n.role === 'shepherd' ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.15)}
                                strokeWidth={2}
                                style={{ transition: 'all 0.3s ease' }}
                              />
                              <text 
                                textAnchor="middle" 
                                dy=".3em" 
                                fill={n.role === 'shepherd' ? theme.palette.primary.main : theme.palette.text.secondary}
                                style={{ fontSize: '10px', fontWeight: 800 }}
                              >
                                {n.name?.substring(0, 2).toUpperCase()}
                              </text>
                              <text textAnchor="middle" y="34" fill={theme.palette.text.secondary} style={{ fontSize: '11px', fontWeight: 800 }}>
                                {n.name?.split(' ')[0]}
                              </text>
                              <text textAnchor="middle" y="44" fill="text.disabled" style={{ fontSize: '7.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {n.role}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Stack>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      </>
      )}
    </Box>
  );
};

export default Graph;
