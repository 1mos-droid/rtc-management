import { useState, useEffect } from 'react';
import { Button, Dialog, Typography, Box, Stack } from '@mui/material';
import { Download } from 'lucide-react';

export default function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!installPrompt) return null;

  const handleInstall = async () => {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <Button
      variant="outlined"
      onClick={handleInstall}
      startIcon={<Download size={16} />}
      sx={{ border: 'none', fontWeight: 800, '&:hover': { border: 'none', bgcolor: 'transparent', opacity: 0.7 } }}
    >
      Install App
    </Button>
  );
}
