import { useState, useEffect } from 'react';
import { Search, Package, Download, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrderByNumber } from '../services/api';
import CopyButton from '../components/ui/CopyButton';
import { downloadInvoicePDF } from '../utils/invoiceDownload';

const STATUS_STEPS = ['Order Placed', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [tracked, setTracked] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Auto-track if id comes from URL query param or when status is updated
  useEffect(() => {
    const currentId = searchParams.get('id') || orderId;
    if (currentId) {
      handleTrackDirect(currentId);
    }

    const handleUpdate = () => {
      const activeId = searchParams.get('id') || orderId;
      if (activeId) handleTrackDirect(activeId);
    };

    window.addEventListener('everframe_order_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('everframe_order_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [searchParams]);

  const handleTrackDirect = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError('');
    const order = await getOrderByNumber(id.trim());
    setLoading(false);
    if (order) {
      setTracked(order);
    } else {
      setError(`No order found with ID "${id.trim()}". Please check the order number and try again.`);
      setTracked(null);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) { setError('Please enter an order ID'); return; }
    await handleTrackDirect(orderId);
  };

  // Compute step states from the live order status (case-insensitive & robust)
  const getStepState = (stepLabel, currentStatus) => {
    if (!currentStatus) return stepLabel === 'Order Placed' ? 'current' : 'upcoming';
    const normSteps = STATUS_STEPS.map(s => s.toLowerCase());
    const normCurrent = currentStatus.toString().trim().toLowerCase();

    const stepIdx = normSteps.indexOf(stepLabel.toLowerCase());
    const currentIdx = normSteps.indexOf(normCurrent);

    if (currentIdx === -1) {
      return stepLabel === 'Order Placed' ? 'current' : 'upcoming';
    }

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  const getStepDate = (step, order) => {
    if (!order) return '';
    const normSteps = STATUS_STEPS.map(s => s.toLowerCase());
    const currentStatus = order.order_status || order.status || '';
    const normCurrent = currentStatus.toString().trim().toLowerCase();

    const base = order.created_at ? new Date(order.created_at) : new Date();
    const stepIdx = normSteps.indexOf(step.toLowerCase());
    const currentIdx = normSteps.indexOf(normCurrent);

    if (currentIdx !== -1 && stepIdx > currentIdx) {
      const est = new Date(base);
      est.setDate(est.getDate() + stepIdx);
      return `Expected ${est.toLocaleDateString('en-NP', { day: 'numeric', month: 'short' })}`;
    }
    const d = new Date(base);
    d.setDate(d.getDate() + stepIdx);
    return d.toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="tracking-page page-enter">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: '12px' }}>Order Tracking</div>
          <h1 className="section-heading">Track Your Order</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '10px' }}>
            Enter your order ID to see real-time status updates from Supabase.
          </p>
        </div>

        <div className="tracking-card">
          <form className="tracking-input-row" onSubmit={handleTrack}>
            <input
              type="text"
              placeholder="Enter Order ID (e.g. EF123456)"
              value={orderId}
              onChange={e => { setOrderId(e.target.value); setError(''); setTracked(null); }}
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }} disabled={loading}>
              <Search size={16} /> {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', marginBottom: '16px', marginTop: '4px' }}>
              {error}
            </div>
          )}

          {tracked && (
            <div>
              {/* Order Summary Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                  Order Details
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={downloading}
                  onClick={async () => {
                    try {
                      setDownloading(true);
                      toast.loading('Downloading invoice...', { id: 'track-dl' });
                      await downloadInvoicePDF({
                        orderNumber: tracked.order_number,
                        placedAt: tracked.created_at,
                        name: tracked.customer_name,
                        email: tracked.customer_email,
                        phone: tracked.customer_phone,
                        address: tracked.address || tracked.shipping_address,
                        city: tracked.city,
                        paymentMethod: tracked.payment_method,
                        items: (tracked.order_items || []).map(it => ({
                          name: it.product_name || it.name,
                          price: it.price,
                          quantity: it.quantity,
                          variant: it.variant
                        })),
                        subtotal: tracked.subtotal || tracked.total,
                        deliveryCharge: tracked.delivery_charge || 0,
                        discountAmount: tracked.discount_amount || 0,
                        couponCode: tracked.coupon_code || '',
                        total: tracked.total
                      });
                      toast.success('Invoice downloaded! 📄', { id: 'track-dl' });
                    } catch (err) {
                      console.error(err);
                      toast.error('Could not download invoice', { id: 'track-dl' });
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12.5px' }}
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Download Bill</span>
                </button>
              </div>

              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px', marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', border: '1px solid var(--color-border-light)' }}>
                {[
                  ['Order Number', <span key="ord" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>#{tracked.order_number} <CopyButton text={tracked.order_number} /></span>],
                  ['Customer', tracked.customer_name],
                  ['Email', tracked.customer_email],
                  ['Phone', tracked.customer_phone || '—'],
                  ['Payment', tracked.payment_method],
                  ['Delivery To', `${tracked.city || ''}, ${tracked.province || ''}`],
                  ['Order Total', `NPR ${(tracked.total || 0).toLocaleString()}`],
                  ['Placed On', tracked.created_at ? new Date(tracked.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                ].map(([label, val]) => (
                  <div key={typeof label === 'string' ? label : 'label'}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-dark)', wordBreak: 'break-word' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Order Items */}
              {tracked.order_items && tracked.order_items.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} /> Items Ordered
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tracked.order_items.map((it, idx) => (
                      <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--color-white)', border: '1px solid var(--color-border-light)', borderRadius: '8px', fontSize: '13.5px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>{it.product_name} × {it.quantity}</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-navy)' }}>NPR {(it.price * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Status Timeline */}
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Live Delivery Status</h3>
              <div className="order-status-track">
                {STATUS_STEPS.map((step, i) => {
                  const state = getStepState(step, tracked.order_status || tracked.status);
                  return (
                    <div key={step} className={`status-step ${state === 'completed' ? 'completed' : ''} ${state === 'current' ? 'current' : ''}`}>
                      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="status-dot" />
                        {i < STATUS_STEPS.length - 1 && <div className="status-line" />}
                      </div>
                      <div className="status-content">
                        <div className="status-title" style={{ color: state !== 'upcoming' ? 'var(--color-dark)' : 'var(--color-text-muted)' }}>
                          {step}
                          {state === 'current' && (
                            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#fff', fontWeight: 700, background: 'var(--color-blue)', padding: '2px 8px', borderRadius: '20px' }}>
                              In Progress
                            </span>
                          )}
                          {state === 'completed' && (
                            <span style={{ marginLeft: '8px', fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>✓</span>
                          )}
                        </div>
                        <div className="status-date">{getStepDate(step, tracked)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div style={{ marginTop: '28px', textAlign: 'center' }}>
                <Link to="/account" className="btn btn-outline" style={{ fontSize: '13.5px' }}>
                  ← View All My Orders
                </Link>
              </div>
            </div>
          )}

          {!tracked && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px', opacity: 0.35 }}>📦</div>
              <p style={{ fontSize: '14.5px', fontWeight: 500, color: 'var(--color-dark)', marginBottom: '6px' }}>Enter your order ID above to track your package</p>
              <p style={{ fontSize: '13px' }}>
                Find your order number in your account's <Link to="/account" style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>Order History</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
