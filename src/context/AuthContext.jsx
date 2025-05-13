import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const THEME_STORAGE_KEY = 'app-theme';

const defaultApplyTheme = (themePreference) => {
  if (typeof window === 'undefined') return;

  let themeToApply = themePreference;
  if (themePreference === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    themeToApply = systemTheme;
  }

  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(themeToApply);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  } catch (e) {
    debug.warn('[defaultApplyTheme] Failed to set theme in localStorage', e);
  }
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'system';
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      return storedTheme;
    }
  } catch (e) {
    debug.warn('[getInitialTheme] Failed to get theme from localStorage', e);
  }
  return 'system';
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getSessionAndUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        debug.error('[AuthProvider] No session found:', error?.message || 'No session');
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const user = data.session.user;
      debug.log('[AuthProvider] Session found:', user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, role, avatar_url, theme')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === '42703') {
          // Columna `theme` no existe
          debug.error('[AuthProvider] Columna `theme` no existe en la tabla profiles.');
          toast({ title: "Error", description: "Verifica la configuración de la base de datos. La columna `theme` no existe.", variant: "destructive" });
        } else {
          debug.error('[AuthProvider] Error fetching profile:', profileError.message);
          toast({ title: "Error", description: "No se pudo cargar el perfil.", variant: "destructive" });
        }
        setCurrentUser({ ...user, role: 'user', theme: getInitialTheme() });
      } else {
        setCurrentUser({ ...user, ...profile });
        defaultApplyTheme(profile.theme || 'system');
      }
    } catch (err) {
      debug.error('[AuthProvider] Unexpected error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    debug.log('[AuthProvider] Initializing...');
    getSessionAndUserProfile();
  }, [getSessionAndUserProfile]);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };