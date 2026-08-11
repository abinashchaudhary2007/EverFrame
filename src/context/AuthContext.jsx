import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback: use localStorage session
      try {
        const saved = localStorage.getItem('everframe_user');
        if (saved) setUser(JSON.parse(saved));
      } catch (e) { /* ignore */ }
      setLoading(false);
      return;
    }

    // Get current session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = mapSupabaseUser(session.user);
        setUser(u);
        localStorage.setItem('everframe_user', JSON.stringify(u));
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = mapSupabaseUser(session.user);
        setUser(u);
        localStorage.setItem('everframe_user', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('everframe_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback mock login
      const u = { name: email.split('@')[0], email };
      setUser(u);
      localStorage.setItem('everframe_user', JSON.stringify(u));
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email, password, fullName) => {
    if (!isSupabaseConfigured || !supabase) {
      const u = { name: fullName, email };
      setUser(u);
      localStorage.setItem('everframe_user', JSON.stringify(u));
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, name: fullName },
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('everframe_user');
  };

  const resendVerificationEmail = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function mapSupabaseUser(supabaseUser) {
  const meta = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'User',
    avatar: meta.avatar_url || meta.picture || null,
    provider: supabaseUser.app_metadata?.provider || 'email',
  };
}
