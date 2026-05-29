"use client";
import React from 'react';
import { Box, Container, Typography, Paper, useTheme, Button } from '@mui/material';
import Link from 'next/link';

const TermsOfService = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h4" gutterBottom color="primary.main" fontWeight={700}>
            Terms of Service
          </Typography>
          <Typography variant="body1" paragraph>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or using our application, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            2. User Responsibilities
          </Typography>
          <Typography variant="body1" paragraph>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            3. Modifications to Service
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.
          </Typography>
          <Typography variant="h6" gutterBottom mt={4}>
            4. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
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

export default TermsOfService;