import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';
import { AuthContext, ROLES, ROLE_LEVELS } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mimicRole, setMimicRole] = useState(null);

  const ensureProfileSync = useCallback(async (authUser) => {
    if (!authUser) return null;

    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile) {
        console.log("🛠️ Creating profile for new user...");
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member',
            role: authUser.user_metadata?.role || ROLES.MEMBER,
            department: authUser.user_metadata?.department || null
          }])
          .select()
          .maybeSingle();

        if (insertError) {
          console.error("❌ Profile Creation Failed:", insertError.message);
          return null;
        }
        return newProfile;
      }

      return profile;
    } catch (err) {
      console.error("🛑 Profile sync error:", err);
      return null;
    }
  }, [ROLES]);

  const fetchUserMetadata = useCallback(async (authUser) => {
    try {
      const profile = await ensureProfileSync(authUser);
      
      return {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || 'Member',
        role: profile?.role || authUser.user_metadata?.role || ROLES.MEMBER,
        department: profile?.department || authUser.user_metadata?.department || null,
      };
    } catch (err) {
      console.error("Failed to fetch user metadata:", err);
      return { 
        id: authUser.id, 
        email: authUser.email, 
        name: authUser.user_metadata?.name || 'Member',
        role: authUser.user_metadata?.role || ROLES.MEMBER, 
        department: authUser.user_metadata?.department || null 
      };
    }
  }, [ensureProfileSync, ROLES]);

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
      console.log("Initiating signup for:", email);
      const { data, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
            email,
            department,
            role: ROLES.MEMBER
          }
        }
      });
      
      if (authError) throw authError;

      if (data.user) {
        const combinedUser = { 
          id: data.user.id, 
          email: data.user.email, 
          name, 
          role: ROLES.MEMBER, 
          department 
        };
        
        // If the user is logged in immediately (Confirm Email is OFF in Supabase),
        // we can and should perform a client-side upsert to ensure the profile exists.
        if (data.session) {
          console.log("Session detected, performing manual profile sync...");
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              name,
              role: ROLES.MEMBER,
              department
            });
          
          if (profileError) {
            console.error("Manual profile sync failed:", profileError);
          } else {
            console.log("Manual profile sync successful.");
          }
          
          setUser(combinedUser);
        }
        
        return { user: combinedUser, session: data.session };
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
