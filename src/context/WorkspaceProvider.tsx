"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Snackbar, Alert } from '@mui/material';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useAuth } from './AuthContext';
import { WorkspaceContext } from './WorkspaceContext';

export const WorkspaceProvider = ({ children }) => {
  const { user, ROLES, isAdmin, isDeveloper } = useAuth();
  
  const [workspace, setWorkspace] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeWorkspace') || 'main';
    }
    return 'main';
  });

  const userRole = useMemo(() => user?.role || ROLES.MEMBER, [user, ROLES]);

  // --- Global Notification State ---
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [confirmation, setConfirmation] = useState({ open: false, title: '', message: '', onConfirm: () => {}, severity: 'error' });

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const showConfirmation = ({ title, message, onConfirm, severity = 'error' }) => {
    setConfirmation({ open: true, title, message, onConfirm, severity });
  };

  const refreshUserContext = () => {
    const activeWs = typeof window !== 'undefined' ? localStorage.getItem('activeWorkspace') || 'main' : 'main';
    setWorkspace(activeWs);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      refreshUserContext();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const switchWorkspace = (id) => {
    setWorkspace(id);
    localStorage.setItem('activeWorkspace', id);
  };

  const filterData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(item => {
      if (!item) return false;

      // Hierarchical Scoping: Branch/Campus Restriction
      // If user has a campus assigned (and is not an admin/developer), restrict view to that campus
      if (user?.campus && !isDeveloper && !isAdmin) {
        if (item.campus && item.campus !== user.campus) return false;
      }

      if (workspace === 'main') return true; // Show all relevant in Main Sanctuary
      
      const department = (item.department || '').toLowerCase();
      const ws = workspace.toLowerCase();
      if (ws === 'youth' && department === 'youth') return true;
      if (ws === 'music' && department === 'music team') return true;
      if (ws === 'media' && department === 'media') return true;
      
      // Generic department/campus match
      if (department === ws) return true;
      if ((item.campus || '').toLowerCase() === ws) return true;

      return false;
    });
  };

  const canEdit = () => {
    if (isDeveloper || isAdmin) return true;
    if (userRole === ROLES.DEPARTMENT_HEAD) {
      return true;
    }
    return false;
  };

  const value = {
    workspace,
    switchWorkspace,
    filterData,
    userRole,
    canEdit,
    refreshUserContext,
    showNotification,
    showConfirmation
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      
      {/* Global Notification Component */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={5000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%', borderRadius: 3, boxShadow: 6, fontWeight: 600 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Global Confirmation Dialog */}
      <ConfirmationDialog 
        open={confirmation.open}
        title={confirmation.title}
        message={confirmation.message}
        severity={confirmation.severity}
        onConfirm={confirmation.onConfirm}
        onClose={() => setConfirmation({ ...confirmation, open: false })}
      />
    </WorkspaceContext.Provider>
  );
};
