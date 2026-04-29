import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Stack, 
  alpha, 
  useTheme,
  Button,
  Chip,
  Divider,
  LinearProgress,
  ButtonGroup
} from '@mui/material';
import { 
  Terminal, 
  Activity, 
  Bug, 
  Database, 
  ShieldCheck, 
  Cpu, 
  HardDrive,
  RefreshCcw,
  UserCircle,
  EyeOff,
  Eye
} from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const DeveloperView = () => {
  const theme = useTheme();
  const { setMimicRole, mimicRole, ROLES } = useAuth();
  
  const [stats, setStats] = useState({
    users: 0,
    members: 0,
    transactions: 0,
    uptime: '99.99%',
    latency: '...' 
  });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [bugReports] = useState([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: memberCount } = await supabase.from('members').select('*', { count: 'exact', head: true });
      const { count: transCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      const latency = Date.now() - start;
      
      setStats(prev => ({
        ...prev,
        users: userCount || 0,
        members: memberCount || 0,
        transactions: transCount || 0,
        latency: `${latency}ms`
      }));
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(); // eslint-disable-line react-hooks/set-state-in-effect

    setLogs([{ id: 'init', type: 'info', message: 'System boot sequence complete. Listening for live database events...', time: new Date().toLocaleTimeString() }]);

    const channel = supabase.channel('system-monitor')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const time = new Date().toLocaleTimeString();
        let message = `Activity on ${payload.table}`;
        let type = 'info';

        if (payload.eventType === 'INSERT') {
          message = `New record added to ${payload.table}`;
          type = 'success';
        } else if (payload.eventType === 'UPDATE') {
          message = `Record updated in ${payload.table}`;
          type = 'warning';
        } else if (payload.eventType === 'DELETE') {
          message = `Record deleted from ${payload.table}`;
          type = 'error';
        }

        setLogs(prev => {
          const newLog = { id: Date.now() + Math.random(), type, message, time };
          return [newLog, ...prev].slice(0, 50);
        });
        
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main }}>
                <Terminal size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'secondary.main' }}>DEVELOPER CONSOLE</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: "space-between", alignItems: "center", gap: 3 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 400, color: 'text.primary', mb: 1 }}>System Health & Monitoring</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                Real-time performance metrics, diagnostic logs, and system-wide telemetry for technical oversight.
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<RefreshCcw size={18} />} 
            onClick={fetchStats}
            disabled={loading}
          >
            Refresh Diagnostics
          </Button>
        </Stack>
      </Box>

      {/* Role Mimicry Control */}
      <Paper elevation={0} sx={{ p: 4, mb: 6, borderRadius: 4, border: `1px solid ${theme.palette.secondary.main}`, bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: "center" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <UserCircle size={24} color={theme.palette.secondary.main} />
                  <Box>
                      <Typography variant="subtitle2" fontWeight={900}>Role Mimicry Mode</Typography>
                      <Typography variant="caption" color="text.secondary">View the app as if you had a different rank.</Typography>
                  </Box>
              </Box>
              <ButtonGroup variant="outlined" color="secondary" size="small" sx={{ borderRadius: 100 }}>
                  <Button 
                    onClick={() => setMimicRole(null)} 
                    variant={mimicRole === null ? 'contained' : 'outlined'}
                    startIcon={mimicRole === null ? <Eye size={14}/> : null}
                  >
                      Actual (Dev)
                  </Button>
                  <Button 
                    onClick={() => setMimicRole(ROLES.ADMIN)} 
                    variant={mimicRole === ROLES.ADMIN ? 'contained' : 'outlined'}
                  >
                      Admin
                  </Button>
                  <Button 
                    onClick={() => setMimicRole(ROLES.DEPARTMENT_HEAD)} 
                    variant={mimicRole === ROLES.DEPARTMENT_HEAD ? 'contained' : 'outlined'}
                  >
                      Dept Head
                  </Button>
                  <Button 
                    onClick={() => setMimicRole(ROLES.MEMBER)} 
                    variant={mimicRole === ROLES.MEMBER ? 'contained' : 'outlined'}
                  >
                      Member
                  </Button>
              </ButtonGroup>
              {mimicRole && (
                  <Chip 
                    label={`Currently Mimicking: ${mimicRole.toUpperCase()}`} 
                    color="secondary" 
                    onDelete={() => setMimicRole(null)}
                    sx={{ fontWeight: 900, borderRadius: 1 }}
                  />
              )}
          </Stack>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Registered Users', value: stats.users, icon: <ShieldCheck size={20}/>, color: '#4A6741' },
          { label: 'Active Members', value: stats.members, icon: <Activity size={20}/>, color: '#2E7D32' },
          { label: 'Transactions', value: stats.transactions, icon: <Database size={20}/>, color: '#1976D2' },
          { label: 'System Uptime', value: stats.uptime, icon: <HardDrive size={20}/>, color: '#9C27B0' },
          { label: 'API Latency', value: stats.latency, icon: <Cpu size={20}/>, color: '#ED6C02' },
        ].map((stat, i) => (
          <Grid key={i} item xs={12} sm={6} md={2.4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(stat.color, 0.02) }}>
              <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{stat.label}</Typography>
              <Typography variant="h4" fontWeight={900}>{stat.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Diagnostic Logs */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'DM Serif Display' }}>Diagnostic Logs</Typography>
              <Chip label="LIVE" size="small" color="error" sx={{ fontWeight: 900, borderRadius: 1 }} />
            </Stack>
            <Box sx={{ bgcolor: '#1a1a1a', borderRadius: 3, p: 3, fontFamily: 'monospace', color: '#00ff00', fontSize: '0.85rem', height: 400, overflowY: 'auto' }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#00ff00', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <Typography variant="caption">Listening for system events...</Typography>
              </Box>
              {logs.map(log => (
                <Box key={log.id} sx={{ mb: 1.5, display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666', minWidth: 80 }}>[{log.time}]</Typography>
                  <Typography variant="caption" sx={{ 
                    color: log.type === 'error' ? '#ff4444' : log.type === 'warning' ? '#ffbb33' : log.type === 'success' ? '#00c851' : '#33b5e5',
                    fontWeight: 900, minWidth: 60
                  }}>
                    {log.type.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#eee' }}>{log.message}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Bug Reports */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
              <Bug size={20} color={theme.palette.error.main} />
              <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'DM Serif Display' }}>Recent Bug Reports</Typography>
            </Stack>
            <Stack spacing={2}>
              {bugReports.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                    No active bug reports. System is healthy.
                  </Typography>
              ) : bugReports.map(bug => (
                <Box key={bug.id} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.4) } }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={800}>{bug.title}</Typography>
                    <Chip 
                      label={bug.priority} 
                      size="small" 
                      sx={{ 
                        fontSize: '0.6rem', height: 20, fontWeight: 900,
                        bgcolor: bug.priority === 'Critical' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                        color: bug.priority === 'Critical' ? theme.palette.error.main : theme.palette.warning.main
                      }} 
                    />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">Status: <b>{bug.status}</b></Typography>
                    <Button size="small" sx={{ fontSize: '0.7rem' }}>View Details</Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
            <Button fullWidth variant="contained" color="error" sx={{ mt: 4, borderRadius: 2 }}>
              Report New Issue
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeveloperView;