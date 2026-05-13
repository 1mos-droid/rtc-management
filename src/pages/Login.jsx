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
import { Lock, Eye, EyeOff, AlertTriangle, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
import { supabase } from '../supabase';

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
      setError('Email and password are required.');
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
      p: 3
    }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ 
          p: { xs: 4, sm: 6 }, 
          borderRadius: 4, 
          border: `1px solid ${theme.palette.divider}`,
          borderTop: `4px solid ${theme.palette.secondary.main}`,
          bgcolor: 'background.paper',
          textAlign: 'center',
          boxShadow: theme.shadows[4]
        }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ width: 80, height: 80, mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="RTCI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h3" sx={{ mb: 1 }}>Welcome Back</Typography>
            <Typography variant="body2" color="text.secondary">
              Redeemed Transformation Chapel Administrative Portal
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <Stack spacing={3}>
              {error && (
                <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="error" fontWeight={700}>{error}</Typography>
                </Box>
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={18} color={theme.palette.text.disabled} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={18} color={theme.palette.text.disabled} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
            New to the portal? <Link to="/signup" style={{ color: theme.palette.primary.main, fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Button 
              variant="text" 
              size="small" 
              startIcon={<AlertTriangle size={14} />}
              onClick={async () => {
                  localStorage.clear();
                  await supabase.auth.signOut();
                  window.location.reload();
              }}
              sx={{ color: 'text.disabled', fontSize: '0.75rem', fontWeight: 600 }}
          >
              Troubleshoot Session
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
