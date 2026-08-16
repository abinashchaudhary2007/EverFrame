import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Tag, X, MapPin, ShieldCheck, Package, Truck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CopyButton from '../components/ui/CopyButton';
import { createOrder, validateCoupon, incrementCouponUsage } from '../services/api';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your frame arrives', recommended: true },
  { id: 'esewa', label: 'eSewa', icon: '💚', desc: 'Coming soon', disabled: true },
  { id: 'khalti', label: 'Khalti', icon: '💜', desc: 'Coming soon', disabled: true },
];

const VALLEY_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'Budhanilkantha', 'Tokha', 'Gokarneshwor', 'Kageshwori', 'Chandragiri', 'Nagarjun'];

export default function Checkout() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placedOrderNum, setPlacedOrderNum] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', email: '', city: 'Kathmandu', address: '',
  });
  const [errors, setErrors] = useState({});
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);

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
      } catch {}
    }
  }, [authUser]);

  const DELIVERY_CHARGE = 100;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = Math.max(0, subtotal + DELIVERY_CHARGE - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) { setCouponError('Enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    const result = await validateCoupon(couponInput, subtotal);
    setCouponLoading(false);
    if (result.valid) {
      setAppliedCoupon({
        code: couponInput.trim().toUpperCase(),
        discount: result.discount,
        discount_type: result.coupon.discount_type,
        discount_value: result.coupon.discount_value,
      });
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
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.phone.trim() || !/^9\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit number starting with 9';
    if (!form.city.trim()) errs.city = 'Required';
    if (!form.address.trim()) errs.address = 'Required';
    // Warn if city seems outside valley (soft check only)
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(ev => ({ ...ev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fill all required fields', { position: 'top-center' });
      return;
    }
    if (paymentMethod !== 'cod') {
      toast('⚠️ Online payment coming soon! Please use Cash on Delivery.', {
        duration: 4000,
        position: 'top-center',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
      });
      return;
    }
    setLoading(true);
    const res = await createOrder({
      name: form.name,
      email: form.email || `${form.phone}@everframe.np`,
      phone: form.phone,
      province: 'Bagmati',
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
    if (appliedCoupon?.code) {
      await incrementCouponUsage(appliedCoupon.code);
    }
    setLoading(false);
    setPlacedOrderNum(res.orderNumber);
    // Snapshot full order for the bill before clearing cart
    setPlacedOrderDetails({
      orderNumber: res.orderNumber,
      name: form.name,
      phone: form.phone,
      email: form.email,
      city: form.city,
      address: form.address,
      paymentMethod,
      items: cartItems.map(i => ({ ...i })),
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      discountAmount,
      couponCode: appliedCoupon?.code || null,
      total,
      placedAt: new Date(),
    });
    setPlaced(true);
    clearCart();
  };

  // ── Empty cart ──
  if (cartItems.length === 0 && !placed) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some frames before checking out.</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '16px' }}>Shop Now</Link>
      </div>
    );
  }

  // ── Order success with printable bill ──
  if (placed && placedOrderDetails) {
    const od = placedOrderDetails;
    const handlePrint = () => {
      const printContent = document.getElementById('everframe-bill');
      const win = window.open('', '_blank', 'width=700,height=900');
      win.document.write(`
        <html><head><title>EverFrame Invoice #${od.orderNumber}</title><style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; background: #fff; }
          .logo { font-size:22px; font-weight:900; color:#172A72; letter-spacing:-0.5px; margin-bottom:4px; }
          .tagline { font-size:11px; color:#6b7280; margin-bottom:24px; }
          .header-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
          .invoice-title { font-size:28px; font-weight:900; color:#172A72; }
          .invoice-meta { font-size:12px; color:#6b7280; text-align:right; line-height:1.8; }
          .divider { border:none; border-top:2px solid #e5e7eb; margin:20px 0; }
          .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; margin-bottom:10px; }
          .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:28px; }
          .info-label { font-size:11px; color:#9ca3af; margin-bottom:2px; }
          .info-value { font-size:13.5px; font-weight:600; color:#111; }
          table { width:100%; border-collapse:collapse; margin-bottom:20px; }
          th { font-size:11px; text-transform:uppercase; color:#9ca3af; font-weight:700; text-align:left; padding:8px 0; border-bottom:1.5px solid #e5e7eb; }
          td { font-size:13px; padding:12px 0; border-bottom:1px solid #f3f4f6; vertical-align:top; }
          .total-row { display:flex; justify-content:space-between; font-size:13px; padding:6px 0; }
          .grand-total { display:flex; justify-content:space-between; font-size:17px; font-weight:800; color:#172A72; padding-top:12px; border-top:2px solid #172A72; margin-top:6px; }
          .footer { margin-top:32px; text-align:center; font-size:11.5px; color:#9ca3af; line-height:1.8; }
          .badge { display:inline-block; background:#dcfce7; color:#16a34a; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
        </style></head><body>
          <div class="header-row">
            <div><div class="logo">EverFrame</div><div class="tagline">Premium Custom Photo Frames · Nepal</div></div>
            <div><div class="invoice-title">INVOICE</div><div class="invoice-meta">
              Order #${od.orderNumber}<br/>
              ${od.placedAt.toLocaleDateString('en-NP', {day:'numeric',month:'long',year:'numeric'})}<br/>
              ${od.placedAt.toLocaleTimeString('en-NP', {hour:'2-digit',minute:'2-digit'})}
            </div></div>
          </div>
          <hr class="divider"/>
          <div class="info-grid">
            <div>
              <div class="section-title">Bill To</div>
              <div class="info-value">${od.name}</div>
              <div style="font-size:13px;color:#4b5563;margin-top:4px;line-height:1.7">${od.phone}${od.email ? '<br/>'+od.email : ''}<br/>${od.address}<br/>${od.city}, Nepal</div>
            </div>
            <div>
              <div class="section-title">Payment</div>
              <div class="badge">${od.paymentMethod === 'cod' ? 'Cash on Delivery' : od.paymentMethod}</div>
            </div>
          </div>
          <hr class="divider"/>
          <table>
            <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${od.items.map(item => `
              <tr>
                <td><div style="font-weight:600">${item.name}</div>${item.variant?.size || item.variant?.color ? '<div style="font-size:11.5px;color:#9ca3af;margin-top:2px">' + [item.variant?.size, item.variant?.color].filter(Boolean).join(' · ') + '</div>' : ''}</td>
                <td style="text-align:center">${item.quantity}</td>
                <td style="text-align:right">NPR ${item.price.toLocaleString()}</td>
                <td style="text-align:right">NPR ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>
          <div style="max-width:260px;margin-left:auto">
            <div class="total-row"><span style="color:#6b7280">Subtotal</span><span>NPR ${od.subtotal.toLocaleString()}</span></div>
            <div class="total-row"><span style="color:#6b7280">Delivery Charge</span><span>NPR ${od.deliveryCharge}</span></div>
            ${od.discountAmount > 0 ? `<div class="total-row"><span style="color:#16a34a">Coupon (${od.couponCode})</span><span style="color:#16a34a">− NPR ${od.discountAmount.toLocaleString()}</span></div>` : ''}
            <div class="grand-total"><span>TOTAL</span><span>NPR ${od.total.toLocaleString()}</span></div>
          </div>
          <div class="footer">
            Thank you for shopping with EverFrame!<br/>
            For support: everframe.np@gmail.com · Track your order at everframe.com/track-order<br/>
            <strong style="color:#172A72">Your frames are lovingly crafted in Nepal 🇳🇵</strong>
          </div>
        </body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    };

    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '40px 20px' }}>
        <div style={{ maxWidth: '620px', margin: '0 auto' }}>

          {/* Success header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={36} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 800, color: 'var(--color-primary-navy)' }}>Order Confirmed! 🎉</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '8px' }}>
              Thank you, <strong>{od.name}</strong>! Your EverFrame is being crafted for delivery to <strong>{od.city}</strong>.
            </p>
          </div>

          {/* Bill / Invoice Card */}
          <div id="everframe-bill" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--color-border-light)', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

            {/* Bill header */}
            <div style={{ background: 'var(--brand-gradient)', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>EverFrame</div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>Premium Custom Photo Frames · Nepal</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Invoice</div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', marginTop: '2px' }}>#{od.orderNumber}</div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                  {od.placedAt.toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })} · {od.placedAt.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>

              {/* Customer info + Payment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid var(--color-border-light)' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Bill To</div>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-dark)' }}>{od.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.7 }}>
                    {od.phone}<br />
                    {od.email && <>{od.email}<br /></>}
                    {od.address}<br />
                    {od.city}, Nepal
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Payment</div>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '20px' }}>
                    {od.paymentMethod === 'cod' ? '💵 Cash on Delivery' : od.paymentMethod}
                  </span>
                  <div style={{ marginTop: '10px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Status</div>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#fef9c3', color: '#854d0e', padding: '4px 12px', borderRadius: '20px' }}>⏳ Processing</span>
                </div>
              </div>

              {/* Items table */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', paddingBottom: '8px', borderBottom: '1.5px solid var(--color-border-light)', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>Item</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', textAlign: 'right' }}>Qty</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', textAlign: 'right' }}>Amount</span>
                </div>
                {od.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f9fafb', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--color-dark)' }}>{item.name}</div>
                      {(item.variant?.size || item.variant?.color) && (
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {[item.variant?.size, item.variant?.color].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>NPR {item.price.toLocaleString()} each</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark)', textAlign: 'right' }}>×{item.quantity}</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-dark)', textAlign: 'right' }}>NPR {(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>NPR {od.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  <span>Delivery Charge</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>NPR {od.deliveryCharge}</span>
                </div>
                {od.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', fontWeight: 700 }}>
                    <span>Coupon ({od.couponCode})</span>
                    <span>− NPR {od.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 800, color: 'var(--color-primary-navy)', paddingTop: '10px', borderTop: '1.5px solid var(--color-border)' }}>
                  <span>Total</span>
                  <span>NPR {od.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer note */}
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                Your frames are lovingly crafted in Nepal 🇳🇵<br/>
                For support, contact us via the website.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>← Back to Home</Link>
            <Link to="/track-order" className="btn btn-outline" style={{ flex: 1 }}>📦 Track Order</Link>
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              🖨️ Print Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fieldStyle = (field) => ({
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid ${errors[field] ? '#e53e3e' : 'var(--color-border)'}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    background: '#fff',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  });

  return (
    <div className="checkout-page page-enter">
      <div className="container" style={{ maxWidth: '980px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div className="section-label" style={{ marginBottom: '6px' }}>Almost there!</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, color: 'var(--color-primary-navy)' }}>
            Complete Your Order
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Only 4 required fields — takes under 30 seconds!
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Delivery Card */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '26px', border: '1px solid var(--color-border-light)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={15} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--color-dark)' }}>Delivery Details</h2>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px' }}>Fields marked * are required</p>
                  </div>
                </div>

                {/* Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '5px' }}>Full Name *</label>
                    <input name="name" style={fieldStyle('name')} placeholder="Aarav Sharma" value={form.name} onChange={handleChange} autoComplete="name" />
                    {errors.name && <span style={{ color: '#e53e3e', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{errors.name}</span>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '5px' }}>Phone Number *</label>
                    <input name="phone" type="tel" style={fieldStyle('phone')} placeholder="98XXXXXXXX" value={form.phone} onChange={handleChange} maxLength={10} autoComplete="tel" />
                    {errors.phone && <span style={{ color: '#e53e3e', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{errors.phone}</span>}
                  </div>
                </div>

                {/* City */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '5px' }}>City / Area *</label>
                  <input
                    name="city"
                    list="valley-cities"
                    style={fieldStyle('city')}
                    placeholder="e.g. Kathmandu, Lalitpur, Bhaktapur"
                    value={form.city}
                    onChange={handleChange}
                    autoComplete="address-level2"
                  />
                  <datalist id="valley-cities">
                    {VALLEY_CITIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.city && <span style={{ color: '#e53e3e', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{errors.city}</span>}
                </div>

                {/* Address */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '5px' }}>Street / Tole / Landmark *</label>
                  <input name="address" style={fieldStyle('address')} placeholder="e.g. Naxal, near Bhrikuti Mandap" value={form.address} onChange={handleChange} autoComplete="street-address" />
                  {errors.address && <span style={{ color: '#e53e3e', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{errors.address}</span>}
                </div>

                {/* Email (optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '5px' }}>
                    Email <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input name="email" type="email" style={{ ...fieldStyle('email'), borderStyle: 'dashed' }} placeholder="For order confirmation email" value={form.email} onChange={handleChange} autoComplete="email" />
                </div>

                {/* Delivery zone notice */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px' }}>
                  <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>📍 Kathmandu Valley Delivery Only</div>
                    <div style={{ fontSize: '12px', color: '#b45309', lineHeight: 1.5 }}>
                      We currently deliver within <strong>Kathmandu, Lalitpur, and Bhaktapur</strong> districts only. Nationwide delivery coming soon!
                    </div>
                  </div>
                </div>

                {/* Delivery charge banner */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px' }}>
                  <Truck size={15} color="#16a34a" />
                  <span style={{ fontSize: '12.5px', color: '#15803d', fontWeight: 600 }}>
                    {DELIVERY_CHARGE === 0
                      ? '🎉 Free delivery on this order!'
                      : `Delivery charge: NPR ${DELIVERY_CHARGE} · Free on orders above NPR 2,000`}
                  </span>
                </div>
              </div>

              {/* Payment Card */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '26px', border: '1px solid var(--color-border-light)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={15} color="#fff" />
                  </div>
                  <h2 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--color-dark)' }}>Payment Method</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {PAYMENT_METHODS.map(pm => (
                    <label
                      key={pm.id}
                      onClick={() => !pm.disabled && setPaymentMethod(pm.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: `1.5px solid ${paymentMethod === pm.id ? 'var(--color-blue)' : 'var(--color-border)'}`,
                        background: paymentMethod === pm.id ? '#f0f4ff' : pm.disabled ? '#fafafa' : '#fff',
                        cursor: pm.disabled ? 'not-allowed' : 'pointer',
                        opacity: pm.disabled ? 0.55 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id} onChange={() => !pm.disabled && setPaymentMethod(pm.id)} disabled={pm.disabled} style={{ accentColor: 'var(--color-blue)', width: '16px', height: '16px' }} />
                      <span style={{ fontSize: '20px' }}>{pm.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--color-dark)' }}>{pm.label}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>{pm.desc}</div>
                      </div>
                      {pm.recommended && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', flexShrink: 0 }}>Recommended</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Summary */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid var(--color-border-light)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                {/* Summary header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border-light)' }}>
                  <Package size={17} color="var(--color-primary-navy)" />
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 800, color: 'var(--color-dark)' }}>
                    Your Order ({cartItems.reduce((a, c) => a + c.quantity, 0)} item{cartItems.reduce((a, c) => a + c.quantity, 0) !== 1 ? 's' : ''})
                  </h2>
                </div>

                {/* Items with thumbnails */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {cartItems.map(item => (
                    <div key={item.cartId} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={item.images?.[0] || item.image}
                        alt={item.name}
                        style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border-light)', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        {item.variant && (item.variant.size || item.variant.color) && (
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>×{item.quantity}</div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-dark)', flexShrink: 0 }}>
                        NPR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border-light)' }}>
                  {!appliedCoupon ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowCoupon(s => !s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12.5px', color: 'var(--color-blue)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', padding: '0', marginBottom: showCoupon ? '8px' : '0' }}
                      >
                        <Tag size={13} /> {showCoupon ? 'Hide coupon field' : '🏷️ Have a coupon?'}
                      </button>
                      {showCoupon && (
                        <>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              placeholder="SAVE10"
                              value={couponInput}
                              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                              style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '12.5px', flexShrink: 0 }} onClick={handleApplyCoupon} disabled={couponLoading}>
                              {couponLoading ? '...' : 'Apply'}
                            </button>
                          </div>
                          {couponError && <div style={{ marginTop: '5px', fontSize: '11.5px', color: '#E11D48' }}>{couponError}</div>}
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={13} color="#16a34a" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>{appliedCoupon.code}</span>
                        <span style={{ fontSize: '11.5px', color: '#15803d' }}>− NPR {appliedCoupon.discount.toLocaleString()}</span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>NPR {subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Delivery</span>
                    <span style={{ fontWeight: 600, color: DELIVERY_CHARGE === 0 ? '#16a34a' : 'var(--color-dark)' }}>
                      {DELIVERY_CHARGE === 0 ? 'FREE 🎉' : `NPR ${DELIVERY_CHARGE}`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', fontWeight: 700 }}>
                      <span>Coupon</span>
                      <span>− NPR {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-navy)', borderTop: '1.5px solid var(--color-border-light)', paddingTop: '10px', marginTop: '4px' }}>
                    <span>Total</span>
                    <span>NPR {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: loading ? '#c7d2fe' : 'var(--brand-gradient)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15.5px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(23,42,114,0.3)',
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      Placing Order...
                    </>
                  ) : (
                    <>📦 Place Order — NPR {total.toLocaleString()}</>
                  )}
                </button>

                <p style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '10px' }}>
                  🔒 Secure · Cash on Delivery · Free returns
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
