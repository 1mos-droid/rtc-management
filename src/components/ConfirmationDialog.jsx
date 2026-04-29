import React from 'react';
import {
  Dialog,
  Button,
  Typography,
  Box,
  alpha,
  useTheme,
  Stack
} from '@mui/material';
import { AlertTriangle } from 'lucide-react';

const ConfirmationDialog = ({ open, title, message, onConfirm, onClose, confirmText = "Confirm", cancelText = "Discard", severity = "error" }) => {
  const theme = useTheme();
  const color = severity === 'error' ? theme.palette.error.main : theme.palette.primary.main;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      slotProps={{ paper: { sx: { borderRadius: 0, width: '100%', maxWidth: 400, p: 4 } } }}
    >
        <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ 
                width: 60, height: 60, borderRadius: 0, 
                bgcolor: alpha(color, 0.05), color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3
            }}>
                <AlertTriangle size={30} />
            </Box>
            
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, fontFamily: 'Merriweather' }}>{title}</Typography>
            <Typography variant="body2" sx={{ mb: 6, color: 'text.secondary', fontFamily: 'Lora', lineHeight: 1.8 }}>{message}</Typography>

            <Stack direction="row" spacing={2}>
                <Button fullWidth variant="outlined" onClick={onClose} sx={{ fontWeight: 800 }}>{cancelText}</Button>
                <Button 
                    fullWidth variant="contained" 
                    color={severity === 'error' ? 'error' : 'primary'}
                    onClick={() => { onConfirm(); onClose(); }}
                    sx={{ fontWeight: 800 }}
                >
                    {confirmText}
                </Button>
            </Stack>
        </Box>
    </Dialog>
  );
};

export default ConfirmationDialog;
