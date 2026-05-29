"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme, useMediaQuery, Box } from '@mui/material';

import MobileLayout from './layouts/MobileLayout';
import TabletLayout from './layouts/TabletLayout';
import DesktopLayout from './layouts/DesktopLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const pathname = usePathname();

  // Define our breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg')); // 600px - 1200px
  
  const isLoginPage = pathname === '/login' || pathname === '/signup';

  if (isLoginPage) {
    return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>;
  }

  // Render the appropriate layout based on screen size
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  if (isTablet) {
    return <TabletLayout>{children}</TabletLayout>;
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
