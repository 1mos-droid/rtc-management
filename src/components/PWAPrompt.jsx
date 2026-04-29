import { useState, useEffect } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';

export default function PWAPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Basic detection for offline readiness if using vite-plugin-pwa
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            // Service worker is ready
        });
    }
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setOpen(false)} severity="info" sx={{ width: '100%', borderRadius: 0, fontWeight: 700 }}>
        The RTC platform is now available offline.
      </Alert>
    </Snackbar>
  );
}
