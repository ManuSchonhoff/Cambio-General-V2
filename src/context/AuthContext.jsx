import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { useToast } from "@/components/ui/use-toast";
import { debug } from '@/lib/logger.jsx';

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
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const { toast } = useToast();

  const getSessionAndUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[AuthProvider] Fetching session...');
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.warn('[AuthProvider] No session found:', error?.message || 'No session');
        setCurrentUser(null);
        return;
      }

      const user = data.session.user;
      console.log('[AuthProvider] Session found:', user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, role, avatar_url, theme')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[AuthProvider] Error fetching profile:', profileError.message);
        toast({ title: "Error", description: "No se pudo cargar el perfil.", variant: "destructive" });
        setCurrentUser({ ...user, role: 'user', theme: getInitialTheme() });
      } else {
        console.log('[AuthProvider] Profile loaded successfully:', profile);
        setCurrentUser({ ...user, ...profile });
        defaultApplyTheme(profile.theme || 'system');
      }
    } catch (err) {
      console.error('[AuthProvider] Unexpected error:', err.message);
    } finally {
      setLoading(false);
      setInitialAuthChecked(true);
    }
  }, [toast]);

  useEffect(() => {
    console.log('[AuthProvider] Initializing...');
    getSessionAndUserProfile().then(() => {
      console.log('[AuthProvider] Initialization complete.');
    });
  }, [getSessionAndUserProfile]);

  // ✅ FUNCIÓN DE LOGIN FINAL: con logs y actualización de usuario
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[login()] Resultado:', { data, error });
    if (error) {
      throw new Error(error.message);
    }

    // Actualiza el perfil del usuario después de iniciar sesión
    await getSessionAndUserProfile();
    return data;
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, initialAuthChecked, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
