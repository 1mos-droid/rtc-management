import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Avatar, 
  Card, 
  CardContent, 
  useTheme, 
  alpha, 
  Stack, 
  Chip,
  Skeleton,
  Paper,
  Container
} from '@mui/material';
import { 
  ShieldCheck, 
  Mail, 
  MapPin,
  Users
} from 'lucide-react';
import { supabase } from '../supabase';

const Leadership = () => {
  const theme = useTheme();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('role', 'member')
          .order('role');
        
        if (error) throw error;
        setLeaders(data || []);
      } catch (err) {
        console.error("Fetch Leaders Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
          <Typography variant="h2">Church Leadership</Typography>
          <Typography variant="body1" color="text.secondary">Meet the officials and department heads serving the congregation.</Typography>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid key={i} xs={12} sm={6} md={4} lg={3}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      ) : leaders.length === 0 ? (
        <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, bgcolor: alpha(theme.palette.text.primary, 0.02), border: `1px solid ${theme.palette.divider}` }}>
          <Users size={48} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">Leadership directory is currently empty.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {leaders.map((leader) => (
            <Grid key={leader.id} xs={12} sm={6} md={4} lg={3}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  borderRadius: 4, 
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)', borderColor: theme.palette.primary.main }
                }}
              >
                <Box sx={{ pt: 3, textAlign: 'center' }}>
                  <Avatar 
                    src={leader.avatar_url} 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      border: `4px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      color: theme.palette.primary.main,
                      fontWeight: 800,
                      fontSize: '2.5rem'
                    }}
                  >
                    {leader.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" fontWeight={800}>{leader.name}</Typography>
                  <Typography variant="caption" color="secondary.main" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'inline-block', bgcolor: alpha(theme.palette.secondary.main, 0.1), px: 1, py: 0.5, borderRadius: 1, mt: 0.5 }}>
                    {leader.title || leader.role?.replace('_', ' ')}
                  </Typography>
                </Box>
                
                <CardContent sx={{ textAlign: 'center', pt: 1 }}>
                  <Stack spacing={1} sx={{ alignItems: 'center' }}>
                    {leader.department && (
                      <Chip 
                        label={leader.department} 
                        size="small" 
                        sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05), color: theme.palette.primary.main }} 
                      />
                    )}
                    {leader.campus && (
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                        <MapPin size={12} />
                        <Typography variant="caption" fontWeight={600}>{leader.campus}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.disabled', mt: 1 }}>
                      <Mail size={12} />
                      <Typography variant="caption" noWrap sx={{ maxWidth: 180 }}>{leader.email}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Leadership;
