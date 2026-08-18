import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();

  const DELIVERY_THRESHOLD = 2000;
  const DELIVERY_CHARGE = subtotal >= DELIVERY_THRESHOLD ? 0 : 100;
  const total = subtotal + DELIVERY_CHARGE;

  if (cartItems.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon"><ShoppingBag size={64} strokeWidth={1} /></div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet. Start exploring our frames!</p>
        <Link to="/shop" className="btn btn-primary btn-lg">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="cart-page page-enter">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700 }}>
            Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </h1>
          <button
            className="btn btn-outline btn-sm"
            onClick={clearCart}
            style={{ color: '#e53e3e', borderColor: '#e53e3e' }}
          >
            Clear Cart
          </button>
        </div>

        <div className="cart-grid">
          {/* Items */}
          <div>
            {/* Free delivery progress */}
            {subtotal < DELIVERY_THRESHOLD && (
              <div style={{ background: 'var(--brand-gradient-soft)', border: '1px solid var(--color-border-light)', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '13.5px', color: 'var(--color-dark)' }}>
                🚚 Add <strong>NPR {(DELIVERY_THRESHOLD - subtotal).toLocaleString()}</strong> more to get <strong>free delivery!</strong>
                <div style={{ marginTop: '8px', background: 'var(--color-border)', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${(subtotal / DELIVERY_THRESHOLD) * 100}%`, height: '100%', background: 'var(--brand-gradient)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
            {subtotal >= DELIVERY_THRESHOLD && (
              <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13.5px', color: '#16a34a' }}>
                🎉 <strong>Free delivery unlocked!</strong>
              </div>
            )}

            {cartItems.map(item => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.images?.[0]} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <p className="cart-item-name">{item.name}</p>
                  {item.options && Object.keys(item.options).filter(k => k !== 'photo').length > 0 && (
                    <p className="cart-item-option">
                      {Object.entries(item.options)
                        .filter(([k]) => k !== 'photo')
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                  <div className="cart-item-footer">
                    <div className="qty-selector" style={{ transform: 'scale(0.9)', transformOrigin: 'left' }}>
                      <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>
                        <Minus size={13} />
                      </button>
                      <div className="qty-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>{item.quantity}</div>
                      <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="cart-item-price">NPR {(item.price * item.quantity).toLocaleString()}</span>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item.cartId)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="cart-summary">
              <div className="cart-summary-title">Order Summary</div>

              <div className="summary-row">
                <span>Subtotal ({cartItems.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                <span>NPR {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span style={{ color: DELIVERY_CHARGE === 0 ? '#16a34a' : undefined }}>
                  {DELIVERY_CHARGE === 0 ? 'FREE' : `NPR ${DELIVERY_CHARGE}`}
                </span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>NPR {total.toLocaleString()}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary btn-full btn-lg" style={{ marginBottom: '12px' }}>
                Proceed to Checkout
              </Link>
              <Link to="/shop" className="btn btn-outline btn-full">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
