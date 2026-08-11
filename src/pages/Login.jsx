import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.552c0-1.636-.147-3.2-.421-4.704H24.48v8.898h12.985c-.56 2.994-2.24 5.532-4.778 7.234v6.01h7.74c4.531-4.175 7.105-10.322 7.105-17.438z" fill="#4285F4"/>
      <path d="M24.48 48c6.52 0 11.99-2.162 15.987-5.86l-7.74-6.01c-2.148 1.44-4.894 2.29-8.247 2.29-6.342 0-11.716-4.282-13.634-10.033H3.09v6.2C7.07 42.95 15.19 48 24.48 48z" fill="#34A853"/>
      <path d="M10.846 28.387A14.39 14.39 0 0 1 9.9 24c0-1.524.262-3.003.946-4.387v-6.2H3.09A23.998 23.998 0 0 0 .48 24c0 3.87.93 7.532 2.61 10.587l7.756-6.2z" fill="#FBBC05"/>
      <path d="M24.48 9.54c3.569 0 6.77 1.228 9.293 3.64l6.963-6.962C36.465 2.363 30.996 0 24.48 0 15.19 0 7.07 5.05 3.09 13.413l7.756 6.2C12.764 13.822 18.138 9.54 24.48 9.54z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, resendVerificationEmail } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(form.email, form.password);
    setLoading(false);

    if (error) {
      if (error.message?.includes('Invalid login')) {
        toast.error('Wrong email or password. Please try again.');
        setShowVerificationBanner(false);
      } else if (error.message?.includes('Email not confirmed')) {
        setShowVerificationBanner(true);
        toast.error('Please verify your email first. Check your inbox!');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
        setShowVerificationBanner(false);
      }
    } else {
      toast.success('Welcome back! 👋', {
        position: 'bottom-right',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
      });
      navigate('/account');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error('Google sign-in failed. Is Supabase configured?');
    }
    // If no error, browser redirects to Google — don't setLoading(false)
  };

  return (
    <div className="auth-page page-enter">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="EverFrame" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '50%', margin: '0 auto 12px', display: 'block' }} />
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {/* Email Verification Banner */}
        {showVerificationBanner && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: '10px',
            padding: '14px 16px', marginBottom: '20px', fontSize: '13.5px', lineHeight: '1.6',
            color: '#9A3412'
          }}>
            <strong>📧 Email not verified.</strong> Please check your inbox (and spam folder) for a confirmation link.
            <button
              type="button"
              disabled={resending}
              onClick={async () => {
                if (!form.email) {
                  toast.error('Enter your email address above first.');
                  return;
                }
                setResending(true);
                const { error } = await resendVerificationEmail(form.email);
                setResending(false);
                if (error) {
                  toast.error(error.message || 'Failed to resend. Try again later.');
                } else {
                  toast.success('Verification email sent! Check your inbox. ✉️', {
                    position: 'bottom-right',
                    style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
                  });
                }
              }}
              style={{
                display: 'block', marginTop: '10px', background: 'none', border: 'none',
                color: '#2563EB', fontWeight: 600, cursor: resending ? 'not-allowed' : 'pointer',
                padding: 0, fontSize: '13.5px', textDecoration: 'underline',
                opacity: resending ? 0.6 : 1,
              }}
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1.5px solid var(--color-border)',
            background: '#fff',
            color: 'var(--color-dark)',
            fontWeight: 600,
            fontSize: '14.5px',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            transition: 'all 0.18s ease',
            opacity: googleLoading ? 0.7 : 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          }}
          onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'; }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Password
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ fontWeight: 400, color: 'var(--color-blue)', fontSize: '12.5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, marginTop: '8px' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: '20px' }}>
          Don't have an account? <Link to="/signup">Create one free</Link>
        </div>
      </div>
    </div>
  );
}
