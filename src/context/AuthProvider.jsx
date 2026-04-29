import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { AuthContext, ROLES, ROLE_LEVELS } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mimicRole, setMimicRole] = useState(null);

  const fetchUserMetadata = useCallback(async (authUser) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        return {
          id: authUser.id,
          email: authUser.email,
          name: data.name,
          role: data.role || ROLES.MEMBER,
          department: data.department,
        };
      }
    } catch (err) {
      console.error("Failed to fetch user metadata:", err);
    }
    return { id: authUser.id, email: authUser.email, role: ROLES.MEMBER, department: null };
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const combinedUser = await fetchUserMetadata(session.user);
        setUser(combinedUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUserMetadata]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          const combinedUser = await fetchUserMetadata(session.user);
          setUser(combinedUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const combinedUser = await fetchUserMetadata(session.user);
        if (mounted) setUser(combinedUser);
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserMetadata]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      
      const combinedUser = await fetchUserMetadata(data.user);
      setUser(combinedUser);
      return combinedUser;
    } catch (err) {
      console.error("Supabase Auth Error:", err);
      let message = err.message || 'Invalid email or password.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, department = null) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, name, role: ROLES.MEMBER, department }]);
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        const combinedUser = { id: data.user.id, email, name, role: ROLES.MEMBER, department };
        setUser(combinedUser);
        return combinedUser;
      }
    } catch (err) {
      console.error("Signup Error:", err);
      let message = err.message || 'Registration failed.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setUser(null);
    setMimicRole(null);
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const effectiveRole = mimicRole || user.role;
    if (effectiveRole === ROLES.DEVELOPER) return true;
    if (Array.isArray(roles)) {
      return roles.some(role => {
        const userLevel = ROLE_LEVELS[effectiveRole] || 0;
        const requiredLevel = ROLE_LEVELS[role] || 0;
        return userLevel >= requiredLevel;
      });
    }
    const userLevel = ROLE_LEVELS[effectiveRole] || 0;
    const requiredLevel = ROLE_LEVELS[roles] || 0;
    return userLevel >= requiredLevel;
  }, [user, mimicRole]);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    refreshUser,
    hasRole,
    setMimicRole,
    mimicRole,
    isDeveloper: user?.role === ROLES.DEVELOPER,
    effectiveRole: mimicRole || user?.role,
    isAdmin: hasRole(ROLES.ADMIN),
    isDeptHead: hasRole(ROLES.DEPARTMENT_HEAD),
    isAuthenticated: !!user,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
