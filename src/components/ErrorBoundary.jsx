import React from 'react';
import { Box, Typography, Button, Paper, alpha } from '@mui/material';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3
        }}>
          <Paper elevation={0} sx={{ 
            p: 8, 
            borderRadius: 8, 
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
            maxWidth: 500
          }}>
            <Box sx={{ 
              width: 80, height: 80, 
              bgcolor: theme => alpha(theme.palette.error.main, 0.1), 
              color: 'error.main',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4
            }}>
              <AlertTriangle size={40} />
            </Box>
            <Typography variant="h4" fontWeight={900} gutterBottom>Something went wrong</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 6, fontFamily: 'Lora', fontStyle: 'italic' }}>
              A technical disturbance has occurred. Our ministerial team has been notified.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<RefreshCcw size={18} />}
              onClick={() => window.location.reload()}
              sx={{ px: 6, borderRadius: 100 }}
            >
              Refresh Sanctuary
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
