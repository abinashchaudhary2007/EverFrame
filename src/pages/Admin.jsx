import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Plus, Search, Trash2, TrendingUp, Lock, LogOut, ShieldCheck, RefreshCw,
  ToggleLeft, ToggleRight, Copy, Zap, MessageSquare, MailOpen, Mail,
  Edit2, Eye, EyeOff, X, ImagePlus, Star, CheckCircle, AlertTriangle,
  SlidersHorizontal, ChevronDown, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllOrders, updateOrderStatus, getAllCoupons, createCoupon, toggleCoupon, deleteCoupon, getContactSubmissions, markContactRead, getAdminProducts, createProduct, updateProduct, deleteProduct, toggleProductAvailability, toggleProductFeatured } from '../services/api';
import CopyButton from '../components/ui/CopyButton';



export default function Admin() {
  const [isAdminAuth, setIsAdminAuth] = useState(() => sessionStorage.getItem('everframe_admin_auth') === 'true');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tab, setTab] = useState('overview');

  // Product management state
  const [productList, setProductList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productAvailFilter, setProductAvailFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSaving, setProductSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const imageInputRef = useRef(null);

  const EMPTY_PRODUCT_FORM = {
    name: '', description: '', category: 'photo-frames', price: '',
    original_price: '', sizes: '5x7, 8x10', colors: 'Natural, Black',
    material: 'Wood', frame_type: 'classic', stock: '50',
    is_featured: false, is_available: true,
  };
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [productImages, setProductImages] = useState([]);
  const [productFormError, setProductFormError] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
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

  // Contact submissions state
  const [contactMessages, setContactMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [expandedContact, setExpandedContact] = useState(null);

  // Keep for legacy/overview
  const search = productSearch;

  // Load all real orders from Supabase when admin panel opens
  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await getAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  // Load products from Supabase
  const loadProducts = async () => {
    setLoadingProducts(true);
    const data = await getAdminProducts();
    setProductList(data);
    setLoadingProducts(false);
  };

  useEffect(() => {
    if (isAdminAuth) {
      loadOrders();
      loadProducts();

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

  // Load coupons/contacts/products when tab is opened
  useEffect(() => {
    if (isAdminAuth && tab === 'coupons') {
      loadCoupons();
    }
    if (isAdminAuth && tab === 'contacts') {
      loadContactMessages();
    }
    if (isAdminAuth && tab === 'products') {
      loadProducts();
    }
  }, [isAdminAuth, tab]);

  // --- Product Action Handlers ---
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductImages([]);
    setProductFormError('');
    setShowProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'photo-frames',
      price: product.price?.toString() || '',
      original_price: product.originalPrice?.toString() || product.original_price?.toString() || '',
      sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : (product.sizes || ''),
      colors: Array.isArray(product.colors) ? product.colors.join(', ') : (product.colors || ''),
      material: product.material || 'Wood',
      frame_type: product.frameType || product.frame_type || 'classic',
      stock: product.stock?.toString() || '50',
      is_featured: product.isFeatured ?? product.is_featured ?? false,
      is_available: product.isAvailable ?? product.is_available ?? true,
    });
    setProductImages((product.images || []).map(url => ({ url, preview: url })));
    setProductFormError('');
    setShowProductModal(true);
  };

  const handleProductImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const valid = [];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: invalid file type (JPG/PNG/WebP only)`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: file too large (max 5MB)`);
        continue;
      }
      valid.push({ file, url: '', preview: URL.createObjectURL(file) });
    }
    setProductImages(prev => [...prev, ...valid]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeProductImage = (idx) => {
    setProductImages(prev => {
      const copy = [...prev];
      if (copy[idx]?.preview && copy[idx].file) {
        URL.revokeObjectURL(copy[idx].preview);
      }
      copy.splice(idx, 1);
      return copy;
    });
  };

  const validateProductForm = () => {
    if (!productForm.name.trim()) return 'Product name is required.';
    if (!productForm.category) return 'Category is required.';
    if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0)
      return 'Price must be a valid positive number.';
    if (productForm.original_price && parseFloat(productForm.original_price) <= parseFloat(productForm.price))
      return 'Original price must be greater than the selling price to offer a discount.';
    if (productImages.length === 0) return 'At least one product image is required.';
    return '';
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const err = validateProductForm();
    if (err) {
      setProductFormError(err);
      return;
    }
    setProductFormError('');
    setProductSaving(true);

    const imageFiles = productImages.map(img => img.file || img.url);

    if (editingProduct) {
      const result = await updateProduct(editingProduct.id, productForm, imageFiles);
      setProductSaving(false);
      if (result.success) {
        toast.success(`"${productForm.name}" updated!`, {
          position: 'bottom-right',
          style: { background: '#172A72', color: '#fff', borderRadius: '8px' }
        });
        setShowProductModal(false);
        loadProducts();
      } else {
        setProductFormError(result.error || 'Failed to update product.');
      }
    } else {
      const result = await createProduct(productForm, imageFiles);
      setProductSaving(false);
      if (result.success) {
        toast.success(`"${productForm.name}" added successfully!`, {
          position: 'bottom-right',
          style: { background: '#16a34a', color: '#fff', borderRadius: '8px' }
        });
        setShowProductModal(false);
        loadProducts();
      } else {
        setProductFormError(result.error || 'Failed to create product.');
      }
    }
  };

  const handleToggleAvailability = async (product) => {
    const newVal = !product.isAvailable;
    setProductList(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: newVal, is_available: newVal } : p));
    const result = await toggleProductAvailability(product.id, newVal);
    if (result.success) {
      toast.success(`"${product.name}" is now ${newVal ? 'Available' : 'Unavailable'}`, {
        position: 'bottom-right',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px' }
      });
    } else {
      setProductList(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: !newVal, is_available: !newVal } : p));
      toast.error('Failed to update product availability');
    }
  };

  const handleToggleFeatured = async (product) => {
    const newVal = !product.isFeatured;
    setProductList(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: newVal, is_featured: newVal } : p));
    const result = await toggleProductFeatured(product.id, newVal);
    if (result.success) {
      toast.success(`"${product.name}" ${newVal ? 'marked as Featured ⭐' : 'removed from Featured'}`, {
        position: 'bottom-right',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px' }
      });
    } else {
      setProductList(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: !newVal, is_featured: !newVal } : p));
      toast.error('Failed to update featured status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const result = await deleteProduct(deleteConfirm.id);
    setDeleting(false);
    if (result.success) {
      setProductList(prev => prev.filter(p => p.id !== deleteConfirm.id));
      toast.success(`"${deleteConfirm.name}" deleted.`, {
        position: 'bottom-right',
        style: { background: '#dc2626', color: '#fff', borderRadius: '8px' }
      });
    } else {
      toast.error(result.error || 'Failed to delete product');
    }
    setDeleteConfirm(null);
  };

  // Filtered & sorted products for Admin
  const adminFilteredProducts = productList
    .filter(p => {
      const q = productSearch.trim().toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.categoryLabel || '').toLowerCase().includes(q);
      const matchCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
      const matchAvail = productAvailFilter === 'all'
        || (productAvailFilter === 'available' && p.isAvailable)
        || (productAvailFilter === 'hidden' && !p.isAvailable);
      return matchSearch && matchCat && matchAvail;
    })
    .sort((a, b) => {
      if (productSort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (productSort === 'price-asc') return a.price - b.price;
      if (productSort === 'price-desc') return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const loadContactMessages = async () => {
    setLoadingContacts(true);
    const data = await getContactSubmissions();
    setContactMessages(data);
    setLoadingContacts(false);
  };

  const handleMarkRead = async (msg) => {
    setContactMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    await markContactRead(msg.id);
  };

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
            <button className="btn btn-primary" onClick={openAddProduct}>
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
                { id: 'contacts', icon: MessageSquare, label: `Messages (${contactMessages.filter(m => !m.is_read).length} unread)` },
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
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>Product Management</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Manage products, pricing, availability, and featured showcases ({productList.length} total)
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={loadProducts} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                    <button className="btn btn-primary" onClick={openAddProduct} style={{ fontSize: '13px' }}>
                      <Plus size={15} /> Add Product
                    </button>
                  </div>
                </div>

                {/* Filters toolbar */}
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <div className="search-bar" style={{ flex: '1 1 220px', background: '#fff', padding: '7px 12px' }}>
                    <Search size={14} color="var(--color-text-muted)" />
                    <input
                      type="text"
                      placeholder="Search by name or category..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <select
                    className="form-input"
                    style={{ flex: '0 1 160px', fontSize: '13px', padding: '8px 10px', height: 'auto', background: '#fff' }}
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="photo-frames">Photo Frames</option>
                    <option value="wedding-frames">Wedding Frames</option>
                    <option value="wall-art">Wall Art</option>
                    <option value="personalized-gifts">Personalized Gifts</option>
                    <option value="collage-frames">Collage Frames</option>
                  </select>
                  <select
                    className="form-input"
                    style={{ flex: '0 1 140px', fontSize: '13px', padding: '8px 10px', height: 'auto', background: '#fff' }}
                    value={productAvailFilter}
                    onChange={e => setProductAvailFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available Only</option>
                    <option value="hidden">Hidden Only</option>
                  </select>
                  <select
                    className="form-input"
                    style={{ flex: '0 1 160px', fontSize: '13px', padding: '8px 10px', height: 'auto', background: '#fff' }}
                    value={productSort}
                    onChange={e => setProductSort(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                  </select>
                </div>

                {/* Product table / states */}
                {loadingProducts ? (
                  <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '14px', fontSize: '14px' }}>Loading products from Supabase...</p>
                  </div>
                ) : adminFilteredProducts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 0' }}>
                    <div className="empty-state-icon"><Package size={48} strokeWidth={1} /></div>
                    <h3>{productList.length === 0 ? 'No products yet' : 'No products match your filters'}</h3>
                    <p>{productList.length === 0 ? 'Click "Add Product" to add your first product.' : 'Try clearing your search or filter options.'}</p>
                    {productList.length === 0 ? (
                      <button className="btn btn-primary" onClick={openAddProduct}><Plus size={15} /> Add Product</button>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => { setProductSearch(''); setProductCategoryFilter('all'); setProductAvailFilter('all'); }}>Clear Filters</button>
                    )}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--color-border)', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '850px' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-surface)', textAlign: 'left', borderBottom: '1.5px solid var(--color-border)' }}>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sizes</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Featured</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Added</th>
                          <th style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminFilteredProducts.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-light)', background: p.isAvailable ? 'var(--color-white)' : '#fafafa' }}>
                            {/* Product image + name */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                                  {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <Package size={20} color="var(--color-text-muted)" style={{ margin: '12px' }} />
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--color-dark)', fontSize: '13.5px', lineHeight: 1.3 }}>{p.name}</div>
                                  {p.discount > 0 && (
                                    <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#fff7ed', color: '#c2410c', padding: '1px 6px', borderRadius: '20px', display: 'inline-block', marginTop: '2px' }}>
                                      {p.discount}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {/* Category */}
                            <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>{p.categoryLabel || p.category}</td>
                            {/* Price */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-primary-navy)' }}>NPR {p.price?.toLocaleString()}</div>
                              {p.originalPrice && (
                                <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                                  NPR {p.originalPrice.toLocaleString()}
                                </div>
                              )}
                            </td>
                            {/* Sizes */}
                            <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                              {(p.sizes || []).slice(0, 3).join(', ')}{p.sizes?.length > 3 ? '…' : ''}
                            </td>
                            {/* Availability / Status */}
                            <td style={{ padding: '12px 14px' }}>
                              <button
                                onClick={() => handleToggleAvailability(p)}
                                title={p.isAvailable ? 'Click to mark as Unavailable' : 'Click to mark as Available'}
                                style={{
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  background: p.isAvailable ? '#dcfce7' : '#fee2e2',
                                  color: p.isAvailable ? '#16a34a' : '#dc2626',
                                  border: `1px solid ${p.isAvailable ? '#bbf7d0' : '#fecaca'}`,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <span>{p.isAvailable ? '●' : '○'}</span>
                                {p.isAvailable ? 'Available' : 'Unavailable'}
                              </button>
                            </td>
                            {/* Featured */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleToggleFeatured(p)}
                                title={p.isFeatured ? 'Featured product (click to unfeature)' : 'Click to mark as Featured'}
                                style={{
                                  background: p.isFeatured ? '#fffbeb' : 'var(--color-surface)',
                                  border: `1px solid ${p.isFeatured ? '#fde68a' : 'var(--color-border)'}`,
                                  borderRadius: '8px',
                                  padding: '5px 8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.25)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <Star
                                  size={16}
                                  fill={p.isFeatured ? '#f59e0b' : 'none'}
                                  color={p.isFeatured ? '#f59e0b' : '#9ca3af'}
                                />
                              </button>
                            </td>
                            {/* Created at */}
                            <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {p.created_at ? new Date(p.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            {/* Actions */}
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  onClick={() => openEditProduct(p)}
                                  title="Edit product"
                                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: 'var(--color-blue)', display: 'flex', alignItems: 'center' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleAvailability(p)}
                                  title={p.isAvailable ? 'Hide product from store' : 'Show product in store'}
                                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: p.isAvailable ? '#16a34a' : '#6b7280', display: 'flex', alignItems: 'center' }}
                                >
                                  {p.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(p)}
                                  title="Delete product"
                                  style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', color: '#E11D48', display: 'flex', alignItems: 'center' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

            {/* CONTACT MESSAGES TAB */}
            {tab === 'contacts' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700 }}>Contact Messages</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', background: '#eef9ee', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>● Supabase</span>
                    <button className="btn btn-outline" onClick={loadContactMessages} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>

                {loadingContacts ? (
                  <p style={{ color: 'var(--color-text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading messages...</p>
                ) : contactMessages.length === 0 ? (
                  <div className="empty-state" style={{ padding: '60px 0' }}>
                    <div className="empty-state-icon"><MessageSquare size={48} strokeWidth={1} /></div>
                    <h3>No messages yet</h3>
                    <p>Contact form submissions from customers will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {contactMessages.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          border: `1.5px solid ${msg.is_read ? 'var(--color-border)' : '#c7d7ff'}`,
                          borderRadius: '12px',
                          padding: '20px',
                          background: msg.is_read ? 'var(--color-white)' : '#f0f4ff',
                          boxShadow: msg.is_read ? 'none' : '0 2px 12px rgba(80,100,220,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {msg.is_read
                              ? <MailOpen size={18} color="var(--color-text-muted)" />
                              : <Mail size={18} color="#3D3A86" />}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-primary-navy)' }}>{msg.name}</div>
                              <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>{msg.email}</div>
                            </div>
                            {!msg.is_read && (
                              <span style={{ fontSize: '10px', fontWeight: 700, background: '#3D3A86', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>NEW</span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-dark)', marginBottom: '8px' }}>
                          Subject: {msg.subject}
                        </div>

                        <div
                          style={{
                            fontSize: '13.5px',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            maxHeight: expandedContact === msg.id ? 'none' : '72px',
                            overflow: expandedContact === msg.id ? 'visible' : 'hidden',
                            cursor: 'pointer',
                          }}
                          onClick={() => setExpandedContact(expandedContact === msg.id ? null : msg.id)}
                        >
                          {msg.message}
                        </div>
                        {msg.message && msg.message.length > 160 && (
                          <button
                            onClick={() => setExpandedContact(expandedContact === msg.id ? null : msg.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-blue)', fontSize: '12px', cursor: 'pointer', marginTop: '4px', padding: 0, fontWeight: 600 }}
                          >
                            {expandedContact === msg.id ? 'Show less ↑' : 'Show more ↓'}
                          </button>
                        )}

                        {!msg.is_read && (
                          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: '12px' }}
                              onClick={() => handleMarkRead(msg)}
                            >
                              <MailOpen size={13} /> Mark as Read
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── PRODUCT ADD/EDIT MODAL ───────────────────────────────── */}
      {showProductModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,30,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, overflowY: 'auto', padding: '24px 16px' }}
          onClick={() => !productSaving && setShowProductModal(false)}
        >
          <div
            style={{ background: 'var(--color-white)', borderRadius: '16px', maxWidth: '680px', margin: '0 auto', padding: '32px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close btn */}
            <button
              onClick={() => !productSaving && setShowProductModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            <div style={{ marginBottom: '24px' }}>
              <div className="section-label" style={{ marginBottom: '6px' }}>{editingProduct ? 'Edit Product' : 'New Product'}</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
                {editingProduct ? `Edit: ${editingProduct.name}` : 'Add New Product'}
              </h2>
            </div>

            {productFormError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#E11D48', padding: '12px 14px', borderRadius: '9px', fontSize: '13px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: 1.5 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              {/* Row 1: Name */}
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Classic Wooden Frame"
                  value={productForm.name}
                  onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Row 2: Category + Price */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="photo-frames">Photo Frames</option>
                    <option value="wedding-frames">Wedding Frames</option>
                    <option value="wall-art">Wall Art</option>
                    <option value="personalized-gifts">Personalized Gifts</option>
                    <option value="collage-frames">Collage Frames</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (NPR) *</label>
                  <input
                    type="number" min="1" className="form-input" placeholder="2500"
                    value={productForm.price}
                    onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 3: Original Price + Stock */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Original Price — for discount (NPR)</label>
                  <input
                    type="number" min="1" className="form-input" placeholder="Leave blank if no discount"
                    value={productForm.original_price}
                    onChange={e => setProductForm(f => ({ ...f, original_price: e.target.value }))}
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Must be greater than selling price</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input type="number" min="0" className="form-input" placeholder="50" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input" rows={3}
                  placeholder="Describe your product — materials, craftsmanship, ideal uses..."
                  value={productForm.description}
                  onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Sizes + Colors */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Frame Sizes</label>
                  <input className="form-input" placeholder="4x6, 5x7, 8x10, 11x14" value={productForm.sizes} onChange={e => setProductForm(f => ({ ...f, sizes: e.target.value }))} />
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Comma separated (e.g. 4x6, 5x7, 8x10)</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Colors / Finishes</label>
                  <input className="form-input" placeholder="Natural, Black, White, Walnut" value={productForm.colors} onChange={e => setProductForm(f => ({ ...f, colors: e.target.value }))} />
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>Comma separated</span>
                </div>
              </div>

              {/* Material + Frame Type */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Material</label>
                  <input className="form-input" placeholder="e.g. Oak Wood, Metal, Acrylic" value={productForm.material} onChange={e => setProductForm(f => ({ ...f, material: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Frame Type</label>
                  <select className="form-input" value={productForm.frame_type} onChange={e => setProductForm(f => ({ ...f, frame_type: e.target.value }))}>
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="personalized">Personalized</option>
                    <option value="collage">Collage</option>
                    <option value="polaroid">Polaroid</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap', padding: '14px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border-light)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--color-dark)' }}>
                  <button
                    type="button"
                    onClick={() => setProductForm(f => ({ ...f, is_featured: !f.is_featured }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: productForm.is_featured ? '#f59e0b' : 'var(--color-text-muted)' }}
                  >
                    {productForm.is_featured ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <Star size={15} fill={productForm.is_featured ? '#f59e0b' : 'none'} color={productForm.is_featured ? '#f59e0b' : 'var(--color-text-muted)'} />
                  Featured Product
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--color-dark)' }}>
                  <button
                    type="button"
                    onClick={() => setProductForm(f => ({ ...f, is_available: !f.is_available }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: productForm.is_available ? '#16a34a' : 'var(--color-text-muted)' }}
                  >
                    {productForm.is_available ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  {productForm.is_available ? <Eye size={15} color="#16a34a" /> : <EyeOff size={15} color="var(--color-text-muted)" />}
                  {productForm.is_available ? 'Available in store' : 'Hidden from store'}
                </label>
              </div>

              {/* Image upload */}
              <div className="form-group">
                <label className="form-label">Product Images * <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' }}>(JPEG / PNG / WebP, max 5MB each)</span></label>
                <div
                  onClick={() => imageInputRef.current?.click()}
                  style={{ border: '2px dashed var(--color-border)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-surface)', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <ImagePlus size={24} color="var(--color-blue)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark)', marginBottom: '4px' }}>Click to upload images</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>First image will be used as the primary photo</div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleProductImageSelect}
                  />
                </div>

                {/* Image previews */}
                {productImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                    {productImages.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: idx === 0 ? '2px solid var(--color-blue)' : '1px solid var(--color-border)', flexShrink: 0 }}>
                        <img src={img.preview || img.url} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(23,42,114,0.85)', color: '#fff', fontSize: '9px', fontWeight: 700, textAlign: 'center', padding: '2px' }}>MAIN</div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeProductImage(idx)}
                          style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(220,38,38,0.9)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {/* Add more button */}
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--color-text-muted)', gap: '4px', fontSize: '11px' }}
                    >
                      <Plus size={18} />
                      Add more
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowProductModal(false)} disabled={productSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={productSaving}>
                  {productSaving ? (
                    <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', verticalAlign: 'middle', marginRight: '6px' }} />
                    {editingProduct ? 'Saving changes...' : 'Adding product...'}</>
                  ) : (
                    <>{editingProduct ? <><CheckCircle size={15} /> Save Changes</> : <><Plus size={15} /> Add Product</>}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────── */}
      {deleteConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,30,0.55)', backdropFilter: 'blur(4px)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => !deleting && setDeleteConfirm(null)}
        >
          <div
            style={{ background: 'var(--color-white)', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '56px', height: '56px', background: '#fff1f2', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={24} color="#E11D48" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-dark)' }}>Delete Product?</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--color-dark)' }}>"{deleteConfirm.name}"</strong>?
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', marginBottom: '28px' }}>
              This action cannot be undone. Existing orders referencing this product will remain safe.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: '#E11D48', color: '#fff', border: 'none', cursor: 'pointer', padding: '10px' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
