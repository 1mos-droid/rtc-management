import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  InputAdornment, 
  useTheme,
  IconButton,
  alpha,
  Stack,
  Avatar,
  Paper,
  Divider,
  Button
} from '@mui/material';
import { 
  Search, 
  HelpCircle, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Mail,
  LifeBuoy,
  Book,
  Shield,
  Zap,
  Globe,
  Compass,
  Sparkles
} from 'lucide-react';

const Help = () => {
  const theme = useTheme();
  const [expandedId, setExpandedId] = useState(null);

  const faqs = [
    { id: 1, q: "How is data synchronization handled?", a: "The RTC system utilizes real-time Firebase listeners to ensure that congregational and financial data is updated instantly across all active ministerial sessions." },
    { id: 2, q: "Is the platform accessible offline?", a: "Yes. As a Progressive Web App (PWA), core registry and curriculum files are cached locally on your device for access during limited connectivity." },
    { id: 3, q: "Who manages system privileges?", a: "Ministerial access levels are governed by the Security module, accessible only by the Senior Administrator in the Main Sanctuary environment." }
  ];

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 10, textAlign: 'center' }}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "center", mb: 2 }}>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                <Compass size={20} />
            </Box>
            <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 4, color: 'primary.main' }}>GUIDANCE & SUPPORT</Typography>
        </Stack>
        <Typography variant="h2" sx={{ fontWeight: 400, color: 'primary.main', mb: 2 }}>Navigating the Sanctuary</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: 'auto', fontFamily: 'Lora', fontStyle: 'italic' }}>
             A collection of guides and protocols to assist you in the diligent operation of the RTC digital infrastructure.
        </Typography>
        
        <Paper elevation={0} sx={{ mt: 8, maxWidth: 700, mx: 'auto', p: 1, borderRadius: 100, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
            <Search size={20} color={theme.palette.text.disabled} style={{ marginLeft: 24 }} />
            <TextField fullWidth variant="standard" placeholder="Seek ministerial guidance or search for topics..." slotProps={{ input: { disableUnderline: true, sx: { fontFamily: 'Lora', py: 2, fontSize: '1.1rem' } } }} />
        </Paper>
      </Box>

      <Grid container spacing={8}>
        <Grid size={{ xs: 12, lg: 8 }}>
            <Typography variant="h4" sx={{ mb: 5, fontFamily: 'DM Serif Display' }}>Frequent Inquiries</Typography>
            <Stack spacing={3}>
                {faqs.map((faq) => (
                    <Paper key={faq.id} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, overflow: 'hidden' }}>
                        <Box 
                            onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                            sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}
                        >
                            <Typography fontWeight={800} variant="h6" sx={{ color: expandedId === faq.id ? 'primary.main' : 'text.primary' }}>{faq.q}</Typography>
                            {expandedId === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </Box>
                        <AnimatePresence>
                            {expandedId === faq.id && (
                                <Box sx={{ px: 5, pb: 5, pt: 1, color: 'text.secondary', fontFamily: 'Lora', lineHeight: 2, fontSize: '1.1rem' }}>
                                    <Divider sx={{ mb: 4, borderStyle: 'dashed' }} />
                                    {faq.a}
                                </Box>
                            )}
                        </AnimatePresence>
                    </Paper>
                ))}
            </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 6, borderRadius: 6, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.02), position: 'relative', overflow: 'hidden' }}>
                <Sparkles size={80} style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }} />
                <LifeBuoy size={40} color={theme.palette.primary.main} />
                <Typography variant="h4" sx={{ mt: 4, mb: 2, fontFamily: 'DM Serif Display' }}>Direct Support</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 6, fontFamily: 'Lora', lineHeight: 1.8, fontSize: '1rem', fontStyle: 'italic' }}>
                    If you encounter technical impediments or require ministerial clarification, our support office is available.
                </Typography>
                <Button fullWidth variant="contained" sx={{ py: 2, borderRadius: 100 }}>Initiate Assistance</Button>
                <Box sx={{ mt: 5, textAlign: 'center' }}>
                    <Typography variant="caption" fontWeight={900} color="text.disabled" sx={{ letterSpacing: 2 }}>SUPPORT@RTCCHAPEL.ORG</Typography>
                </Box>
            </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Help;
