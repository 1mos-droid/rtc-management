import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Role Hierarchy: developer > admin > department_head > member
export const ROLES = {
  DEVELOPER: 'developer',
  ADMIN: 'admin',
  DEPARTMENT_HEAD: 'department_head',
  MEMBER: 'member',
};

export const ROLE_LEVELS = {
  [ROLES.DEVELOPER]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.DEPARTMENT_HEAD]: 2,
  [ROLES.MEMBER]: 1,
};
