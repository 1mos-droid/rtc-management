import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// --- PAGE IMPORTS (Lazy Loaded) ---
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Members = lazy(() => import('../pages/Members'));
const Attendance = lazy(() => import('../pages/Attendance'));
const Financials = lazy(() => import('../pages/Financials'));
const Events = lazy(() => import('../pages/Events'));
const Reports = lazy(() => import('../pages/Reports'));
const UserManagement = lazy(() => import('../pages/UserManagement'));
const QuickSwitch = lazy(() => import('../pages/QuickSwitch'));
const Help = lazy(() => import('../pages/Help'));
const Settings = lazy(() => import('../pages/Settings'));
const BibleStudies = lazy(() => import('../pages/BibleStudies'));
const LiveBible = lazy(() => import('../pages/LiveBible'));
const Graph = lazy(() => import('../pages/Graph'));
const Login = lazy(() => import('../pages/Login'));
const Signup = lazy(() => import('../pages/Signup'));
const DeveloperView = lazy(() => import('../pages/DeveloperView'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <CircularProgress size={40} />
  </Box>
);

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ roles, children }) => {
  const { user, hasRole, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || !hasRole(roles)) return <Navigate to="/" replace />;
  return children;
};

const AppRouter = () => {
  const location = useLocation();
  const { ROLES } = useAuth();
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/members" element={<RequireAuth><RequireRole roles={[ROLES.DEPARTMENT_HEAD]}><Members /></RequireRole></RequireAuth>} />
        <Route path="/attendance" element={<RequireAuth><RequireRole roles={[ROLES.DEPARTMENT_HEAD]}><Attendance /></RequireRole></RequireAuth>} />
        <Route path="/financials" element={<RequireAuth><RequireRole roles={[ROLES.DEPARTMENT_HEAD]}><Financials /></RequireRole></RequireAuth>} />
        <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><RequireRole roles={[ROLES.DEPARTMENT_HEAD]}><Reports /></RequireRole></RequireAuth>} />
        <Route path="/bible-studies" element={<RequireAuth><BibleStudies /></RequireAuth>} />
        <Route path="/live-bible" element={<RequireAuth><LiveBible /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/help" element={<RequireAuth><Help /></RequireAuth>} />

        {/* Developer Only Routes */}
        <Route path="/developer" element={<RequireAuth><RequireRole roles={[ROLES.DEVELOPER]}><DeveloperView /></RequireRole></RequireAuth>} />

        {/* Admin Restricted Routes */}
        <Route path="/user-management" element={<RequireAuth><RequireRole roles={[ROLES.ADMIN]}><UserManagement /></RequireRole></RequireAuth>} />
        <Route path="/quick-switch" element={<RequireAuth><RequireRole roles={[ROLES.ADMIN]}><QuickSwitch /></RequireRole></RequireAuth>} />
        <Route path="/graph" element={<RequireAuth><RequireRole roles={[ROLES.ADMIN]}><Graph /></RequireRole></RequireAuth>} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
