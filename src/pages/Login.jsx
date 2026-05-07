import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  useTheme, 
  InputAdornment,
  IconButton,
  CircularProgress,
  alpha,
  Container,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Leaf, Heart, AlertTriangle } from 'lucide-react';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { refreshUserContext } = useWorkspace();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [navigate, isAuthenticated]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password) {
      setError('Steward credentials are required for entry.');
      return;
    }

    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      refreshUserContext();
      navigate('/');
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || 'Invalid credentials. Please verify your access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden',
      p: 3
    }}>
      {/* --- ORGANIC BACKGROUND ART --- */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <Box
            style={{
                position: 'absolute', top: '-10%', left: '-10%',
                width: '60vw', height: '60vw',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                filter: 'blur(80px)'
            }}
        />
        <Box
            style={{
                position: 'absolute', bottom: '-20%', right: '-10%',
                width: '70vw', height: '70vw',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.04)} 0%, transparent 70%)`,
                filter: 'blur(100px)'
            }}
        />
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box>
          <Paper elevation={0} sx={{ 
            p: { xs: 5, sm: 10 }, 
            borderRadius: 12, 
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(40px)',
            textAlign: 'center',
            boxShadow: '0 40px 100px -20px rgba(74, 103, 65, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{ mb: 8 }}>
              <Box>
                <Box sx={{ 
                    width: 72, height: 72,
                    bgcolor: 'primary.main', 
                    color: '#fff',
                    mx: 'auto',
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                }}>
                    <Leaf size={32} fill="currentColor" />
                </Box>
              </Box>
              
              <Typography variant="h2" sx={{ 
                color: 'primary.main',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}>
                Welcome Home
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Lora', fontStyle: 'italic' }}>
                Redeemed Transformation Chapel International              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <Stack spacing={3}>
                
                {error && (
                  <Typography variant="caption" color="error" sx={{ 
                    fontWeight: 800, 
                    bgcolor: alpha(theme.palette.error.main, 0.05), 
                    p: 2, 
                    borderRadius: 4,
                    letterSpacing: 0.5
                  }}>
                    {error}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  label="Ministerial Email"
                  type="email"
                  required
                  variant="outlined"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="Secret Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  variant="outlined"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    mt: 3,
                    py: 2.5, 
                    fontSize: '0.9rem', 
                    letterSpacing: 3,
                    borderRadius: 100
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Enter the Sanctuary'}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
              New to the ministry? <Link to="/signup" style={{ color: theme.palette.primary.main, fontWeight: 800, textDecoration: 'none' }}>Register with the Chapel</Link>
            </Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
