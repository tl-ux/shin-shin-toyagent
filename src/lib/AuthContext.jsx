// =============================================================
// src/lib/AuthContext.jsx  (גרסה חדשה - Supabase)
// מחליף את AuthContext.jsx המקורי של Base44
// =============================================================

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                             = useState(null);
  const [isAuthenticated, setIsAuthenticated]       = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]           = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError]                   = useState(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    });

    // Listen for auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        setAuthError({ type: 'user_not_registered', message: 'User not registered' });
        setIsLoadingAuth(false);
        return;
      }

      setUser({
        id:        profile.id,
        email:     profile.email,
        full_name: profile.full_name,
        role:      profile.role,
      });
      setIsAuthenticated(true);
      setAuthError(null);

      // רשום התחברות ושלח התראה אם store_manager
      if (profile.role === 'store_manager') {
        try {
          await supabase.from('login_events').insert({
            user_id: profile.id,
            user_email: profile.email,
            user_name: profile.full_name,
            role: profile.role,
          });
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('https://rdvvkefnhgegcviluokx.supabase.co/functions/v1/sendOrderEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({
              subject: `התחברות - ${profile.full_name || profile.email}`,
              html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>התחברות לאפליקציה</h2><p><strong>${profile.full_name || profile.email}</strong> התחבר/ה לאפליקציה.</p><p>תפקיד: מנהל חנות</p><p>זמן: ${new Date().toLocaleString('he-IL')}</p></div>`
            }),
          });
        } catch(e) { console.error('login notification error:', e); }
      }
    } catch (err) {
      setAuthError({ type: 'unknown', message: err.message });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
