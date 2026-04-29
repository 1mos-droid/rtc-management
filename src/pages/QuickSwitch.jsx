import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Chip, 
  Avatar, 
  useTheme, 
  alpha, 
  Stack, 
  Divider,
  Paper
} from '@mui/material';
import { 
  Globe, 
  Activity, 
  Cpu,
  Layers,
  ShieldCheck,
  Server,
  Leaf,
  Sparkles
} from 'lucide-react';

const QuickSwitch = () => {
  const theme = useTheme();
  const { workspace: activeWorkspace, switchWorkspace, showNotification } = useWorkspace();
  
  const workspaces = [
    { id: 'main', label: 'Main Sanctuary', desc: 'Central governance and master congregational registry.', color: theme.palette.primary.main },
    { id: 'youth', label: 'Youth Ministry', desc: 'Departmental engagement and youth-focused curriculum.', color: theme.palette.secondary.main },
    { id: 'music', label: "Music Team", desc: 'Worship coordination and ministerial melody logs.', color: '#D48166' },
    { id: 'media', label: "Media Team", desc: 'Visual arts and digital sanctuary broadcasting.', color: '#4A6741' },
  ];

  const handleSwitch = (id, label) => {
    if (activeWorkspace === id) return;
    switchWorkspace(id);
    showNotification(`Sanctuary environment switched to ${label}`);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 10 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Cpu size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'primary.main' }}>INFRASTRUCTURE CONTROL</Typography>
        </Stack>
        <Typography variant="h2" sx={{ fontWeight: 400, color: 'primary.main', mb: 2 }}>Environment Command</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, fontFamily: 'Lora', fontStyle: 'italic' }}>
             Seamlessly toggle between chapel ministries to manage localized data and ministerial operations.
        </Typography>
      </Box>

      <Grid container spacing={8}>
        <Grid size={{ xs: 12, lg: 8 }}>
            <Typography variant="h4" sx={{ mb: 5, fontFamily: 'DM Serif Display' }}>Available Sanctuaries</Typography>
            <Grid container spacing={4}>
                {workspaces.map((ws) => {
                    const isActive = activeWorkspace === ws.id;
                    return (
                        <Grid size={{ xs: 12, md: 6 }} key={ws.id}>
                            <Box>
                                <Paper 
                                    onClick={() => handleSwitch(ws.id, ws.label)}
                                    sx={{ 
                                        p: 6, borderRadius: 8, cursor: 'pointer',
                                        border: `2px solid ${isActive ? ws.color : theme.palette.divider}`,
                                        bgcolor: isActive ? alpha(ws.color, 0.02) : 'background.paper',
                                        transition: 'all 0.4s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': { borderColor: ws.color, boxShadow: `0 30px 60px -10px ${alpha(ws.color, 0.1)}` }
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.03, color: ws.color }}><Leaf size={150}/></Box>
                                    <Stack spacing={4}>
                                        <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(ws.color, 0.05), color: ws.color, borderRadius: 3 }}>
                                            <Globe size={28}/>
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h5" fontWeight={900}>{ws.label}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontFamily: 'Lora', fontStyle: 'italic', opacity: 0.8 }}>{ws.desc}</Typography>
                                        </Box>
                                        {isActive && (
                                            <Chip 
                                                label="ACTIVE CONTEXT" 
                                                size="small" 
                                                sx={{ 
                                                    alignSelf: 'flex-start', borderRadius: 1, 
                                                    fontWeight: 900, letterSpacing: 2, fontSize: '0.6rem', 
                                                    bgcolor: ws.color, color: '#fff' 
                                                }} 
                                            />
                                        )}
                                    </Stack>
                                </Paper>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
            <Typography variant="h4" sx={{ mb: 5, fontFamily: 'DM Serif Display' }}>System Integrity</Typography>
            <Stack spacing={4}>
                <Paper elevation={0} sx={{ p: 5, borderRadius: 8, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                    <Stack spacing={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Activity color={theme.palette.success.main} size={20} />
                            <Typography variant="body1" fontWeight={900} sx={{ letterSpacing: 1 }}>OPERATIONAL HEALTH</Typography>
                        </Box>
                        <Divider sx={{ borderStyle: 'dashed' }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2 }}>LATENCY</Typography>
                            <Typography variant="caption" fontWeight={900} color="success.main">OPTIMAL (14ms)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2 }}>ARCHITECTURE</Typography>
                            <Typography variant="caption" fontWeight={900}>RTC v2.0</Typography>
                        </Box>
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={{ p: 5, borderRadius: 8, border: `1px solid ${theme.palette.divider}`, bgcolor: 'primary.main', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <Sparkles size={100} style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }} />
                    <Server size={32} style={{ marginBottom: 32 }} />
                    <Typography variant="h5" fontWeight={900} sx={{ fontFamily: 'DM Serif Display' }}>Cloud Sanctuary</Typography>
                    <Typography variant="body2" sx={{ mt: 3, opacity: 0.9, lineHeight: 1.8, fontFamily: 'Lora' }}>
                        The RTC environment is strictly isolated and synchronized with our secure ministerial cloud infrastructure.
                    </Typography>
                </Paper>
            </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickSwitch;
