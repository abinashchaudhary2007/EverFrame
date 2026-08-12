import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Plus, Search, Trash2, TrendingUp, Lock, LogOut, ShieldCheck, RefreshCw,
  ToggleLeft, ToggleRight, Copy, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { products as initialProducts } from '../data/products';
import { getAllOrders, updateOrderStatus, getAllCoupons, createCoupon, toggleCoupon, deleteCoupon } from '../services/api';
import CopyButton from '../components/ui/CopyButton';


export default function Admin() {
  const [isAdminAuth, setIsAdminAuth] = useState(() => sessionStorage.getItem('everframe_admin_auth') === 'true');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tab, setTab] = useState('overview');
  const [productList, setProductList] = useState(initialProducts);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '',
  });
  const [couponSaving, setCouponSaving] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '', category: 'photo-frames', price: '', stock: '20', description: '',
  });

  // Load all real orders from Supabase when admin panel opens
  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await getAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (isAdminAuth) {
      loadOrders();

      const handleLiveOrder = () => loadOrders();
      window.addEventListener('everframe_order_updated', handleLiveOrder);
      window.addEventListener('everframe_new_order', handleLiveOrder);
      window.addEventListener('storage', handleLiveOrder);

      return () => {
        window.removeEventListener('everframe_order_updated', handleLiveOrder);
        window.removeEventListener('everframe_new_order', handleLiveOrder);
        window.removeEventListener('storage', handleLiveOrder);
      };
    }
  }, [isAdminAuth]);

  // Load coupons when coupons tab is opened
  useEffect(() => {
    if (isAdminAuth && tab === 'coupons') {
      loadCoupons();
    }
  }, [isAdminAuth, tab]);

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    const data = await getAllCoupons();
    setCoupons(data);
    setLoadingCoupons(false);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim() || !couponForm.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }
    setCouponSaving(true);
    const result = await createCoupon(couponForm);
    setCouponSaving(false);
    if (result.success) {
      toast.success(`Coupon "${result.coupon.code}" created!`, {
        position: 'bottom-right',
        style: { background: '#16a34a', color: '#fff', borderRadius: '8px' },
      });
      setCoupons(prev => [result.coupon, ...prev]);
      setShowCouponForm(false);
      setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
    } else {
      toast.error(result.error || 'Failed to create coupon');
    }
  };

  const handleToggleCoupon = async (coupon) => {
    const newState = !coupon.is_active;
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: newState } : c));
    await toggleCoupon(coupon.id, newState);
    toast.success(`Coupon "${coupon.code}" ${newState ? 'activated' : 'deactivated'}`, {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
    });
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    setCoupons(prev => prev.filter(c => c.id !== coupon.id));
    await deleteCoupon(coupon.id);
    toast.success(`Coupon "${coupon.code}" deleted`, {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
    });
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCouponForm(f => ({ ...f, code: `EF${rand}` }));
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'admin@everframe.com' && loginPassword === 'admin123') {
      sessionStorage.setItem('everframe_admin_auth', 'true');
      setIsAdminAuth(true);
      setLoginError('');
      toast.success('Admin authenticated! 🔑', {
        position: 'bottom-right',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
      });
    } else {
      setLoginError('Invalid admin email or password. Access denied.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('everframe_admin_auth');
    setIsAdminAuth(false);
    toast('Logged out of Admin Portal', { position: 'bottom-right', style: { background: '#172A72', color: '#fff' } });
  };

  const handleStatusChange = async (targetOrder, newStatus) => {
    const targetId = targetOrder.id || targetOrder.order_number;
    const targetNum = targetOrder.order_number || targetOrder.id;

    // Optimistically update orders in local Admin state so status button updates IMMEDIATELY in UI
    setOrders(prev => prev.map(o => 
      (o.id === targetOrder.id || o.order_number === targetOrder.order_number || o.id === targetId || o.order_number === targetId) 
        ? { ...o, order_status: newStatus } 
        : o
    ));

    await updateOrderStatus(targetId, newStatus, targetNum);

    toast.success(`Order #${targetNum} updated to "${newStatus}"!`, {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
      iconTheme: { primary: '#22c55e', secondary: '#fff' }
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = orderStatusFilter === 'All' || order.order_status === orderStatusFilter;
    const q = orderSearchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      (order.order_number || '').toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.customer_email || '').toLowerCase().includes(q) ||
      (order.customer_phone || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleDeleteProduct = (id) => {
    setProductList(prev => prev.filter(p => p.id !== id));
    toast.success('Product removed from view', { position: 'bottom-right', style: { background: '#172A72', color: '#fff' } });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please enter name and price'); return;
    }
    const created = {
      id: Date.now(),
      name: newProduct.name,
      slug: newProduct.name.toLowerCase().replace(/\s+/g, '-'),
      category: newProduct.category,
      categoryLabel: newProduct.category.toUpperCase().replace(/-/g, ' '),
      price: parseFloat(newProduct.price),
      originalPrice: null,
      discount: null,
      badge: 'NEW',
      rating: 5.0,
      reviewCount: 1,
      stock: parseInt(newProduct.stock) || 10,
      description: newProduct.description || 'Premium frame handcrafted for your space.',
      images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80'],
      material: 'Wood',
      frameType: 'classic',
      sizes: ['5x7', '8x10'],
      colors: ['Natural', 'Black'],
    };
    setProductList(prev => [created, ...prev]);
    setShowAddModal(false);
    setNewProduct({ name: '', category: 'photo-frames', price: '', stock: '20', description: '' });
    toast.success(`"${created.name}" added!`, {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px' },
    });
  };

  // Derived stats from real orders
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const uniqueCustomers = [...new Set(orders.map(o => o.customer_email).filter(Boolean))];

  // STATUS BADGE COLOR
  const statusColor = {
    'Delivered': '#16a34a',
    'Shipped': '#2563eb',
    'Confirmed': '#216DB2',
    'Preparing': '#3D3A86',
    'Order Placed': '#B94F8C',
  };

  // ADMIN LOGIN SCREEN
  if (!isAdminAuth) {
    return (
      <div className="auth-page page-enter">
        <div className="auth-card" style={{ maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img src="/logo.png" alt="EverFrame" style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '50%', margin: '0 auto 14px', display: 'block' }} />
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Secure Admin Portal Access
            </p>
          </div>

          {loginError && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px', lineHeight: '1.5' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input type="email" className="form-input" placeholder="admin@domain.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '8px' }}>
              <ShieldCheck size={18} /> Authenticate Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div className="account-page page-enter">
      <div className="container">
        {/* Admin Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '6px' }}>Management Portal</div>
            <h1 className="section-heading">EverFrame Admin</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Product
            </button>
            <button className="btn btn-outline" onClick={loadOrders} title="Refresh orders from Supabase">
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-outline" onClick={handleAdminLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="account-grid" style={{ gridTemplateColumns: '220px 1fr' }}>
          {/* Sidebar */}
          <div className="account-sidebar">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-blue)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              ADMIN MENU
            </div>
            <nav className="account-nav">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'orders', icon: ShoppingCart, label: `Live Orders (${orders.length})` },
                { id: 'products', icon: Package, label: `Products (${productList.length})` },
                { id: 'customers', icon: Users, label: `Customers (${uniqueCustomers.length})` },
                { id: 'coupons', icon: Tag, label: 'Coupons' },
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
              <Link to="/" style={{ color: 'var(--color-text-muted)', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                ← Exit to Store
              </Link>
            </nav>
          </div>

          {/* Content */}
          <div className="account-content">

            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>Dashboard Overview</h2>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { label: 'Total Revenue', val: `NPR ${totalSales.toLocaleString()}`, icon: TrendingUp, color: '#216DB2', sub: 'from all orders' },
                    { label: 'Total Orders', val: orders.length, icon: ShoppingCart, color: '#3D3A86', sub: `${orders.filter(o => o.order_status === 'Order Placed').length} new pending` },
                    { label: 'Products', val: productList.length, icon: Package, color: '#68408D', sub: 'in catalog' },
                    { label: 'Customers', val: uniqueCustomers.length, icon: Users, color: '#B94F8C', sub: 'unique accounts' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px 16px', border: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                        <stat.icon size={18} color={stat.color} />
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>{stat.val}</div>
                      <div style={{ fontSize: '11.5px', color: stat.color, fontWeight: 500 }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700 }}>Recent Orders</h3>
                  <span style={{ fontSize: '12px', background: '#eef9ee', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>● Live Data</span>
                </div>
                {loadingOrders ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px 0' }}>Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px 0' }}>No orders yet. Orders placed by customers will appear here.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orders.slice(0, 5).map(order => {
                      const num = order.order_number || order.id;
                      return (
                        <div key={order.id || num} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-white)' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>#{num} — {order.customer_name}</span>
                              <CopyButton text={num} />
                            </div>
                            <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                              {order.customer_email} · {order.payment_method} · {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--color-primary-navy)' }}>NPR {(order.total || 0).toLocaleString()}</div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: statusColor[order.order_status] || '#216DB2', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>
                              {order.order_status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* LIVE ORDERS TAB */}
            {tab === 'orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>Live Order Management</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', background: '#eef9ee', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>● Live Data</span>
                    <button className="btn btn-outline" onClick={loadOrders} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: 'var(--color-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                  <div className="search-bar" style={{ background: '#fff' }}>
                    <Search size={16} color="var(--color-text-muted)" />
                    <input
                      type="text"
                      placeholder="Search orders by customer name, email, phone, or order ID..."
                      value={orderSearchQuery}
                      onChange={e => setOrderSearchQuery(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '6px' }}>Status:</span>
                    {['All', 'Order Placed', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'].map(st => (
                      <button
                        key={st}
                        className={`filter-chip ${orderStatusFilter === st ? 'active' : ''}`}
                        style={{ fontSize: '12px', padding: '5px 14px' }}
                        onClick={() => setOrderStatusFilter(st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingOrders ? (
                  <p style={{ color: 'var(--color-text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading orders...</p>
                ) : filteredOrders.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 0' }}>
                    <div className="empty-state-icon"><ShoppingCart size={48} strokeWidth={1} /></div>
                    <h3>No matching orders found</h3>
                    <p>Try clearing your search or status filters.</p>
                    <button className="btn btn-outline btn-sm" onClick={() => { setOrderStatusFilter('All'); setOrderSearchQuery(''); }}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredOrders.map(order => {
                      const num = order.order_number || order.id;
                      return (
                        <div key={order.id || num} style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '20px', background: 'var(--color-white)', boxShadow: 'var(--shadow-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-navy)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>Order #{num}</span>
                                <CopyButton text={num} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: statusColor[order.order_status] || '#216DB2', padding: '3px 10px', borderRadius: '12px' }}>
                                  {order.order_status}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                                <strong>{order.customer_name}</strong> · {order.customer_email} · {order.customer_phone || 'No Phone'}
                              </div>
                              <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                                {order.city || ''}, {order.province || ''} · Payment: <strong style={{ color: 'var(--color-dark)' }}>{order.payment_method}</strong> · Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-primary-navy)' }}>NPR {(order.total || 0).toLocaleString()}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                Delivery: NPR {(order.delivery_charge || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Order items */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border-light)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-dark)', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Ordered:</div>
                              {order.order_items.map((it, idx) => (
                                <div key={it.id || idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <span>• {it.product_name} × {it.quantity}</span>
                                  <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>NPR {(it.price * it.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Status update buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-dark)' }}>Update Status:</span>
                            {['Order Placed', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'].map(st => (
                              <button
                                key={st}
                                className={`btn btn-sm ${order.order_status === st ? 'btn-primary' : 'btn-outline'}`}
                                style={{ fontSize: '11.5px', padding: '5px 12px' }}
                                onClick={() => handleStatusChange(order, st)}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS TAB */}
            {tab === 'products' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>Products Catalog</h2>
                  <div className="search-bar" style={{ padding: '6px 12px' }}>
                    <Search size={14} color="var(--color-text-muted)" />
                    <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1.5px solid var(--color-border)' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Product</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Category</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Price</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Stock</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productList
                        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                        .map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={p.images[0]} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                                <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>{p.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>{p.categoryLabel}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>NPR {p.price.toLocaleString()}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>{p.stock} pcs</td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ color: '#E11D48', padding: '4px 8px' }} title="Remove">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CUSTOMERS TAB — derived from real orders */}
            {tab === 'customers' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>Customer Directory</h2>
                  <span style={{ fontSize: '12px', background: '#eef9ee', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>● Supabase</span>
                </div>
                {orders.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>No customer data yet. Customers will appear here after they place orders.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1.5px solid var(--color-border)' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Name</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Email</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Phone</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Orders</th>
                        <th style={{ padding: '12px 14px', fontWeight: 700 }}>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(
                        orders.reduce((acc, o) => {
                          const key = o.customer_email;
                          if (!acc[key]) {
                            acc[key] = { name: o.customer_name, email: o.customer_email, phone: o.customer_phone, orders: 0, totalSpent: 0 };
                          }
                          acc[key].orders++;
                          acc[key].totalSpent += (o.total || 0);
                          return acc;
                        }, {})
                      ).map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-dark)' }}>{c.name}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>{c.email}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>{c.phone}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>{c.orders}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>NPR {c.totalSpent.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* COUPONS TAB */}
            {tab === 'coupons' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>Coupon Manager</h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={loadCoupons} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCouponForm(v => !v)} style={{ fontSize: '13px' }}>
                      <Plus size={15} /> {showCouponForm ? 'Cancel' : 'Create Coupon'}
                    </button>
                  </div>
                </div>

                {/* Create Coupon Form */}
                {showCouponForm && (
                  <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: '14px', padding: '24px', marginBottom: '28px' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={17} /> New Coupon
                    </h3>
                    <form onSubmit={handleCreateCoupon}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Coupon Code *</label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              className="form-input"
                              placeholder="e.g. SAVE10"
                              value={couponForm.code}
                              onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                              style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em', flex: 1 }}
                              required
                            />
                            <button type="button" className="btn btn-outline" onClick={generateCouponCode} title="Auto-generate code" style={{ padding: '8px 10px', flexShrink: 0 }}>
                              <Zap size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Discount Type *</label>
                          <select className="form-input" value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (NPR)</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">{couponForm.discount_type === 'percentage' ? 'Discount %' : 'Discount NPR'} *</label>
                          <input type="number" className="form-input" placeholder={couponForm.discount_type === 'percentage' ? '10' : '200'} value={couponForm.discount_value} onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))} min="1" max={couponForm.discount_type === 'percentage' ? '100' : undefined} required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Min Order (NPR)</label>
                          <input type="number" className="form-input" placeholder="0" value={couponForm.min_order_amount} onChange={e => setCouponForm(f => ({ ...f, min_order_amount: e.target.value }))} min="0" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Max Uses (blank = unlimited)</label>
                          <input type="number" className="form-input" placeholder="Unlimited" value={couponForm.max_uses} onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))} min="1" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Expiry Date (optional)</label>
                          <input type="date" className="form-input" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={couponSaving} style={{ minWidth: '160px' }}>
                        {couponSaving ? 'Creating...' : <><Plus size={15} /> Create Coupon</>}
                      </button>
                    </form>
                  </div>
                )}

                {/* Coupons Table */}
                {loadingCoupons ? (
                  <p style={{ color: 'var(--color-text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading coupons...</p>
                ) : coupons.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 0' }}>
                    <div className="empty-state-icon"><Tag size={48} strokeWidth={1} /></div>
                    <h3>No coupons yet</h3>
                    <p>Create your first discount coupon above.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1.5px solid var(--color-border)' }}>
                          <th style={{ padding: '12px 14px', fontWeight: 700 }}>Code</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700 }}>Discount</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700 }}>Min Order</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700 }}>Usage</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700 }}>Expiry</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map(coupon => {
                          const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                          const isMaxed = coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses;
                          return (
                            <tr key={coupon.id} style={{ borderBottom: '1px solid var(--color-border-light)', opacity: (!coupon.is_active || isExpired || isMaxed) ? 0.65 : 1 }}>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--color-primary-navy)', fontSize: '14px', letterSpacing: '0.05em' }}>{coupon.code}</span>
                                  <CopyButton text={coupon.code} />
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-blue)' }}>
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `NPR ${coupon.discount_value}`}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>
                                {coupon.min_order_amount > 0 ? `NPR ${coupon.min_order_amount.toLocaleString()}` : 'Any amount'}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>
                                {coupon.usage_count}
                                {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : ' / ∞'}
                              </td>
                              <td style={{ padding: '12px 14px', color: isExpired ? '#E11D48' : 'var(--color-text-muted)', fontSize: '12.5px' }}>
                                {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                {isExpired && <span style={{ marginLeft: '4px', fontSize: '10px', fontWeight: 700 }}>(Expired)</span>}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: coupon.is_active && !isExpired && !isMaxed ? '#dcfce7' : '#f5f5f5', color: coupon.is_active && !isExpired && !isMaxed ? '#16a34a' : '#888' }}>
                                  {isExpired ? 'Expired' : isMaxed ? 'Maxed' : coupon.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleToggleCoupon(coupon)}
                                    style={{ color: coupon.is_active ? '#16a34a' : '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    title={coupon.is_active ? 'Deactivate' : 'Activate'}
                                  >
                                    {coupon.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(coupon)}
                                    style={{ color: '#E11D48', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    title="Delete coupon"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="search-overlay" style={{ paddingTop: '80px' }} onClick={() => setShowAddModal(false)}>
          <div className="auth-card" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <h2 className="auth-title" style={{ fontSize: '22px', marginBottom: '20px' }}>Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" placeholder="e.g. Vintage Gold Frame" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                    <option value="photo-frames">Photo Frames</option>
                    <option value="wedding-frames">Wedding Frames</option>
                    <option value="wall-art">Wall Art</option>
                    <option value="personalized-gifts">Personalized Gifts</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (NPR) *</label>
                  <input type="number" className="form-input" placeholder="2500" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input type="number" className="form-input" placeholder="20" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="Product details..." value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
