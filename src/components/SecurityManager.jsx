import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, alpha, Snackbar, Alert } from '@mui/material';
import { ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Initialize network guard once
let networkGuardInitialized = false;

const initializeNetworkGuard = () => {
  if (networkGuardInitialized) return;
  networkGuardInitialized = true;

  const originalFetch = window.fetch;
  let requestCount = 0;
  let lastReset = Date.now();
  const MAX_REQUESTS_PER_10S = 200; 
  const TIMEOUT_MS = 15000;

  window.fetch = async (...args) => {
    const now = Date.now();
    if (now - lastReset > 10000) {
      requestCount = 0;
      lastReset = now;
    }
    requestCount++;

    // Client-side rate limiting
    if (requestCount > MAX_REQUESTS_PER_10S) {
      window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'rate_limit_exceeded' } }));
      return new Response(JSON.stringify({ error: "Client-side rate limit exceeded." }), {
        status: 429,
        statusText: "Too Many Requests"
      });
    }

    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    // Whitelist Supabase / PostgREST long-polling if used
    const isBackend = url.includes('supabase.co');
    
    const controller = new AbortController();
    let timeoutId;
    let options = args[1] || {};

    if (isBackend && !options.signal) {
      timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      options.signal = controller.signal;
      args[1] = options;
    }

    try {
      const response = await originalFetch(...args);
      if (timeoutId) clearTimeout(timeoutId);

      if (response.status === 429) {
        window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'server_rate_limit' } }));
      }
      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'auth_anomaly' } }));
      }
      if (response.status >= 500) {
         window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'server_error' } }));
      }

      return response;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'timeout' } }));
      } else if (error.message && error.message.includes('Failed to fetch')) {
        window.dispatchEvent(new CustomEvent('rtc-security-alert', { detail: { type: 'offline' } }));
      }
      throw error;
    }
  };
};

export const SecurityManager = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [alertState, setAlertState] = useState({ open: false, message: '', severity: 'info' });
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    initializeNetworkGuard();

    const handleSecurityAlert = (e) => {
      const { type } = e.detail;

      if (type === 'injection_attempt') {
        setAlertState({ open: true, message: 'Malicious activity detected. Action blocked.', severity: 'error' });
        setIsLocked(true);
      }
    };

    window.addEventListener('rtc-security-alert', handleSecurityAlert);
    return () => window.removeEventListener('rtc-security-alert', handleSecurityAlert);
  }, []);

  const handleLockdownReset = async () => {
    await logout();
    setIsLocked(false);
    navigate('/login');
  };

  if (isLocked) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
        <Paper elevation={0} sx={{ p: 8, borderRadius: 8, border: '1px solid', borderColor: 'error.main', textAlign: 'center', maxWidth: 500 }}>
          <Box sx={{ width: 80, height: 80, bgcolor: theme => alpha(theme.palette.error.main, 0.1), color: 'error.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4 }}>
            <Lock size={40} />
          </Box>
          <Typography variant="h4" fontWeight={900} color="error.main" gutterBottom>Security Lockdown</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontFamily: 'Lora', fontStyle: 'italic' }}>
            Unusual authorization anomalies or tampering detected. To protect the sanctuary's integrity, this session has been suspended.
          </Typography>
          <Button variant="contained" color="error" startIcon={<ShieldAlert size={18} />} onClick={handleLockdownReset} sx={{ px: 6, borderRadius: 100 }}>
            Verify Identity
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
      <Snackbar open={alertState.open} autoHideDuration={6000} onClose={() => setAlertState({ ...alertState, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={alertState.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {alertState.message}
        </Alert>
      </Snackbar>
    </>
  );
};
