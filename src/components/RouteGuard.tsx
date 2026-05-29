"use client";
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography, alpha } from '@mui/material';

const PUBLIC_ROUTES = ['/login', '/signup'];

// Define role hierarchies/permissions for specific routes
const ROUTE_PERMISSIONS = [
  {
    prefix: '/developer',
    roles: ['developer']
  },
  {
    prefix: '/user-management',
    roles: ['admin', 'developer']
  },
  {
    prefix: '/quick-switch',
    roles: ['admin', 'developer']
  },
  {
    prefix: '/graph',
    roles: ['admin', 'developer']
  },
  {
    prefix: '/members',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  },
  {
    prefix: '/groups',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  },
  {
    prefix: '/children',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  },
  {
    prefix: '/messaging',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  },
  {
    prefix: '/attendance',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  },
  {
    prefix: '/financials',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  },
  {
    prefix: '/reports',
    roles: ['department_head', 'pastor', 'admin', 'developer']
  }
];

export function RouteGuard({ children }) {
  const { user, isAuthenticated, loading, mimicRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If auth state is still loading, wait
    if (loading) return;

    const isPublicPath = PUBLIC_ROUTES.includes(pathname);
    const activeRole = mimicRole || user?.role;

    if (!isAuthenticated) {
      // 1. Not Authenticated: Redirect to login if on any protected route
      if (!isPublicPath) {
        setAuthorized(false);
        router.push('/login');
      } else {
        setAuthorized(true);
      }
    } else {
      // 2. Authenticated: Prevent logged-in users from visiting login/signup
      if (isPublicPath) {
        setAuthorized(false);
        router.push('/');
        return;
      }

      // 3. Role Protection: Match current path against required roles
      const matchedRule = ROUTE_PERMISSIONS.find(rule => pathname.startsWith(rule.prefix));
      
      if (matchedRule) {
        const hasAccess = activeRole && matchedRule.roles.includes(activeRole);
        if (!hasAccess) {
          setAuthorized(false);
          router.push('/');
          return;
        }
      }

      // Safe to render the page
      setAuthorized(true);
    }
  }, [isAuthenticated, loading, pathname, user, mimicRole, router]);

  // Prevent hydration mismatch by returning null or a consistent placeholder during SSR
  if (!mounted) return null;

  if (loading || !authorized) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default',
        gap: 3
      }}>
        <CircularProgress size={36} color="secondary" thickness={4} />
        <Typography 
          variant="overline" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: '0.12em', 
            fontSize: '0.65rem',
            color: 'secondary.main',
            opacity: 0.8
          }}
        >
          Verifying Sanctuary Access...
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
