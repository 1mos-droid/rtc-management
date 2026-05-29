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
  Stack,
  MenuItem
} from '@mui/material';
import { User, Lock, Eye, EyeOff, Mail, Building } from 'lucide-react';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';

const Signup = () => {
  const theme = useTheme();
  const router = useRouter();
  const { refreshUserContext, showNotification } = useWorkspace();
  const { signup, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !signupSuccess) {
      router.push('/');
    }
  }, [router, isAuthenticated, signupSuccess]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required.');
      return;
    }

    if (containsMaliciousPattern(formData.name) || containsMaliciousPattern(formData.email) || containsMaliciousPattern(formData.department)) {
      window.dispatchEvent(new CustomEvent('rtci-security-alert', { detail: { type: 'injection_attempt' } }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    
    try {
      const sanitizedName = sanitize(formData.name);
      const sanitizedEmail = sanitize(formData.email);
      const sanitizedDept = sanitize(formData.department);
      const result = await signup(sanitizedEmail, formData.password, sanitizedName, sanitizedDept);
      
      if (result?.session) {
        showNotification('Welcome! Account created successfully.', 'success');
        setTimeout(() => {
          refreshUserContext();
          router.push('/');
        }, 1500);
      } else {
        setSignupSuccess(true);
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message || 'Registration failed.');
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
          
          {signupSuccess ? (
            <Box sx={{ py: 3 }}>
              <Box sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: alpha(theme.palette.primary.main, 0.04), 
                color: 'primary.main', 
                mx: 'auto', 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: '50%',
                border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(107, 23, 36, 0.15)' : 'rgba(227, 193, 127, 0.25)'}`
              }}>
                  <Mail size={26} />
              </Box>
              <Typography variant="h4" className="serif-title" sx={{ mb: 1.5, fontWeight: 700, fontSize: '1.4rem', color: 'primary.main' }}>
                VERIFY YOUR EMAIL
              </Typography>
              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6, fontSize: '0.85rem' }}>
                We have sent a verification link to <strong>{formData.email}</strong>. 
                Please check your inbox to activate your administrative privileges.
              </Typography>
              <Button component={Link} to="/login" variant="outlined" fullWidth sx={{ py: 1.5, fontWeight: 700 }}>
                Return to Login
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 4.5 }}>
                <Typography variant="h4" className="serif-title" sx={{ mb: 1, fontWeight: 700, fontSize: '1.45rem', letterSpacing: '0.04em', color: 'primary.main' }}>
                  CREATE ACCOUNT
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: 'secondary.main', letterSpacing: '0.12em', mb: 2, textTransform: 'uppercase' }}>
                  JOIN THE RTCI ADMINISTRATIVE TEAM
                </Typography>
                <Divider sx={{ width: '40px', mx: 'auto', borderBottomWidth: '1.5px', borderColor: 'secondary.main', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  Register to request access credentials
                </Typography>
              </Box>

              <form onSubmit={handleSignup}>
                <Stack spacing={2.5}>
                  {error && (
                    <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), p: 2, borderRadius: 1, border: `1px solid ${alpha(theme.palette.error.main, 0.12)}` }}>
                      <Typography variant="caption" color="error" fontWeight={700} sx={{ fontSize: '0.78rem' }}>{error}</Typography>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    label="Full Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <User size={16} color={theme.palette.text.disabled} style={{ marginRight: 4 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

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
                    select
                    label="Department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Building size={16} color={theme.palette.text.disabled} style={{ marginRight: 4 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  >
                      <MenuItem value=""><em>None / General</em></MenuItem>
                      <MenuItem value="Youth">Youth</MenuItem>
                      <MenuItem value="Women">Women</MenuItem>
                      <MenuItem value="Men">Men</MenuItem>
                      <MenuItem value="Music Team">Music Team</MenuItem>
                      <MenuItem value="Media">Media</MenuItem>
                  </TextField>

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

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ py: 1.5, fontWeight: 700, mt: 1 }}
                  >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
                  </Button>
                </Stack>
              </form>

              <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary', fontSize: '0.82rem' }}>
                Already have an account? <Link href="/login" style={{ color: theme.palette.primary.main, fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
              </Typography>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Link href="/privacy" style={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textDecoration: 'none' }}>Privacy Policy</Link>
                <Link href="/terms" style={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textDecoration: 'none' }}>Terms of Service</Link>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
