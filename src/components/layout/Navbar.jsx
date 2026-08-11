import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
    { to: '/customize', label: 'Custom Frame' },
    { to: '/track-order', label: 'Track Order' },
    { to: '/categories', label: 'Categories' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img src="/logo.png" alt="EverFrame" className="navbar-logo-img" />
            EverFrame
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
            <button
              className="navbar-icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} />
            </button>

            <Link to="/wishlist" className="navbar-icon-btn" aria-label="Wishlist" style={{ position: 'relative' }}>
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="cart-badge" style={{ background: '#e53e3e' }}>
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className="navbar-icon-btn" aria-label="Cart" style={{ position: 'relative' }}>
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </Link>

            {user ? (
              <Link to="/account" className="navbar-profile-btn" aria-label="Account Profile" title={`Logged in as ${user.name}`}>
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
              <Link to="/login" className="navbar-icon-btn" aria-label="Sign In" title="Sign In">
                <User size={20} />
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

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
        <div className="mobile-menu-actions">
          <Link to={user ? "/account" : "/login"} className="btn btn-outline btn-sm" onClick={() => setMobileOpen(false)}>
            {user ? `Account (${user.name.split(' ')[0]})` : 'Sign In'}
          </Link>
          <Link to="/cart" className="btn btn-dark btn-sm" onClick={() => setMobileOpen(false)}>
            Cart ({cartCount})
          </Link>
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
