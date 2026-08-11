import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// This page handles the redirect from Google OAuth
// Supabase automatically sets the session when landing here
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      if (supabase) {
        // Supabase picks up the token from the URL hash automatically
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          navigate('/account', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };
    handle();
  }, [navigate]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        width: '48px', height: '48px', border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-blue)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>Signing you in with Google…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
