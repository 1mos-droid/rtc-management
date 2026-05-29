"use client";
import React from 'react';
import { Box, Container, Typography, Paper, useTheme, Button } from '@mui/material';
import Link from 'next/link';

const PrivacyPolicy = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h4" gutterBottom color="primary.main" fontWeight={700}>
            Privacy Policy
          </Typography>
          <Typography variant="body1" paragraph>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect information you provide directly to us when you register for an account, update your profile, or use our services.
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you.
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            3. Information Sharing and Disclosure
          </Typography>
          <Typography variant="body1" paragraph>
            We do not share your personal information with third parties except as described in this privacy policy or with your consent.
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
          </Typography>
          <Box sx={{ mt: 6 }}>
            <Button component={Link} href="/" variant="contained">
              Return to App
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;