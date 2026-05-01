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
import { User, Lock, Eye, EyeOff, ShieldCheck, Leaf, Mail, Building } from 'lucide-react';
import { sanitize, containsMaliciousPattern } from '../utils/sanitizer';

const Signup = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { refreshUserContext } = useWorkspace();
  const { signup, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [navigate, isAuthenticated]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '' });
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password) {
      setError('All fields are required for registration.');
      return;
    }

    if (containsMaliciousPattern(formData.name) || containsMaliciousPattern(formData.email) || containsMaliciousPattern(formData.department)) {
      window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'injection_attempt' } }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Security protocol requires at least 8 characters.');
      return;
    }

    setLoading(true);
    
    try {
      const sanitizedName = sanitize(formData.name);
      const sanitizedEmail = sanitize(formData.email);
      const sanitizedDept = sanitize(formData.department);
      const result = await signup(sanitizedEmail, formData.password, sanitizedName, sanitizedDept);
      
      if (result?.session) {
        refreshUserContext();
        navigate('/');
      } else {
        setSignupSuccess(true);
      }
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message || 'Registration failed. Please contact the sanctuary admin.');
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
            p: { xs: 5, sm: 8 }, 
            borderRadius: 12, 
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(40px)',
            textAlign: 'center',
            boxShadow: '0 40px 100px -20px rgba(74, 103, 65, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {signupSuccess ? (
              <Box sx={{ py: 4 }}>
                <Box sx={{ 
                    width: 80, height: 80,
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: 'primary.main',
                    mx: 'auto',
                    mb: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                }}>
                    <Mail size={40} />
                </Box>
                <Typography variant="h3" sx={{ color: 'primary.main', mb: 2 }}>
                  Check Your Sanctuary Mail
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.8 }}>
                  We've sent a divine confirmation link to <strong>{formData.email}</strong>. 
                  Please click it to activate your ministerial access.
                </Typography>
                <Button 
                  component={Link} 
                  to="/login"
                  variant="outlined" 
                  sx={{ borderRadius: 100, px: 4 }}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 6 }}>
                  <Box>
                    <Box sx={{ 
                        width: 64, height: 64,
                        bgcolor: 'primary.main', 
                        color: '#fff',
                        mx: 'auto',
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}>
                        <Leaf size={28} fill="currentColor" />
                    </Box>
                  </Box>
                  
                  <Typography variant="h2" sx={{ 
                    color: 'primary.main',
                    mb: 1,
                    fontSize: { xs: '2rem', md: '3rem' }
                  }}>
                    Join the Family
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Lora', fontStyle: 'italic' }}>
                    Create your ministerial account
                  </Typography>
                </Box>

                <form onSubmit={handleSignup}>
                  <Stack spacing={2.5}>
                    
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
                      label="Full Name"
                      required
                      variant="outlined"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <User size={18} color={theme.palette.text.disabled} />
                            </InputAdornment>
                          ),
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Ministerial Email"
                      type="email"
                      required
                      variant="outlined"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Mail size={18} color={theme.palette.text.disabled} />
                            </InputAdornment>
                          ),
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      select
                      label="Ministerial Department"
                      variant="outlined"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Building size={18} color={theme.palette.text.disabled} />
                            </InputAdornment>
                          ),
                        }
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
                      label="Secret Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      variant="outlined"
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
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      variant="outlined"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ 
                        mt: 2,
                        py: 2, 
                        fontSize: '0.85rem', 
                        letterSpacing: 3,
                        borderRadius: 100
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Register with the Chapel'}
                    </Button>
                  </Stack>
                </form>

                <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
                  Already a member? <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 800, textDecoration: 'none' }}>Enter the Sanctuary</Link>
                </Typography>
              </>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;
