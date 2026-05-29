"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
  const { refreshUserContext } = useWorkspace();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [router, isAuthenticated]);

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
      router.push('/');
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
      p: 3,
      '&::before': {
        content: '""',
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.03)} 0%, rgba(0,0,0,0) 70%)`,
        top: '-10%',
        left: '-10%',
        zIndex: 0,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.02)} 0%, rgba(0,0,0,0) 70%)`,
        bottom: '-10%',
        right: '-10%',
        zIndex: 0,
      }
    }}>
      <Container maxWidth="xs" sx={{ zIndex: 1, position: 'relative' }}>
        <Paper 
          elevation={0} 
          className="double-border"
          sx={{ 
            p: { xs: 4, sm: 5 }, 
            bgcolor: 'background.paper',
            textAlign: 'center',
            boxShadow: theme.palette.mode === 'light' 
              ? '0 20px 50px -10px rgba(107, 23, 36, 0.05), 0 2px 8px -1px rgba(182, 146, 77, 0.03)'
              : '0 30px 70px -15px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(227, 193, 127, 0.02)',
          }}
        >
          <Box sx={{ mb: 4.5 }}>
            <Box sx={{ 
              width: 72, 
              height: 72, 
              mx: 'auto', 
              mb: 2.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(107, 23, 36, 0.12)' : 'rgba(227, 193, 127, 0.15)'}`,
              borderRadius: '50%',
              p: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.02)
            }}>
              <img src={logo} alt="RTCI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h4" className="serif-title" sx={{ mb: 1, fontWeight: 700, fontSize: '1.45rem', letterSpacing: '0.04em', color: 'primary.main' }}>
              WELCOME BACK
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: 'secondary.main', letterSpacing: '0.12em', mb: 2, textTransform: 'uppercase' }}>
              REDEEMED TRANSFORMATION CHAPEL
            </Typography>
            <Divider sx={{ width: '40px', mx: 'auto', borderBottomWidth: '1.5px', borderColor: 'secondary.main', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
              Administrative Portal Authentication
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              {error && (
                <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.error.main, 0.12)}` }}>
                  <Typography variant="caption" color="error" fontWeight={700} sx={{ fontSize: '0.78rem' }}>{error}</Typography>
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
                        <Mail size={16} color={theme.palette.text.disabled} style={{ marginRight: 4 }} />
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
                        <Lock size={16} color={theme.palette.text.disabled} style={{ marginRight: 4 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                sx={{ py: 1.5, fontWeight: 700, mt: 1 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary', fontSize: '0.82rem' }}>
            New to the portal? <Link href="/signup" style={{ color: theme.palette.primary.main, fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
          </Typography>

          <Divider sx={{ my: 3.5 }} />

          <Button 
              variant="text" 
              size="small" 
              startIcon={<AlertTriangle size={13} />}
              onClick={async () => {
                  localStorage.clear();
                  await supabase.auth.signOut();
                  window.location.reload();
              }}
              sx={{ color: 'text.disabled', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em' }}
          >
              Troubleshoot Session
          </Button>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Link href="/privacy" style={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textDecoration: 'none' }}>Terms of Service</Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
