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

export default function Signup() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false); // email confirmation state

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(form.email, form.password, form.name);
    setLoading(false);

    if (error) {
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.');
      } else {
        toast.error(error.message || 'Signup failed. Please try again.');
      }
    } else {
      // Show "check your email" screen if Supabase email confirmation is enabled
      setDone(true);
      toast.success('Account created! 🎉 Check your email to verify.', {
        duration: 5000,
        position: 'bottom-right',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
      });
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setGoogleLoading(false);
      toast.error('Google sign-up failed. Is Supabase configured?');
    }
    // Browser redirects to Google on success
  };

  // Email sent confirmation screen
  if (done) {
    return (
      <div className="auth-page page-enter">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📬</div>
          <h2 className="auth-title">Check your inbox!</h2>
          <p className="auth-subtitle" style={{ lineHeight: '1.7' }}>
            We sent a confirmation email to <strong>{form.email}</strong>.<br />
            Click the link in the email to activate your account, then sign in.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <Link to="/login" className="btn btn-primary" style={{ flex: 1 }}>Go to Sign In</Link>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px' }}>
            Didn't receive it? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page page-enter">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="EverFrame" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '50%', margin: '0 auto 12px', display: 'block' }} />
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join EverFrame and start creating beautiful memories</p>

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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
            background: 'var(--color-surface)',
            color: 'var(--color-dark)',
            fontWeight: 600,
            fontSize: '14.5px',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            transition: 'all 0.18s ease',
            opacity: googleLoading ? 0.7 : 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          }}
          onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.15)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'; }}
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting to Google…' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>or sign up with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
        </div>

        {/* Email Sign Up Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Your full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
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
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>

          {/* Password strength indicator */}
          {form.password && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4].map(i => {
                  const strength = Math.min(4, Math.floor((form.password.length >= 6 ? 1 : 0) + (form.password.length >= 10 ? 1 : 0) + (/[A-Z]/.test(form.password) ? 1 : 0) + (/[0-9!@#$%^&*]/.test(form.password) ? 1 : 0)));
                  return (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '3px', background: i <= strength ? (strength <= 1 ? '#ef4444' : strength <= 2 ? '#f59e0b' : strength <= 3 ? '#3b82f6' : '#16a34a') : 'var(--color-border-light)', transition: 'background 0.2s' }} />
                  );
                })}
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                {form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Weak' : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 'Strong 💪' : 'Moderate'}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, marginTop: '8px' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: '20px' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
