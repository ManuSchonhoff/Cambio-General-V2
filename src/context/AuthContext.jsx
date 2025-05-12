
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

const getSessionWithTimeout = async (timeoutMs = 7000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`supabase.auth.getSession() timed out after ${timeoutMs} milliseconds`)), timeoutMs)
  );

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      timeoutPromise,
    ]);
    
    const { data, error } = result;

    if (error) {
      debug.error('[getSessionWithTimeout] Supabase error:', error.message);
      return null;
    }

    return data.session;
  } catch (err) {
    debug.error('[getSessionWithTimeout] Catch block. Error:', err.message);
    return null;
  }
};


const AuthProvider = ({ children }) => {
  debug.log('[AuthProvider] Mounting/Re-rendering');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const { toast } = useToast();
  
  const activeFetchControllers = useRef(new Set());

  const applyTheme = useCallback((theme) => {
    defaultApplyTheme(theme);
    if (currentUser && currentUser.theme !== theme) {
      setCurrentUser(prev => prev ? ({ ...prev, theme }) : null);
    }
  }, [currentUser]);

  const fetchUserProfile = useCallback(async (user, signal) => {
    if (!user) {
      debug.log('[fetchUserProfile] No user provided, returning null.');
      return null;
    }
    debug.log('[fetchUserProfile] Fetching profile for user:', user.id);

    if (signal?.aborted) {
      debug.log('[fetchUserProfile] Aborted before fetch for user:', user.id);
      return null;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, role, avatar_url, theme')
        .eq('id', user.id)
        .single();

      if (signal?.aborted) {
        debug.log('[fetchUserProfile] Aborted after fetch for user:', user.id);
        return null;
      }

      if (error && error.code !== 'PGRST116') { 
        debug.error('[fetchUserProfile] Error fetching profile:', error.message, error.code);
        throw error;
      }
      
      const userProfile = profile ? { ...user, ...profile } : { ...user, username: user.email?.split('@')[0] || 'Usuario', role: 'user', theme: profile?.theme || getInitialTheme() };
      debug.log('[fetchUserProfile] Profile fetched/constructed:', userProfile);
      
      if (!signal?.aborted) {
        applyTheme(userProfile.theme);
      }
      return userProfile;

    } catch (error) {
      debug.error('[fetchUserProfile] Catch block. Error fetching profile:', error.message);
      if (!(error.name === 'AbortError' || signal?.aborted)) {
        toast({ title: "Error al cargar perfil", description: `No se pudo obtener la información del perfil. ${error.message}`, variant: "destructive" });
      }
      return { ...user, username: user.email?.split('@')[0] || 'Usuario', role: 'user', theme: getInitialTheme() }; 
    }
  }, [applyTheme, toast]);

  const manageLoadingAndAuthCheck = useCallback((isInitialCall, operationType = "generic") => {
    debug.log(`[manageLoadingAuthCheck] Called from ${operationType}. Active controllers: ${activeFetchControllers.current.size}. isInitialCall: ${isInitialCall}. Current initialAuthChecked: ${initialAuthChecked}`);
    if (activeFetchControllers.current.size === 0) {
      setLoading(false);
      if (!initialAuthChecked) { 
         setInitialAuthChecked(true);
         debug.log(`[manageLoadingAuthCheck ${operationType}] State updated: initialAuthChecked: true`);
      }
      debug.log(`[manageLoadingAuthCheck ${operationType}] State updated: loading: false`);
    } else {
      debug.log(`[manageLoadingAuthCheck ${operationType}] Other fetches in progress. Not setting loading:false/initialAuthChecked:true yet.`);
    }
  }, [initialAuthChecked]);
  
  const getSessionAndProfile = useCallback(async (isInitialCall = false, operationOrigin = "unknown") => {
    debug.log(`[getSessionAndProfile - ${operationOrigin}] Called. isInitialCall: ${isInitialCall}. Current loading: ${loading}, initialAuthChecked: ${initialAuthChecked}`);
    
    const controller = new AbortController();
    const { signal } = controller;
    activeFetchControllers.current.add(controller);

    if (!isInitialCall && loading && operationOrigin !== "onAuthStateChange" && operationOrigin !== "visibilityChange" && operationOrigin !== "initialLoad") {
        debug.log(`[getSessionAndProfile - ${operationOrigin}] Not initial call and already loading, returning early.`);
        activeFetchControllers.current.delete(controller); 
        manageLoadingAndAuthCheck(isInitialCall, `getSessionAndProfileEarlyExit-${operationOrigin}`);
        return;
    }
    
    if (!loading) setLoading(true);
    debug.log(`[getSessionAndProfile - ${operationOrigin}] State updated: loading: true`);

    let sessionTimedOut = false;
    try {
      const session = await getSessionWithTimeout(); 
      debug.log(`[getSessionAndProfile - ${operationOrigin}] getSessionWithTimeout response. Session:`, session ? { user: session.user?.id, expires_at: session.expires_at } : null);
      
      if (signal.aborted) {
        debug.log(`[getSessionAndProfile - ${operationOrigin}] Aborted before fetching profile.`);
        activeFetchControllers.current.delete(controller);
        manageLoadingAndAuthCheck(isInitialCall, `getSessionAndProfileAborted-${operationOrigin}`);
        return;
      }

      if (session?.user) {
        debug.log(`[getSessionAndProfile - ${operationOrigin}] Session user found. Fetching profile.`);
        const profile = await fetchUserProfile(session.user, signal);
        if (!signal.aborted && profile) {
          setCurrentUser(profile);
          debug.log(`[getSessionAndProfile - ${operationOrigin}] setCurrentUser with profile:`, profile);
        } else if (!signal.aborted) {
           setCurrentUser(null);
           applyTheme(getInitialTheme());
        }
      } else {
        debug.log(`[getSessionAndProfile - ${operationOrigin}] No session user found.`);
        setCurrentUser(null);
        applyTheme(getInitialTheme()); 
        if (isInitialCall && !session) { 
          const errorDescription = 'No se pudo conectar con el servidor o la sesión no es válida. Verifica tu conexión e intenta refrescar.';
          toast({ title: "Error de Red o Sesión", description: errorDescription, variant: "destructive", duration: 9000 });
        }
      }
    } catch (error) { 
      debug.error(`[getSessionAndProfile - ${operationOrigin}] Catch block. Error:`, error.message);
      if (signal.aborted || error.name === 'AbortError') {
        debug.log(`[getSessionAndProfile - ${operationOrigin}] Aborted in catch block.`);
      } else if (error.message.includes('timed out')) { 
        sessionTimedOut = true; 
        toast({ title: "Error de Red", description: "No se pudo conectar con el servidor de autenticación. Verifica tu conexión.", variant: "destructive", duration: 9000 });
      } else {
        setCurrentUser(null);
        applyTheme(getInitialTheme());
        if (isInitialCall || (typeof document !== 'undefined' && document.visibilityState === 'visible')) {
           toast({ title: "Error de Sesión", description: `No se pudo verificar la sesión: ${error.message}. Intenta refrescar.`, variant: "destructive" });
        }
      }
    } finally {
      debug.log(`[getSessionAndProfile - ${operationOrigin}] Finally block. isInitialCall: ${isInitialCall}`);
      activeFetchControllers.current.delete(controller);
      manageLoadingAndAuthCheck(isInitialCall, `getSessionAndProfileFinally-${operationOrigin}`);
      if (isInitialCall && sessionTimedOut) {
         debug.warn(`[getSessionAndProfile - ${operationOrigin}] Session timed out during initial call. Application will proceed without session.`);
         if (!initialAuthChecked) {
            setInitialAuthChecked(true);
            debug.log(`[getSessionAndProfile - ${operationOrigin} - TIMEOUT FALLBACK] State updated: initialAuthChecked: true`);
         }
      }
    }
  }, [fetchUserProfile, applyTheme, toast, loading, initialAuthChecked, manageLoadingAndAuthCheck]);

  useEffect(() => {
    debug.log('[AuthProvider useEffect] Running effect. Applying initial theme.');
    applyTheme(getInitialTheme()); 
    
    debug.log('[AuthProvider useEffect] Initial call to getSessionAndProfile.');
    getSessionAndProfile(true, "initialLoad");

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      debug.log('[onAuthStateChange] Event triggered. Event:', event, 'Session:', session ? { user: session.user?.id, eventType: session.event } : null);
      
      const controller = new AbortController();
      const { signal } = controller;
      activeFetchControllers.current.add(controller);
      
      if (!loading) setLoading(true);
      debug.log('[onAuthStateChange] State updated: loading: true');

      try {
        if (session?.user) {
          debug.log('[onAuthStateChange] Session user found. Fetching profile.');
          const profile = await fetchUserProfile(session.user, signal);
          if (!signal.aborted && profile) {
            setCurrentUser(profile);
            debug.log('[onAuthStateChange] setCurrentUser with profile:', profile);
          } else if(!signal.aborted) {
            setCurrentUser(null);
            applyTheme(getInitialTheme());
          }
        } else {
          debug.log('[onAuthStateChange] No session user found.');
          setCurrentUser(null);
          applyTheme(getInitialTheme());
        }
      } catch (error) {
        debug.error("[onAuthStateChange] Catch block. Error:", error.message);
        if (!(error.name === 'AbortError' || signal?.aborted)) {
          setCurrentUser(null);
          applyTheme(getInitialTheme());
          toast({ title: "Error de Autenticación", description: `Ocurrió un error: ${error.message}`, variant: "destructive" });
        }
      } finally {
        debug.log(`[onAuthStateChange] Finally block.`);
        activeFetchControllers.current.delete(controller);
        manageLoadingAndAuthCheck(false, "onAuthStateChange");
      }
    });
    
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      debug.log(`[handleVisibilityChange] Visibility changed. document.visibilityState: ${document.visibilityState}`);
      if (document.visibilityState === 'visible') {
        debug.log('[handleVisibilityChange] Document visible. Calling getSessionAndProfile(false).');
        getSessionAndProfile(false, "visibilityChange");
      }
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      debug.log('[AuthProvider useEffect] Cleanup function running.');
      authListener.data.subscription?.unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      activeFetchControllers.current.forEach(controllerItem => controllerItem.abort('AuthProvider unmounting'));
      activeFetchControllers.current.clear();
      debug.log('[AuthProvider useEffect Cleanup] Listeners unsubscribed and fetches aborted.');
    };
  }, [getSessionAndProfile, applyTheme, fetchUserProfile, loading, toast, manageLoadingAndAuthCheck]);


  const login = useCallback(async (email, password) => {
    debug.log('[login] Attempting login for:', email);
    setLoading(true);
    let loginError = null;
    debug.log('[login] State updated: loading: true');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      debug.log('[login] supabase.auth.signInWithPassword response. Data:', data ? {user: data.user?.id} : null, 'Error:', error);
      if (error) {
        loginError = error;
        throw error;
      }
      if (data.user) {
        return data.user;
      }
      return null;
    } catch (error) {
      debug.error("[login] Catch block. Error:", error.message);
      setCurrentUser(null); 
      toast({ title: "Error de Inicio de Sesión", description: loginError?.message || error.message, variant: "destructive" });
      throw error; 
    } finally {
      debug.log(`[login] Finally block.`);
      if(!initialAuthChecked) {
        setInitialAuthChecked(true);
        debug.log('[login] State updated: initialAuthChecked: true');
      }
    }
  }, [toast, initialAuthChecked]); 

  const logout = useCallback(async () => {
    debug.log('[logout] Attempting logout.');
    activeFetchControllers.current.forEach(controllerItem => controllerItem.abort('User logging out'));
    activeFetchControllers.current.clear();
    debug.log('[logout] Aborted any active profile fetches.');

    setLoading(true);
    debug.log('[logout] State updated: loading: true');
    try {
      const { error } = await supabase.auth.signOut();
      debug.log('[logout] supabase.auth.signOut response. Error:', error);
      if (error) throw error;
      setCurrentUser(null);
      applyTheme(getInitialTheme()); 
    } catch (error) {
      debug.error("[logout] Catch block. Error:", error.message);
      toast({ title: "Error al cerrar sesión", description: error.message, variant: "destructive" });
    } finally {
      debug.log(`[logout] Finally block. Setting loading: false, initialAuthChecked: true`);
      setLoading(false);
      setInitialAuthChecked(true); 
      debug.log('[logout] State updated: loading: false, initialAuthChecked: true');
    }
  }, [applyTheme, toast]);
  
  const createUserAccount = useCallback(async (email, password, username) => {
    debug.log('[createUserAccount] Attempting to create account for:', email, 'Username:', username);
    setLoading(true);
    let signupError = null;
    debug.log('[createUserAccount] State updated: loading: true');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            role: 'user', 
            theme: getInitialTheme()
          }
        }
      });
      debug.log('[createUserAccount] supabase.auth.signUp response. authData:', authData ? {user: authData.user?.id} : null, 'authError:', authError);

      if (authError) {
        signupError = authError;
        throw authError;
      }
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      debug.log('[createUserAccount] Inserting profile for user ID:', authData.user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: authData.user.id, username, role: 'user', theme: getInitialTheme(), updated_at: new Date().toISOString() }
        ]);
      debug.log('[createUserAccount] supabase.from(profiles).insert response. profileError:', profileError);

      if (profileError) {
          debug.warn("[createUserAccount] Profile insertion failed or profile might already exist:", profileError.message);
          toast({ title: "Advertencia Creación de Perfil", description: `El usuario fue creado, pero hubo un problema al guardar el perfil: ${profileError.message}. Contacta a soporte.`, variant: "default", duration: 10000 });
      }
      return authData.user;

    } catch (error) {
      debug.error("[createUserAccount] Catch block. Error:", error.message);
      setCurrentUser(null);
      toast({ title: "Error al Crear Cuenta", description: signupError?.message || error.message, variant: "destructive" });
      throw error; 
    } finally {
      debug.log(`[createUserAccount] Finally block.`);
      if(!initialAuthChecked) {
        setInitialAuthChecked(true);
        debug.log('[createUserAccount] State updated: initialAuthChecked: true');
      }
    }
  }, [toast, initialAuthChecked]); 

  const updateUserProfile = useCallback(async (userId, updates) => {
    debug.log('[updateUserProfile] Attempting to update profile for user ID:', userId, 'Updates:', updates);
    setLoading(true);
    debug.log('[updateUserProfile] State updated: loading: true');
    const controller = new AbortController();
    activeFetchControllers.current.add(controller);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      debug.log('[updateUserProfile] supabase.from(profiles).update response. Data:', data, 'Error:', error);

      if (controller.signal.aborted) {
        debug.log('[updateUserProfile] Aborted after update attempt.');
        return null;
      }
      if (error) throw error;
      
      if (data) {
         setCurrentUser(prevUser => {
           const updatedUser = prevUser ? { ...prevUser, ...data } : data;
           debug.log('[updateUserProfile] setCurrentUser with updated profile:', updatedUser);
           return updatedUser;
         });
         if (updates.theme) {
           applyTheme(updates.theme);
         }
         toast({ title: "Perfil Actualizado", description: "Tu información de perfil ha sido guardada.", variant: "default" });
      }
      return data;
    } catch (error) {
      debug.error("[updateUserProfile] Catch block. Error:", error.message);
      if (!(error.name === 'AbortError' || controller.signal.aborted )) {
         toast({ title: "Error al Actualizar Perfil", description: `No se pudo guardar tu perfil: ${error.message}`, variant: "destructive" });
      }
      throw error;
    } finally {
      debug.log(`[updateUserProfile] Finally block.`);
      activeFetchControllers.current.delete(controller);
      manageLoadingAndAuthCheck(false, "updateUserProfile");
    }
  }, [applyTheme, toast, initialAuthChecked, manageLoadingAndAuthCheck]);

  const contextValue = useMemo(() => ({
    currentUser,
    loading,
    initialAuthChecked,
    login,
    logout,
    createUserAccount,
    updateUserProfile,
    applyTheme,
    fetchUserProfile 
  }), [
    currentUser, 
    loading, 
    initialAuthChecked, 
    login, 
    logout, 
    createUserAccount, 
    updateUserProfile, 
    applyTheme, 
    fetchUserProfile
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
