import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Tag, X, MapPin, ShieldCheck, Package, Truck, AlertCircle, Sparkles, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, validateCoupon, incrementCouponUsage } from '../services/api';
import { downloadInvoicePDF } from '../utils/invoiceDownload';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your frame arrives', recommended: true },
  { id: 'esewa', label: 'eSewa', icon: '💚', desc: 'Coming soon', disabled: true },
  { id: 'khalti', label: 'Khalti', icon: '💜', desc: 'Coming soon', disabled: true },
];

const VALLEY_CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'Budhanilkantha', 'Tokha', 'Gokarneshwor', 'Kageshwori', 'Chandragiri', 'Nagarjun'];

// Trigger multi-stage celebratory confetti explosion
function triggerCelebration() {
  const count = 200;
  const defaults = {
    origin: { y: 0.65 },
    zIndex: 99999,
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Initial rich center burst
  fire(0.25, {
    spread: 30,
    startVelocity: 55,
    colors: ['#216DB2', '#3D3A86', '#F472B6', '#FCD34D', '#10B981'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#60A5FA', '#C084FC', '#F472B6', '#FDE047'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#3B82F6', '#6366F1', '#EC4899', '#34D399'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#216DB2', '#3D3A86', '#F472B6'],
  });

  // Left & Right celebratory side cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      zIndex: 99999,
      colors: ['#216DB2', '#F472B6', '#FCD34D', '#4ADE80'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      zIndex: 99999,
      colors: ['#3D3A86', '#60A5FA', '#F472B6', '#FCD34D'],
    });
  }, 350);

  setTimeout(() => {
    confetti({
      particleCount: 65,
      spread: 100,
      origin: { y: 0.55 },
      zIndex: 99999,
      colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
    });
  }, 750);
}

