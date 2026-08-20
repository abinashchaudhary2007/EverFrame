import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, Heart, MapPin, LogOut, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import { getUserOrders } from '../services/api';
import CopyButton from '../components/ui/CopyButton';
import { downloadInvoicePDF } from '../utils/invoiceDownload';

export default function Account() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { wishlist } = useWishlist();
  const [tab, setTab] = useState('profile');
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchOrders = () => {
    if (user?.email) {
      setLoadingOrders(true);
      getUserOrders(user.email).then(orders => {
        setUserOrders(orders);
        setLoadingOrders(false);
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    fetchOrders();

    const handleUpdate = () => fetchOrders();
    window.addEventListener('everframe_order_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('everframe_order_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user, authLoading, navigate, tab]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || !user) return null;

  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const isGoogleUser = user.provider === 'google';

  const statusColor = {
    'Delivered': '#16a34a',
    'Shipped': '#2563eb',
    'Confirmed': 'var(--color-blue)',
    'Preparing': 'var(--color-indigo)',
    'Order Placed': 'var(--color-pink)',
  };

  return (
    <div className="account-page page-enter">
      <div className="container">
        <div className="account-grid">
          {/* Sidebar */}
          <div className="account-sidebar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)', margin: '0 auto 12px', display: 'block' }} />
            ) : (
              <div className="account-avatar">{initials}</div>
            )}
            <div className="account-name">{user.name}</div>
            <div className="account-email">{user.email}</div>
            {isGoogleUser && (
              <div style={{ fontSize: '11px', color: 'var(--color-blue)', fontWeight: 600, textAlign: 'center', marginTop: '4px' }}>● Signed in with Google</div>
            )}

            <nav className="account-nav">
              {[
                { id: 'profile', icon: User, label: 'Profile' },
                { id: 'orders', icon: Package, label: `My Orders (${userOrders.length})` },
                { id: 'wishlist', icon: Heart, label: `Wishlist (${wishlist.length})` },
                { id: 'addresses', icon: MapPin, label: 'Addresses' },
              ].map(item => (
                <a
                  key={item.id}
                  href="#"
                  className={tab === item.id ? 'active' : ''}
                  onClick={e => { e.preventDefault(); setTab(item.id); }}
                >
                  <item.icon size={16} />
                  {item.label}
                </a>
              ))}
              <a href="#" onClick={e => { e.preventDefault(); handleLogout(); }} style={{ color: '#e53e3e', marginTop: '8px' }}>
                <LogOut size={16} />
                Logout
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="account-content">
            {/* Profile */}
            {tab === 'profile' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>My Profile</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" defaultValue={user.name} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" defaultValue={user.email} type="email" readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#16a34a', fontWeight: 600 }}>
                      ✓ Verified Account ({user.email})
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab - Filtered Specifically for logged in user */}
            {tab === 'orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>
                    My Order History
                  </h2>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Showing orders for <strong>{user.email}</strong>
                  </span>
                </div>

                {loadingOrders ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                    Loading your orders...
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Package size={56} strokeWidth={1} /></div>
                    <h3>No orders found for this account</h3>
                    <p>When you place orders using <strong>{user.email}</strong>, they will appear right here!</p>
                    <Link to="/shop" className="btn btn-primary" style={{ marginTop: '12px' }}>Start Shopping</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {userOrders.map(order => {
                      const orderNum = order.order_number || order.id;
                      const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : (order.date || 'Recent');
                      const st = order.order_status || order.status || 'Order Placed';
                      const stBg = statusColor[st] || 'var(--color-blue)';

                      return (
                        <div key={orderNum} style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '20px', background: 'var(--color-white)', boxShadow: 'var(--shadow-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-primary-navy)' }}>#{orderNum}</span>
                                <CopyButton text={orderNum} />
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                Placed on {dateStr} · {order.order_items?.length || order.items?.length || 1} item(s)
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-primary-navy)' }}>
                                NPR {(order.total || 0).toLocaleString()}
                              </div>
                              <div style={{ display: 'inline-block', marginTop: '4px', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#fff', background: stBg }}>
                                {st}
                              </div>
                            </div>
                          </div>

                          {/* Order items preview */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                              {order.order_items.map(it => (
                                <div key={it.id || it.product_name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span>• {it.product_name} × {it.quantity}</span>
                                  <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>NPR {(it.price * it.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={downloadingId === orderNum}
                              onClick={async () => {
                                try {
                                  setDownloadingId(orderNum);
                                  toast.loading('Downloading invoice...', { id: `acc-dl-${orderNum}` });
                                  await downloadInvoicePDF({
                                    orderNumber: orderNum,
                                    placedAt: order.created_at || order.date,
                                    name: order.customer_name || user?.name || 'Customer',
                                    email: order.customer_email || user?.email,
                                    phone: order.customer_phone,
                                    address: order.address || order.shipping_address,
                                    city: order.city,
                                    paymentMethod: order.payment_method,
                                    items: (order.order_items || order.items || []).map(it => ({
                                      name: it.product_name || it.name,
                                      price: it.price,
                                      quantity: it.quantity,
                                      variant: it.variant
                                    })),
                                    subtotal: order.subtotal || order.total,
                                    deliveryCharge: order.delivery_charge || 0,
                                    discountAmount: order.discount_amount || 0,
                                    couponCode: order.coupon_code || '',
                                    total: order.total
                                  });
                                  toast.success('Invoice downloaded! 📄', { id: `acc-dl-${orderNum}` });
                                } catch (err) {
                                  console.error(err);
                                  toast.error('Could not download invoice', { id: `acc-dl-${orderNum}` });
                                } finally {
                                  setDownloadingId(null);
                                }
                              }}
                              style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              {downloadingId === orderNum ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                              <span>Download Bill</span>
                            </button>
                            <Link to={`/track-order?id=${orderNum}`} className="btn btn-primary btn-sm" style={{ fontSize: '12px', padding: '6px 14px' }}>
                              Track Package →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            {tab === 'wishlist' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>
                  My Wishlist ({wishlist.length})
                </h2>
                {wishlist.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Heart size={56} strokeWidth={1} /></div>
                    <h3>No saved items yet</h3>
                    <p>Browse our collection and heart the frames you love.</p>
                    <Link to="/shop" className="btn btn-primary">Browse Frames</Link>
                  </div>
                ) : (
                  <div className="product-grid">
                    {wishlist.map(product => <ProductCard key={product.id} product={product} />)}
                  </div>
                )}
              </div>
            )}

            {/* Addresses */}
            {tab === 'addresses' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Saved Delivery Addresses</h2>
                <div className="empty-state">
                  <div className="empty-state-icon"><MapPin size={56} strokeWidth={1} /></div>
                  <h3>No addresses saved yet</h3>
                  <p>Your delivery addresses specified at checkout will be saved here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
