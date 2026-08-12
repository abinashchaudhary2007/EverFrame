import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CopyButton from '../components/ui/CopyButton';
import { createOrder, validateCoupon, incrementCouponUsage } from '../services/api';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { id: 'esewa', label: 'eSewa', icon: '💚' },
  { id: 'khalti', label: 'Khalti', icon: '💜' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
];

const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

export default function Checkout() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', province: '', city: '', address: '',
  });
  const [errors, setErrors] = useState({});

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount, discount_type, discount_value }
  const [couponError, setCouponError] = useState('');

  // Pre-fill form with logged-in user details
  useEffect(() => {
    if (authUser) {
      setForm(f => ({ ...f, name: authUser.name || '', email: authUser.email || '' }));
    } else {
      try {
        const saved = localStorage.getItem('everframe_user');
        if (saved) {
          const u = JSON.parse(saved);
          setForm(f => ({ ...f, name: u.name || '', email: u.email || '' }));
        }
      } catch (e) { /* ignore */ }
    }
  }, [authUser]);

  const DELIVERY_CHARGE = subtotal >= 2000 ? 0 : 150;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal + DELIVERY_CHARGE - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) { setCouponError('Please enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    const result = await validateCoupon(couponInput, subtotal);
    setCouponLoading(false);
    if (result.valid) {
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discount: result.discount, discount_type: result.coupon.discount_type, discount_value: result.coupon.discount_value });
      setCouponError('');
      toast.success(`Coupon applied! You save NPR ${result.discount.toLocaleString()} 🎉`, {
        position: 'bottom-right',
        style: { background: '#16a34a', color: '#fff', borderRadius: '8px' },
      });
    } else {
      setAppliedCoupon(null);
      setCouponError(result.error);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim() || !/^9\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit number starting with 9';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.province) errs.province = 'Province is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }));
  };

  const [placedOrderNum, setPlacedOrderNum] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (paymentMethod !== 'cod') {
      toast('⚠️ Online payment integration coming soon! Please use Cash on Delivery.', {
        duration: 4000,
        position: 'top-center',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
      });
      return;
    }

    setLoading(true);
    const res = await createOrder({
      name: form.name,
      email: form.email,
      phone: form.phone,
      province: form.province,
      city: form.city,
      address: form.address,
      paymentMethod,
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discountAmount,
      couponCode: appliedCoupon?.code || null,
      total,
      items: cartItems,
    });

    // Increment coupon usage after successful order
    if (appliedCoupon?.code) {
      await incrementCouponUsage(appliedCoupon.code);
    }

    setLoading(false);
    setPlacedOrderNum(res.orderNumber);
    setPlaced(true);
    clearCart();
  };

  if (cartItems.length === 0 && !placed) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <h3>Your cart is empty</h3>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '16px' }}>Shop Now</Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '520px' }}>
          <CheckCircle size={56} color="var(--color-accent)" style={{ margin: '0 auto 16px' }} />
          <h2 className="auth-title">Order Placed Successfully! 🎉</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px', marginTop: '12px', lineHeight: '1.7' }}>
            Thank you for your order! You'll receive a confirmation shortly. Your EverFrame is being lovingly crafted and will be delivered to your doorstep.
          </p>
          <div style={{ margin: '24px 0', background: 'var(--color-surface)', borderRadius: '10px', padding: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Your Order ID</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '20px', fontFamily: 'var(--font-serif)', color: 'var(--color-dark)' }}>
                #{placedOrderNum}
              </span>
              <CopyButton text={placedOrderNum} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>Back to Home</Link>
            <Link to="/track-order" className="btn btn-primary" style={{ flex: 1 }}>Track Order</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page page-enter">
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="checkout-grid">
            {/* Left: Form */}
            <div>
              {/* Shipping */}
              <div className="checkout-section">
                <h2 className="checkout-section-title">Shipping Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input name="name" className="form-input" placeholder="Your full name" value={form.name} onChange={handleChange} />
                    {errors.name && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input name="phone" className="form-input" placeholder="98XXXXXXXX" value={form.phone} onChange={handleChange} />
                    {errors.phone && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.phone}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} />
                  {errors.email && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.email}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Province *</label>
                    <select name="province" className="form-input" value={form.province} onChange={handleChange} style={{ cursor: 'pointer' }}>
                      <option value="">Select Province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.province}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input name="city" className="form-input" placeholder="Kathmandu" value={form.city} onChange={handleChange} />
                    {errors.city && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.city}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Address *</label>
                  <textarea name="address" className="form-input" rows={2} placeholder="Street, Tole, Landmark" value={form.address} onChange={handleChange} style={{ resize: 'vertical' }} />
                  {errors.address && <span style={{ color: '#e53e3e', fontSize: '12px' }}>{errors.address}</span>}
                </div>
              </div>

              {/* Payment */}
              <div className="checkout-section">
                <h2 className="checkout-section-title">Payment Method</h2>
                <div className="payment-options">
                  {PAYMENT_METHODS.map(pm => (
                    <label key={pm.id} className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`} onClick={() => setPaymentMethod(pm.id)}>
                      <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} />
                      <span style={{ fontSize: '20px' }}>{pm.icon}</span>
                      <span className="payment-label">{pm.label}</span>
                      {pm.id !== 'cod' && (
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--color-border-light)', padding: '2px 8px', borderRadius: '20px' }}>
                          Coming Soon
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
                  🔒 Your payment information is secured with SSL encryption.
                </p>
              </div>
            </div>

            {/* Right: Summary */}
            <div>
              <div className="cart-summary">
                <div className="cart-summary-title">Order Summary</div>
                {cartItems.map(item => (
                  <div key={item.cartId} className="summary-row" style={{ alignItems: 'flex-start' }}>
                    <span style={{ flex: 1, color: 'var(--color-dark)', fontWeight: 500, fontSize: '13px' }}>
                      {item.name} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>×{item.quantity}</span>
                    </span>
                    <span style={{ color: 'var(--color-dark)', fontWeight: 600 }}>NPR {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="summary-row" style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)' }}>
                  <span>Subtotal</span>
                  <span>NPR {subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery</span>
                  <span style={{ color: DELIVERY_CHARGE === 0 ? '#16a34a' : undefined }}>
                    {DELIVERY_CHARGE === 0 ? 'FREE' : `NPR ${DELIVERY_CHARGE}`}
                  </span>
                </div>

                {/* Coupon Input */}
                <div style={{ margin: '12px 0', padding: '12px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px dashed var(--color-border)' }}>
                  {!appliedCoupon ? (
                    <>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Tag size={13} /> Have a coupon?
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Enter code (e.g. SAVE10)"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                          style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '12.5px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', outline: 'none', background: '#fff' }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '8px 14px', fontSize: '12px', flexShrink: 0 }}
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#E11D48', fontWeight: 500 }}>{couponError}</div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <Tag size={13} color="#16a34a" />
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{appliedCoupon.code}</span>
                          <span style={{ fontSize: '11px', background: '#dcfce7', color: '#16a34a', padding: '1px 7px', borderRadius: '20px', fontWeight: 700 }}>Applied</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                          {appliedCoupon.discount_type === 'percentage'
                            ? `${appliedCoupon.discount_value}% off`
                            : `NPR ${appliedCoupon.discount_value} off`
                          }
                        </div>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} style={{ color: '#E11D48', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Remove coupon">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row" style={{ color: '#16a34a', fontWeight: 700 }}>
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>− NPR {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-row total">
                  <span>Total</span>
                  <span>NPR {total.toLocaleString()}</span>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1, marginTop: '4px' }}
                >
                  {loading ? 'Placing Order...' : `Place Order — NPR ${total.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