export default function Checkout() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  // Trigger celebration animation on successful order placement
  useEffect(() => {
    if (placed) {
      triggerCelebration();
    }
  }, [placed]);

  const DELIVERY_THRESHOLD = 2000;
  const DELIVERY_CHARGE = subtotal >= DELIVERY_THRESHOLD ? 0 : 100;
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
        discount_type: result.coupon?.discount_type,
        discount_value: result.coupon?.discount_value,
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
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(ev => ({ ...ev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop');
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim() || null,
        city: form.city.trim(),
        address: form.address.trim(),
        payment_method: paymentMethod,
        subtotal,
        delivery_charge: DELIVERY_CHARGE,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        total,
        items: cartItems.map(item => ({
          product_id: item.id || null,
          product_name: item.name,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
          photo_url: item.options?.photo || null,
        })),
      };

      const res = await createOrder(orderPayload);
      if (res?.data || res?.order || res?.orderNumber || res?.success) {
        const orderNum = res.orderNumber || res.data?.order_number || res.order?.order_number || res.data?.id || `EF${Date.now().toString().slice(-6)}`;
        setPlacedOrderNum(orderNum);
        setPlacedOrderDetails({
          orderNumber: orderNum,
          name: form.name,
          phone: form.phone,
          email: form.email,
          city: form.city,
          address: form.address,
          paymentMethod,
          subtotal,
          deliveryCharge: DELIVERY_CHARGE,
          discountAmount,
          couponCode: appliedCoupon?.code,
          total,
          items: cartItems,
          placedAt: new Date(),
        });
        if (appliedCoupon) {
          try { await incrementCouponUsage(appliedCoupon.code); } catch {}
        }
        clearCart();
        setPlaced(true);
        toast.success('Order placed successfully! 🎉', {
          position: 'bottom-right',
          style: { background: '#172A72', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
        });
      } else {
        throw new Error(res?.error || 'Failed to place order');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS / BILL VIEW
  if (placed && placedOrderDetails) {
    const od = placedOrderDetails;

    const handlePrint = () => {
      const win = window.open('', '_blank');
      const origin = window.location.origin;
      win.document.write(`
        <!DOCTYPE html>
        <html><head><title>EverFrame Invoice #${od.orderNumber}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; padding: 24px; max-width: 680px; margin: 0 auto; color: #0f172a; background: #ffffff; }
          .header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom: 16px; border-bottom: 2px solid #172A72; }
          .brand-box { display:flex; align-items:center; gap:12px; }
          .logo-img { width:48px; height:48px; object-fit:contain; border-radius:50%; }
          .logo-text { font-size:24px; font-weight:900; color:#172A72; letter-spacing:-0.5px; }
          .tagline { font-size:11px; color:#64748b; margin-top:2px; }
          .invoice-title { font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#172A72; text-align:right; }
          .invoice-num { font-size:20px; font-weight:900; color:#0f172a; margin-top:2px; }
          .invoice-meta { font-size:11.5px; color:#64748b; margin-top:3px; text-align:right; line-height:1.5; }
          .section-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#172A72; margin-bottom:6px; }
          .info-grid { display:grid; grid-template-columns:1.2fr 0.8fr; gap:20px; margin-bottom:24px; background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #e2e8f0; }
          .info-label { font-size:10.5px; color:#64748b; margin-bottom:2px; text-transform:uppercase; font-weight:700; }
          .info-value { font-size:14px; font-weight:700; color:#0f172a; }
          table { width:100%; border-collapse:collapse; margin-bottom:20px; }
          th { font-size:11px; text-transform:uppercase; color:#64748b; font-weight:800; text-align:left; padding:10px 8px; border-bottom:2px solid #cbd5e1; background:#f1f5f9; }
          td { font-size:13px; padding:12px 8px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
          .total-box { max-width:280px; margin-left:auto; background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #e2e8f0; }
          .total-row { display:flex; justify-content:space-between; font-size:13px; padding:5px 0; color:#475569; }
          .grand-total { display:flex; justify-content:space-between; font-size:17px; font-weight:900; color:#172A72; padding-top:10px; border-top:2px solid #172A72; margin-top:6px; }
          .footer { margin-top:30px; text-align:center; font-size:11px; color:#94a3b8; line-height:1.7; border-top:1px solid #e2e8f0; padding-top:16px; }
          .badge { display:inline-block; background:#dcfce7; color:#15803d; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; border:1px solid #bbf7d0; }
        </style></head><body>
          <div class="header-row">
            <div class="brand-box">
              <img class="logo-img" src="${origin}/logo.png" alt="EverFrame" onerror="this.style.display='none'" />
              <div>
                <div class="logo-text">EverFrame</div>
                <div class="tagline">Premium Custom Photo Frames · Kathmandu, Nepal</div>
              </div>
            </div>
            <div>
              <div class="invoice-title">OFFICIAL INVOICE</div>
              <div class="invoice-num">#${od.orderNumber}</div>
              <div class="invoice-meta">
                Date: ${od.placedAt.toLocaleDateString('en-NP', {day:'numeric',month:'long',year:'numeric'})}<br/>
                Time: ${od.placedAt.toLocaleTimeString('en-NP', {hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          </div>
          
          <div class="info-grid">
            <div>
              <div class="section-title">Bill To & Delivery Address</div>
              <div class="info-value">${od.name}</div>
              <div style="font-size:12.5px;color:#334155;margin-top:4px;line-height:1.6">
                📞 ${od.phone}${od.email ? '<br/>✉️ '+od.email : ''}<br/>
                📍 ${od.address}<br/>
                ${od.city}, Nepal
              </div>
            </div>
            <div>
              <div class="section-title">Order Status</div>
              <div style="margin-bottom:8px;"><span class="badge">${od.paymentMethod === 'cod' ? '💵 Cash on Delivery' : od.paymentMethod}</span></div>
              <div style="font-size:11.5px;color:#64748b;">Delivery Status: <strong style="color:#0f172a;">Confirmed & Processing</strong></div>
              <div style="font-size:11.5px;color:#64748b;margin-top:2px;">Estimated: <strong style="color:#0f172a;">2-3 Business Days</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Details</th>
                <th style="text-align:center">Qty</th>
                <th style="text-align:right">Price</th>
                <th style="text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${od.items.map(item => `
              <tr>
                <td>
                  <div style="font-weight:700;color:#0f172a">${item.name}</div>
                  ${item.variant?.size || item.variant?.color ? '<div style="font-size:11.5px;color:#64748b;margin-top:2px">' + [item.variant?.size, item.variant?.color].filter(Boolean).join(' · ') + '</div>' : ''}
                </td>
                <td style="text-align:center;font-weight:600">${item.quantity}</td>
                <td style="text-align:right;color:#475569">NPR ${item.price.toLocaleString()}</td>
                <td style="text-align:right;font-weight:700;color:#0f172a">NPR ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>`).join('')}
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Subtotal</span><span style="font-weight:600;color:#0f172a">NPR ${od.subtotal.toLocaleString()}</span></div>
            <div class="total-row"><span>Delivery Charge</span><span style="font-weight:600;color:#0f172a">${od.deliveryCharge === 0 ? '<span style="color:#16a34a;font-weight:700">FREE</span>' : `NPR ${od.deliveryCharge}`}</span></div>
            ${od.discountAmount > 0 ? `<div class="total-row"><span style="color:#16a34a">Coupon (${od.couponCode})</span><span style="color:#16a34a;font-weight:700">− NPR ${od.discountAmount.toLocaleString()}</span></div>` : ''}
            <div class="grand-total"><span>Grand Total</span><span>NPR ${od.total.toLocaleString()}</span></div>
          </div>

          <div class="footer">
            Thank you for shopping with <strong>EverFrame Nepal</strong>! ❤️<br/>
            Need help? Email us at <strong>everframe.np@gmail.com</strong> · Track status at <strong>everframe.com/track-order</strong><br/>
            <em>Crafted with love & precision in Nepal 🇳🇵</em>
          </div>
        </body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    };

    return (
      <div style={{ background: 'var(--color-bg)', minHeight: '100vh', padding: '40px 20px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          {/* Celebration Success Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
            }}>
              <CheckCircle size={40} color="#fff" />
            </div>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--brand-gradient-soft)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-navy)', marginBottom: '10px' }}>
              <Sparkles size={15} color="var(--color-pink)" /> Celebration Time! Your Order is Placed 🎉
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, color: 'var(--color-primary-navy)', margin: '4px 0 8px' }}>Order Confirmed!</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>
              Thank you, <strong>{od.name}</strong>! Your EverFrame is being crafted for delivery to <strong>{od.city}</strong>.
            </p>
          </div>

          {/* Bill / Invoice Card */}
          <div id="everframe-bill" style={{ background: 'var(--color-white)', borderRadius: '18px', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

            {/* Bill Header with EverFrame Logo */}
            <div style={{ background: 'var(--brand-gradient)', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#ffffff', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <img src="/logo.png" alt="EverFrame" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>EverFrame</div>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>Premium Custom Photo Frames · Nepal</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Official Invoice</div>
                <div style={{ fontWeight: 900, fontSize: '18px', color: '#fff', marginTop: '2px' }}>#{od.orderNumber}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                  {od.placedAt.toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })} · {od.placedAt.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 26px' }}>

              {/* Customer Info & Status Grid */}
              <div className="invoice-info-grid">
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Bill To & Delivery Address</div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-dark)' }}>{od.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: 1.6 }}>
                    📞 {od.phone}<br />
                    {od.email && <>✉️ {od.email}<br /></>}
                    📍 {od.address}<br />
                    {od.city}, Nepal
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '6px' }}>Payment & Status</div>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#082614', color: '#4ADE80', padding: '4px 12px', borderRadius: '20px', border: '1px solid #14592F', display: 'inline-block' }}>
                    {od.paymentMethod === 'cod' ? '💵 Cash on Delivery' : od.paymentMethod}
                  </span>
                  <div style={{ marginTop: '10px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Order Status</div>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#261E05', color: '#FDE047', padding: '4px 12px', borderRadius: '20px', border: '1px solid #634C08', display: 'inline-block' }}>⏳ Processing</span>
                </div>
              </div>

              {/* Items List with Thumbnails */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', paddingBottom: '8px', borderBottom: '1.5px solid var(--color-border-light)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)' }}>Item Details</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', textAlign: 'center' }}>Qty</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-muted)', textAlign: 'right' }}>Amount</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {od.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--color-border-light)', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={item.images?.[0] || item.image || item.photo_url || '/logo.png'}
                          alt={item.name}
                          style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border-light)', flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--color-dark)' }}>{item.name}</div>
                          {(item.variant?.size || item.variant?.color) && (
                            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {[item.variant?.size, item.variant?.color].filter(Boolean).join(' · ')}
                            </div>
                          )}
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>NPR {item.price.toLocaleString()} each</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-dark)', textAlign: 'center', background: 'var(--color-surface)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        ×{item.quantity}
                      </div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-dark)', textAlign: 'right' }}>
                        NPR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-dark)' }}>NPR {od.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  <span>Delivery Charge</span>
                  <span style={{ fontWeight: 700, color: od.deliveryCharge === 0 ? '#16a34a' : 'var(--color-dark)' }}>
                    {od.deliveryCharge === 0 ? 'FREE 🎉' : `NPR ${od.deliveryCharge}`}
                  </span>
                </div>
                {od.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', fontWeight: 700 }}>
                    <span>Coupon ({od.couponCode})</span>
                    <span>− NPR {od.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: 'var(--color-primary-navy)', paddingTop: '10px', borderTop: '1.5px solid var(--color-border)' }}>
                  <span>Grand Total</span>
                  <span>NPR {od.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                ❤️ Thank you for choosing <strong>EverFrame</strong>! Your frames are lovingly handcrafted in Nepal 🇳🇵<br/>
                For support or inquiries: <strong>everframe.np@gmail.com</strong> · Track at <strong>/track-order</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="invoice-actions">
            <Link to="/" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>← Back to Home</Link>
            <Link to="/track-order" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>📦 Track Order</Link>
            <button
              className="btn btn-primary"
              disabled={downloading}
              onClick={async () => {
                try {
                  setDownloading(true);
                  toast.loading('Downloading invoice...', { id: 'invoice-dl' });
                  await downloadInvoicePDF(od);
                  toast.success('Invoice downloaded! 📄', { id: 'invoice-dl' });
                } catch (err) {
                  console.error(err);
                  toast.error('Download issue, opening print view...', { id: 'invoice-dl' });
                  handlePrint();
                } finally {
                  setDownloading(false);
                }
              }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {downloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Bill</span>
                </>
              )}
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
    background: 'var(--color-surface)',
    color: 'var(--color-dark)',
    transition: 'all 0.2s',
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
          <div className="checkout-grid">

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Delivery Card */}
              <div style={{ background: 'var(--color-white)', borderRadius: '16px', padding: '26px', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-card)' }}>
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
                <div className="form-row" style={{ marginBottom: '14px' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '5px' }}>
                    Email <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input name="email" type="email" style={{ ...fieldStyle('email'), borderStyle: 'dashed' }} placeholder="For order confirmation email" value={form.email} onChange={handleChange} autoComplete="email" />
                </div>

                {/* Delivery zone notice */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 14px' }}>
                  <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', marginBottom: '2px' }}>📍 Kathmandu Valley Delivery Only</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      We currently deliver within <strong>Kathmandu, Lalitpur, and Bhaktapur</strong> districts only. Nationwide delivery coming soon!
                    </div>
                  </div>
                </div>

                {/* Delivery charge banner */}
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: subtotal >= DELIVERY_THRESHOLD ? '#082614' : 'var(--color-surface)',
                  border: `1px solid ${subtotal >= DELIVERY_THRESHOLD ? '#14592F' : 'var(--color-border)'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}>
                  <Truck size={15} color={subtotal >= DELIVERY_THRESHOLD ? '#4ADE80' : 'var(--color-primary-navy)'} />
                  <span style={{ fontSize: '12.5px', color: subtotal >= DELIVERY_THRESHOLD ? '#4ADE80' : 'var(--color-dark)', fontWeight: 600 }}>
                    {subtotal >= DELIVERY_THRESHOLD
                      ? '🎉 Free delivery unlocked! (Orders above NPR 2,000)'
                      : `Delivery charge: NPR ${DELIVERY_CHARGE} · Add NPR ${(DELIVERY_THRESHOLD - subtotal).toLocaleString()} more for free delivery`}
                  </span>
                </div>
              </div>

              {/* Payment Card */}
              <div style={{ background: 'var(--color-white)', borderRadius: '16px', padding: '26px', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-card)' }}>
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
                        background: paymentMethod === pm.id ? 'var(--brand-gradient-soft)' : 'var(--color-surface)',
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
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#082614', color: '#4ADE80', border: '1px solid #14592F', padding: '3px 10px', borderRadius: '20px', flexShrink: 0 }}>Recommended</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Summary */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{ background: 'var(--color-white)', borderRadius: '16px', padding: '22px', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-card)' }}>
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
                              style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, outline: 'none', background: 'var(--color-surface)', color: 'var(--color-dark)' }}
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
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
