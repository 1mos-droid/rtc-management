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
  Stack,
  MenuItem
} from '@mui/material';
import { User, Lock, Eye, EyeOff, Mail, Building } from 'lucide-react';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';

const Signup = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { refreshUserContext, showNotification } = useWorkspace();
  const { signup, isAuthenticated } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !signupSuccess) {
      navigate('/');
    }
  }, [navigate, isAuthenticated, signupSuccess]);

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
          navigate('/');
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
          
          {signupSuccess ? (
            <Box sx={{ py: 4 }}>
              <Box sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                  <Mail size={32} />
              </Box>
              <Typography variant="h3" sx={{ mb: 2 }}>Verify Your Email</Typography>
              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Please check your inbox to activate your account.
              </Typography>
              <Button component={Link} to="/login" variant="outlined" fullWidth sx={{ py: 1.5, fontWeight: 700 }}>
                Return to Login
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h3" sx={{ mb: 1 }}>Create Account</Typography>
                <Typography variant="body2" color="text.secondary">
                  Join the RTCI Administrative Team
                </Typography>
              </Box>

              <form onSubmit={handleSignup}>
                <Stack spacing={2.5}>
                  {error && (
                    <Box sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" color="error" fontWeight={700}>{error}</Typography>
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
                            <User size={18} color={theme.palette.text.disabled} />
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
                            <Mail size={18} color={theme.palette.text.disabled} />
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
                            <Building size={18} color={theme.palette.text.disabled} />
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
                    sx={{ py: 1.5, fontWeight: 700 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>
                </Stack>
              </form>

              <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
                Already have an account? <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
              </Typography>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;
