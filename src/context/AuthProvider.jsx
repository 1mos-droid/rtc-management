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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        // If we get an unauthorized error here, the session is likely dead
        if (error.code === 'PGRST301' || error.message?.toLowerCase().includes('jwt')) {
          console.warn("🔐 Session invalid or expired. Signing out.");
          await supabase.auth.signOut();
          return null;
        }
        throw error;
      }

      if (!profile) {
        console.log("🛠️ Syncing profile for user...");
        // Use upsert to handle potential race conditions with the DB trigger
        const { data: syncedProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert([{
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member',
            role: authUser.user_metadata?.role || ROLES.MEMBER,
            department: authUser.user_metadata?.department || null
          }], { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (upsertError) {
          // If it's a 409/duplicate after all, try one more fetch as it means it was just created
          if (upsertError.code === '23505') {
            const { data: retryProfile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
            if (retryProfile) return retryProfile;
          }
          console.error("❌ Profile Sync Failed:", upsertError.message);
          return null;
        }
        return syncedProfile;
      }

      return profile;
    } catch (err) {
      console.error("🛑 Profile sync error:", err);
      return null;
    }
  }, []);

  const fetchUserMetadata = useCallback(async (authUser) => {
    try {
      const profile = await ensureProfileSync(authUser);
      
      // We prioritize the database profile, but fallback to auth metadata 
      // if the profile is missing or sync fails non-critically.
      return {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member',
        role: profile?.role || authUser.user_metadata?.role || ROLES.MEMBER,
        department: profile?.department || authUser.user_metadata?.department || null,
      };
    } catch (err) {
      console.error("Failed to fetch user metadata:", err);
      return { 
        id: authUser.id, 
        email: authUser.email, 
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Member',
        role: authUser.user_metadata?.role || ROLES.MEMBER, 
        department: authUser.user_metadata?.department || null 
      };
    }
  }, [ensureProfileSync]);

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
      // Safety timeout: if auth takes > 8s, we force loading to false to avoid "stuck" UI
      const timeout = setTimeout(() => {
        if (mounted && loading) {
          console.warn("⚠️ Auth initialization timed out. Forcing UI state.");
          setLoading(false);
        }
      }, 8000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          if (session?.user) {
            const combinedUser = await fetchUserMetadata(session.user);
            setUser(combinedUser);
            // If combinedUser is null, ensureProfileSync already handled the signOut
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error("🛑 Auth initialization failed:", e);
        if (mounted) setUser(null);
      } finally {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔑 Auth Event: ${event}`);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (session?.user) {
        // Ensure we show loading state while fetching metadata
        if (mounted) setLoading(true);
        const combinedUser = await fetchUserMetadata(session.user);
        if (mounted) {
          setUser(combinedUser);
          setLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
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
      
      // We no longer manually fetch metadata and setUser here.
      // onAuthStateChange will catch the SIGNED_IN event and handle it.
      // This prevents race conditions where two concurrent metadata fetches 
      // could collide or set state out of order.
      return data.user;
    } catch (err) {
      console.error("Supabase Auth Error:", err);
      let message = err.message || 'Invalid email or password.';
      setError(message);
      setLoading(false); // Only set loading false on error
      throw new Error(message);
    }
    // Note: We don't have a 'finally { setLoading(false) }' here because 
    // onAuthStateChange will handle the success path.
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
        // If the user is logged in immediately (Confirm Email is OFF in Supabase),
        // we can and should perform a client-side upsert to ensure the profile exists.
        if (data.session) {
          console.log("Session detected, performing manual profile sync...");
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              name,
              role: ROLES.MEMBER,
              department
            });
        }
        
        return { user: data.user, session: data.session };
      }
    } catch (err) {
      console.error("Signup Error:", err);
      let message = err.message || 'Registration failed.';
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
    // onAuthStateChange will handle loading(false) if a session was created.
    // If no session was created (e.g. email confirmation required), signup 
    // needs to handle its own loading state.
    setLoading(false);
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
    isPastor: hasRole(ROLES.PASTOR),
    isDeptHead: hasRole(ROLES.DEPARTMENT_HEAD),
    isAuthenticated: !!user,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
