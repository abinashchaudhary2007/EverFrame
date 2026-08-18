import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function FloatingCartBar() {
  const { cartItems, cartCount, subtotal, lastAddedItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on cart and checkout pages or when cart is empty
  if (!cartItems || cartItems.length === 0 || location.pathname === '/cart' || location.pathname === '/checkout') {
    return null;
  }

  const latestName = lastAddedItem || cartItems[cartItems.length - 1]?.name || 'Frame';

  return (
    <div
      onClick={() => navigate('/cart')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/cart'); }}
      className="floating-cart-bar"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9990,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '50px',
        background: 'linear-gradient(135deg, #172A72 0%, #216DB2 55%, #3D3A86 100%)',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(23, 42, 114, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        maxWidth: 'calc(100vw - 48px)',
        animation: 'slideUpBounce 0.4s ease-out',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 14px 36px rgba(23, 42, 114, 0.6), 0 0 0 2px rgba(147, 197, 253, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(23, 42, 114, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)';
      }}
      title="Click to view cart and order item"
    >
      {/* Icon Badge */}
      <div style={{
        position: 'relative',
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.3)',
      }}>
        <ShoppingBag size={18} color="#FFFFFF" />
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: '#F43F5E',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 800,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          border: '1.5px solid #FFFFFF',
        }}>
          {cartCount}
        </span>
      </div>

      {/* Main Text Content */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          fontWeight: 700,
          color: '#FFFFFF',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '240px',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#10B981',
            color: '#FFFFFF',
            flexShrink: 0,
          }}>
            <Check size={11} strokeWidth={3} />
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latestName} added
          </span>
        </div>
        <div style={{ fontSize: '11.5px', color: '#93C5FD', marginTop: '1px', fontWeight: 600 }}>
          {cartCount} {cartCount === 1 ? 'item' : 'items'} · NPR {subtotal.toLocaleString()}
        </div>
      </div>

      {/* Action CTA Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: '#FFFFFF',
        color: '#172A72',
        padding: '7px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 800,
        marginLeft: '4px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'background 0.2s',
      }}>
        <span>View Cart</span>
        <ArrowRight size={13} strokeWidth={2.5} />
      </div>
    </div>
  );
}
