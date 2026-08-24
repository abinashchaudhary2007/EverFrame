import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Default initial credentials (stored as salted SHA-256 hash — no plaintext password in code)
const DEFAULT_EMAIL = 'admin@everframe.com';
const DEFAULT_SALT = 'ef_init_salt_8f9c12a4b3d7';
const DEFAULT_HASH = '65d12060fe2ca22d382192f3e06dfc4c13ac27f08561474649441ab64e04a840';

const STORAGE_KEY = 'everframe_admin_creds_v1';
const SESSION_KEY = 'everframe_admin_session_v1';

/**
 * Generate a random cryptographic salt
 */
export function generateSalt() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password using Web Crypto API SHA-256
 */
export async function hashPassword(password, salt) {
  if (!password || !salt) return '';
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieve current admin credentials metadata from Supabase or LocalStorage
 */
export async function getAdminCredentials() {
  // 1. Try Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('id', 'admin_auth')
        .maybeSingle();

      if (!error && data && data.password_hash && data.salt) {
        // Cache to localStorage for fast fallback
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // 2. Try localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.password_hash && parsed.salt) {
        return parsed;
      }
    }
  } catch {
    // Fall through to default
  }

  // 3. Fallback to default credentials
  return {
    id: 'admin_auth',
    email: DEFAULT_EMAIL,
    password_hash: DEFAULT_HASH,
    salt: DEFAULT_SALT,
    updated_at: null,
    is_default: true,
  };
}

/**
 * Verify admin login with email & password
 */
export async function verifyAdminLogin(email, password) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const creds = await getAdminCredentials();
  const cleanEmail = email.trim().toLowerCase();
  const targetEmail = (creds.email || DEFAULT_EMAIL).trim().toLowerCase();

  if (cleanEmail !== targetEmail) {
    return { success: false, error: 'Invalid admin credentials. Access denied.' };
  }

  const computedHash = await hashPassword(password, creds.salt);
  if (computedHash !== creds.password_hash) {
    return { success: false, error: 'Invalid admin credentials. Access denied.' };
  }

  // Login successful -> create secure session
  setAdminSession(targetEmail);
  return { success: true, email: targetEmail };
}

/**
 * Update Admin Email and/or Password
 */
export async function changeAdminCredentials({ currentPassword, newEmail, newPassword }) {
  if (!currentPassword) {
    return { success: false, error: 'Current password is required to verify your identity.' };
  }

  const currentCreds = await getAdminCredentials();
  const currentComputed = await hashPassword(currentPassword, currentCreds.salt);

  if (currentComputed !== currentCreds.password_hash) {
    return { success: false, error: 'Current password is incorrect. Credential update denied.' };
  }

  const updatedEmail = (newEmail && newEmail.trim()) ? newEmail.trim().toLowerCase() : currentCreds.email;
  let updatedSalt = currentCreds.salt;
  let updatedHash = currentCreds.password_hash;

  if (newPassword) {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }
    updatedSalt = generateSalt();
    updatedHash = await hashPassword(newPassword, updatedSalt);
  }

  const payload = {
    id: 'admin_auth',
    email: updatedEmail,
    password_hash: updatedHash,
    salt: updatedSalt,
    updated_at: new Date().toISOString(),
    is_default: false,
  };

  // 1. Save to LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  // 2. Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('admin_settings')
        .upsert([payload]);
    } catch (err) {
      console.warn('Supabase admin_settings upsert warning:', err);
    }
  }

  // Update active session
  setAdminSession(updatedEmail);

  return {
    success: true,
    email: updatedEmail,
    updated_at: payload.updated_at,
    message: 'Admin credentials updated successfully!',
  };
}

/**
 * Get current admin profile for display (safe, no password hashes)
 */
export async function getAdminProfile() {
  const creds = await getAdminCredentials();
  return {
    email: creds.email || DEFAULT_EMAIL,
    updated_at: creds.updated_at,
    is_default: Boolean(creds.is_default),
  };
}

/**
 * Secure session helpers
 */
export function setAdminSession(email) {
  const sessionData = {
    authenticated: true,
    email: email || DEFAULT_EMAIL,
    token: `ef_adm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  sessionStorage.setItem('everframe_admin_auth', 'true'); // Backward compatibility
}

export function isSessionValid() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed.authenticated && parsed.token);
    }
  } catch {
    // fallback
  }
  return sessionStorage.getItem('everframe_admin_auth') === 'true';
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('everframe_admin_auth');
}
