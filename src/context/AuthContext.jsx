import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { useToast } from "@/components/ui/use-toast";
import { debug } from '@/lib/logger.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const applyFixedLightTheme = () => {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.remove('dark');
  root.classList.add('light');
  debug.log('[applyFixedLightTheme] Applied light theme to documentElement.');
};

const AuthProvider = ({ children }) => {
  debug.log('[AuthProvider] Mounting/Re-rendering');

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const { toast } = useToast();

  const getSessionAndProfile = useCallback(async () => {
    debug.log('[getSessionAndProfile] Starting session and profile fetch.');

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        debug.error('[getSessionAndProfile] Error fetching session:', error.message);
        setCurrentUser(null);
        return;
      }

      if (data?.session?.user) {
        debug.log('[getSessionAndProfile] Session found. Fetching user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profileError) {
          debug.error('[getSessionAndProfile] Error fetching profile:', profileError.message);
          setCurrentUser(null);
        } else {
          setCurrentUser({ ...data.session.user, ...profile });
          debug.log('[getSessionAndProfile] User profile fetched:', profile);
        }
      } else {
        debug.log('[getSessionAndProfile] No session found.');
        setCurrentUser(null);
      }
    } catch (err) {
      debug.error('[getSessionAndProfile] Unexpected error:', err.message);
      setCurrentUser(null);
    } finally {
      setLoading(false);
      setInitialAuthChecked(true);
      debug.log('[getSessionAndProfile] Completed session and profile fetch.');
    }
  }, []);

  useEffect(() => {
    debug.log('[AuthProvider useEffect] Initializing auth provider...');
    applyFixedLightTheme();
    getSessionAndProfile();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      debug.log('[onAuthStateChange] Event:', event);
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    // Manejar el caso en el que `subscription` no sea válido
    return () => {
      debug.log('[AuthProvider useEffect] Cleaning up...');
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      } else {
        debug.warn('[AuthProvider useEffect] No valid subscription to unsubscribe.');
      }
    };
  }, [getSessionAndProfile]);

  const login = useCallback(async (email, password) => {
    debug.log('[login] Attempting login for email:', email);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        debug.error('[login] Error during login:', error.message);
        throw error;
      }

      if (data.user) {
        setCurrentUser(data.user);
        debug.log('[login] Login successful for user:', data.user.id);
      }
    } catch (err) {
      toast({ title: "Error de Inicio de Sesión", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    debug.log('[logout] Logging out user.');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        debug.error('[logout] Error during logout:', error.message);
        throw error;
      }

      setCurrentUser(null);
      debug.log('[logout] User logged out successfully.');
    } catch (err) {
      toast({ title: "Error al Cerrar Sesión", description: err.message, variant: "destructive" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const contextValue = useMemo(() => ({
    currentUser,
    loading,
    initialAuthChecked,
    login,
    logout,
  }), [currentUser, loading, initialAuthChecked, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <div>Cargando Aplicación...</div> : children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };