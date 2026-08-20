import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, Sun, Moon, Sparkles, Package, LogOut, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Shop' },
    { to: '/customize', label: 'Custom Frame', highlight: true },
    { to: '/track-order', label: 'Track Order' },
    { to: '/categories', label: 'Categories' },
    { to: '/contact', label: 'Contact Us' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img src="/logo.png" alt="EverFrame" className="navbar-logo-img" />
            <span className="navbar-logo-text">EverFrame</span>
          </Link>

          {/* Desktop Nav */}
          <ul className="navbar-nav">
            {navLinks.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Theme Dark Mode Toggle */}
            <button
              className="navbar-icon-btn navbar-action-theme"
              aria-label="Toggle Theme"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onClick={toggleTheme}
              style={{ transition: 'transform 0.3s ease' }}
            >
              {isDark ? <Sun size={19} color="#f59e0b" /> : <Moon size={19} color="#6366f1" />}
            </button>

            {/* Search */}
            <button
              className="navbar-icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={19} />
            </button>

            {/* Wishlist */}
            <Link to="/account" className="navbar-icon-btn navbar-action-wishlist" aria-label="Wishlist" style={{ position: 'relative' }}>
              <Heart size={19} />
              {wishlist.length > 0 && (
                <span className="cart-badge" style={{ background: '#e53e3e' }}>
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="navbar-icon-btn" aria-label="Cart" style={{ position: 'relative' }}>
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </Link>

            {/* User Profile on Desktop */}
            {user ? (
              <Link to="/account" className="navbar-profile-btn navbar-action-user" aria-label="Account Profile" title={`Logged in as ${user.name}`}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="navbar-avatar-img" />
                ) : (
                  <div className="navbar-avatar-initials">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="navbar-profile-status" />
              </Link>
            ) : (
              <Link to="/login" className="navbar-icon-btn navbar-action-user" aria-label="Sign In" title="Sign In">
                <User size={19} />
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="navbar-mobile-toggle"
              aria-label="Menu"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop & Drawer */}
      <div className={`mobile-menu-backdrop ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div className="mobile-menu-header">
          <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
            <img src="/logo.png" alt="EverFrame" className="navbar-logo-img" style={{ width: '36px', height: '36px' }} />
            <span style={{ fontSize: '20px' }}>EverFrame</span>
          </Link>
          <button
            className="navbar-icon-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card inside Drawer */}
        <div className="mobile-menu-user-card">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Link to="/account" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, textDecoration: 'none' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px' }}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>
              </Link>
              <button
                onClick={async () => { await signOut(); setMobileOpen(false); navigate('/login'); }}
                title="Logout"
                style={{ padding: '8px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="mobile-menu-links">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''} ${link.highlight ? 'highlight' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {link.highlight && <Sparkles size={16} color="var(--color-pink)" />}
                <span>{link.label}</span>
              </div>
              <ChevronRight size={16} color="var(--color-text-light)" />
            </NavLink>
          ))}
        </div>

        {/* Quick Drawer Utilities */}
        <div className="mobile-menu-utilities">
          <Link to="/cart" className="mobile-util-item" onClick={() => setMobileOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={18} color="var(--color-blue)" />
              <span>Shopping Cart</span>
            </div>
            <span className="badge badge-accent">{cartCount}</span>
          </Link>

          <Link to="/track-order" className="mobile-util-item" onClick={() => setMobileOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={18} color="var(--color-indigo)" />
              <span>Track Orders</span>
            </div>
            <ChevronRight size={15} color="var(--color-text-light)" />
          </Link>

          {/* Dark / Light Mode Switcher inside Drawer */}
          <div className="mobile-util-item" style={{ cursor: 'pointer' }} onClick={toggleTheme}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              background: 'var(--brand-gradient-soft)',
              color: 'var(--color-primary-navy)'
            }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
        </div>

        {/* Footer info in Drawer */}
        <div className="mobile-menu-footer">
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            EverFrame Nepal · Handcrafted with ❤️
          </p>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <form className="search-box" onClick={e => e.stopPropagation()} onSubmit={handleSearch}>
            <Search size={20} color="var(--color-text-muted)" />
            <input
              autoFocus
              type="text"
              placeholder="Search frames, gifts, wall art..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              style={{ color: 'var(--color-text-muted)', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
