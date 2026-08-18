import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Receipt,
  Plus, Search, Trash2, TrendingUp, LogOut, ShieldCheck, RefreshCw,
  ToggleLeft, ToggleRight, Zap, MessageSquare, MailOpen, Mail,
  Edit2, Eye, EyeOff, X, ImagePlus, Star, CheckCircle, AlertTriangle,
  SlidersHorizontal, DollarSign, Calendar, Sun, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllOrders, updateOrderStatus, getAllCoupons, createCoupon, toggleCoupon, deleteCoupon,
  getContactSubmissions, markContactRead, getAdminProducts, createProduct, updateProduct, deleteProduct,
  toggleProductAvailability, toggleProductFeatured, getOfflineSales, createOfflineSale, updateOfflineSale, deleteOfflineSale
} from '../services/api';
import CopyButton from '../components/ui/CopyButton';
import { useTheme } from '../context/ThemeContext';




export default function Admin() {
  const { isDark, toggleTheme } = useTheme();
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

  // Offline sales state
  const [offlineSales, setOfflineSales] = useState([]);
  const [loadingOfflineSales, setLoadingOfflineSales] = useState(false);
  const [offlineSearch, setOfflineSearch] = useState('');
  const [offlineDateFilter, setOfflineDateFilter] = useState('all');
  const [offlineCategoryFilter, setOfflineCategoryFilter] = useState('all');
  const [overviewChannelFilter, setOverviewChannelFilter] = useState('all'); // 'all' | 'online' | 'offline'
  const [offlineCustomStart, setOfflineCustomStart] = useState('');
  const [offlineCustomEnd, setOfflineCustomEnd] = useState('');
  const [offlineSort, setOfflineSort] = useState('newest');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [editingOfflineSale, setEditingOfflineSale] = useState(null);
  const [offlineSaving, setOfflineSaving] = useState(false);
  const [offlineFormError, setOfflineFormError] = useState('');
  const [deleteOfflineConfirm, setDeleteOfflineConfirm] = useState(null);
  const [deletingOffline, setDeletingOffline] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [pinOrdersDash, setPinOrdersDash] = useState(true);
  const [pinOfflineDash, setPinOfflineDash] = useState(true);

  const EMPTY_OFFLINE_FORM = {
    customer_name: '',
    order_date: new Date().toISOString().split('T')[0],
    frame_name: '',
    category: 'photo-frames',
    cost_price: '',
    sold_price: '',
    notes: '',
    photo_url: '',
  };
  const [offlineForm, setOfflineForm] = useState(EMPTY_OFFLINE_FORM);
  const [offlineImageFile, setOfflineImageFile] = useState(null);
  const [offlineImagePreview, setOfflineImagePreview] = useState('');
  const offlineFileInputRef = useRef(null);

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

  // Load offline sales from Supabase / localStorage
  const loadOfflineSales = async () => {
    setLoadingOfflineSales(true);
    const data = await getOfflineSales();
    setOfflineSales(data);
    setLoadingOfflineSales(false);
  };

  useEffect(() => {
    if (isAdminAuth) {
      loadOrders();
      loadProducts();
      loadOfflineSales();

      const handleLiveOrder = () => loadOrders();
      const handleOfflineUpdate = () => loadOfflineSales();

      window.addEventListener('everframe_order_updated', handleLiveOrder);
      window.addEventListener('everframe_new_order', handleLiveOrder);
      window.addEventListener('everframe_offline_sale_updated', handleOfflineUpdate);
      window.addEventListener('storage', handleLiveOrder);
      window.addEventListener('storage', handleOfflineUpdate);

      return () => {
        window.removeEventListener('everframe_order_updated', handleLiveOrder);
        window.removeEventListener('everframe_new_order', handleLiveOrder);
        window.removeEventListener('everframe_offline_sale_updated', handleOfflineUpdate);
        window.removeEventListener('storage', handleLiveOrder);
        window.removeEventListener('storage', handleOfflineUpdate);
      };
    }
  }, [isAdminAuth]);

  // Load coupons/contacts/products/offline sales when tab is opened
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
    if (isAdminAuth && tab === 'offline-sales') {
      loadOfflineSales();
    }
  }, [isAdminAuth, tab]);

  // --- Offline Sales Handlers ---
  const openAddOfflineSale = () => {
    setEditingOfflineSale(null);
    setOfflineForm({
      ...EMPTY_OFFLINE_FORM,
      order_date: new Date().toISOString().split('T')[0],
    });
    setOfflineImageFile(null);
    setOfflineImagePreview('');
    setOfflineFormError('');
    setShowOfflineModal(true);
  };

  const openEditOfflineSale = (sale) => {
    setEditingOfflineSale(sale);
    setOfflineForm({
      customer_name: sale.customer_name || '',
      order_date: sale.order_date || new Date().toISOString().split('T')[0],
      frame_name: sale.frame_name || '',
      category: sale.category || 'photo-frames',
      cost_price: sale.cost_price !== undefined && sale.cost_price !== null ? sale.cost_price.toString() : '',
      sold_price: sale.sold_price !== undefined && sale.sold_price !== null ? sale.sold_price.toString() : '',
      notes: sale.notes || '',
      photo_url: sale.photo_url || '',
    });
    setOfflineImageFile(null);
    setOfflineImagePreview(sale.photo_url || '');
    setOfflineFormError('');
    setShowOfflineModal(true);
  };

  const handleOfflineImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid image format. JPG, JPEG, PNG, and WebP are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size too large (max 5MB)');
      return;
    }
    setOfflineImageFile(file);
    setOfflineImagePreview(URL.createObjectURL(file));
  };

  const removeOfflineImage = () => {
    if (offlineImagePreview && offlineImageFile) {
      URL.revokeObjectURL(offlineImagePreview);
    }
    setOfflineImageFile(null);
    setOfflineImagePreview('');
    setOfflineForm(f => ({ ...f, photo_url: '' }));
    if (offlineFileInputRef.current) offlineFileInputRef.current.value = '';
  };

  const validateOfflineForm = () => {
    if (!offlineForm.customer_name.trim()) return 'Customer Name is required.';
    if (!offlineForm.order_date) return 'Order Date is required.';
    if (!offlineForm.frame_name.trim()) return 'Frame Name is required.';
    if (offlineForm.cost_price === '' || isNaN(parseFloat(offlineForm.cost_price)) || parseFloat(offlineForm.cost_price) < 0) {
      return 'Cost Price must be a valid non-negative number.';
    }
    if (offlineForm.sold_price === '' || isNaN(parseFloat(offlineForm.sold_price)) || parseFloat(offlineForm.sold_price) < 0) {
      return 'Sold Price must be a valid non-negative number.';
    }
    return '';
  };

  const handleSaveOfflineSale = async (e) => {
    e.preventDefault();
    const err = validateOfflineForm();
    if (err) {
      setOfflineFormError(err);
      return;
    }
    setOfflineFormError('');
    setOfflineSaving(true);

    if (editingOfflineSale) {
      const result = await updateOfflineSale(editingOfflineSale.id, offlineForm, offlineImageFile);
      setOfflineSaving(false);
      if (result.success) {
        toast.success(`Offline sale for "${offlineForm.customer_name}" updated!`, {
          position: 'bottom-right',
          style: { background: '#172A72', color: '#fff', borderRadius: '8px' }
        });
        setShowOfflineModal(false);
        loadOfflineSales();
      } else {
        setOfflineFormError(result.error || 'Failed to update offline sale.');
      }
    } else {
      const result = await createOfflineSale(offlineForm, offlineImageFile);
      setOfflineSaving(false);
      if (result.success) {
        toast.success(`Offline sale saved for "${offlineForm.customer_name}"!`, {
          position: 'bottom-right',
          style: { background: '#16a34a', color: '#fff', borderRadius: '8px' }
        });
        setShowOfflineModal(false);
        loadOfflineSales();
      } else {
        setOfflineFormError(result.error || 'Failed to save offline sale.');
      }
    }
  };

  const handleConfirmDeleteOfflineSale = async () => {
    if (!deleteOfflineConfirm) return;
    setDeletingOffline(true);
    const result = await deleteOfflineSale(deleteOfflineConfirm.id);
    setDeletingOffline(false);
    if (result.success) {
      setOfflineSales(prev => prev.filter(s => String(s.id) !== String(deleteOfflineConfirm.id)));
      toast.success('Offline sale deleted.', {
        position: 'bottom-right',
        style: { background: '#dc2626', color: '#fff', borderRadius: '8px' }
      });
    } else {
      toast.error('Failed to delete offline sale.');
    }
    setDeleteOfflineConfirm(null);
  };


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



  // Derived stats from real orders and offline sales
  const onlineRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const offlineRevenue = offlineSales.reduce((sum, s) => sum + (parseFloat(s.sold_price) || 0), 0);
  const totalSales = onlineRevenue + offlineRevenue;
  const totalOfflineProfit = offlineSales.reduce((sum, s) => sum + (parseFloat(s.profit) || 0), 0);
  const uniqueCustomers = [...new Set(orders.map(o => o.customer_email).filter(Boolean))];

  // Filtered & sorted offline sales for Admin table
  const filteredOfflineSales = offlineSales
    .filter(s => {
      const q = offlineSearch.trim().toLowerCase();
      const matchSearch = !q ||
        (s.customer_name || '').toLowerCase().includes(q) ||
        (s.frame_name || '').toLowerCase().includes(q);

      const matchCategory = offlineCategoryFilter === 'all' || s.category === offlineCategoryFilter;

      let matchDate = true;
      if (offlineDateFilter !== 'all' && s.order_date) {
        const saleDateStr = s.order_date;
        const now = new Date();
        now.setHours(0,0,0,0);
        const todayStr = now.toISOString().split('T')[0];

        if (offlineDateFilter === 'today') {
          matchDate = saleDateStr === todayStr;
        } else if (offlineDateFilter === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchDate = new Date(saleDateStr) >= weekAgo;
        } else if (offlineDateFilter === 'month') {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchDate = new Date(saleDateStr) >= monthAgo;
        } else if (offlineDateFilter === 'custom') {
          if (offlineCustomStart) {
            matchDate = matchDate && s.order_date >= offlineCustomStart;
          }
          if (offlineCustomEnd) {
            matchDate = matchDate && s.order_date <= offlineCustomEnd;
          }
        }
      }
      return matchSearch && matchDate && matchCategory;
    })
    .sort((a, b) => {
      if (offlineSort === 'oldest') {
        return new Date(a.order_date || a.created_at) - new Date(b.order_date || b.created_at);
      }
      if (offlineSort === 'sold-desc') {
        return (parseFloat(b.sold_price) || 0) - (parseFloat(a.sold_price) || 0);
      }
      if (offlineSort === 'profit-desc') {
        return (parseFloat(b.profit) || 0) - (parseFloat(a.profit) || 0);
      }
      return new Date(b.order_date || b.created_at) - new Date(a.order_date || a.created_at);
    });

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
            <button className="btn btn-outline" onClick={() => { loadOrders(); loadOfflineSales(); }} title="Refresh data from database">
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
                { id: 'overview', icon: LayoutDashboard, label: 'Overview', color: '#216DB2', badgeBg: 'rgba(33, 109, 178, 0.12)' },
                { id: 'orders', icon: ShoppingCart, label: `Live Orders (${orders.length})`, color: '#3D3A86', badgeBg: 'rgba(61, 58, 134, 0.12)' },
                { id: 'offline-sales', icon: Receipt, label: `Offline Sales (${offlineSales.length})`, color: '#16a34a', badgeBg: 'rgba(22, 163, 74, 0.12)' },
                { id: 'products', icon: Package, label: `Products (${productList.length})`, color: '#68408D', badgeBg: 'rgba(104, 64, 141, 0.12)' },
                { id: 'customers', icon: Users, label: `Customers (${uniqueCustomers.length})`, color: '#B94F8C', badgeBg: 'rgba(185, 79, 140, 0.12)' },
                { id: 'coupons', icon: Tag, label: 'Coupons', color: '#D96B91', badgeBg: 'rgba(217, 107, 145, 0.12)' },
                { id: 'contacts', icon: MessageSquare, label: `Messages (${contactMessages.filter(m => !m.is_read).length} unread)`, color: '#0284c7', badgeBg: 'rgba(2, 132, 199, 0.12)' },
              ].map(item => (
                <a
                  key={item.id}
                  href="#"
                  className={tab === item.id ? 'active' : ''}
                  onClick={e => { e.preventDefault(); setTab(item.id); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontWeight: tab === item.id ? 700 : 600,
                    color: tab === item.id ? 'var(--color-primary-navy)' : 'var(--color-text-muted)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: tab === item.id ? item.color : (isDark ? 'rgba(255,255,255,0.06)' : item.badgeBg),
                    color: tab === item.id ? '#fff' : item.color,
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}>
                    <item.icon size={15} />
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </a>
              ))}

              {/* Dark Mode Toggle Switch Widget */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Appearance
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-dark)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isDark ? <Moon size={15} color="#c084fc" /> : <Sun size={15} color="#f59e0b" />}
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                  <span style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '20px',
                    background: isDark ? '#68408D' : '#cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px',
                    transition: 'background 0.2s'
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#fff',
                      transform: isDark ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.2s ease'
                    }} />
                  </span>
                </button>
              </div>

              <Link to="/" style={{ color: 'var(--color-text-muted)', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ← Exit to Store
              </Link>
            </nav>
          </div>

          {/* Content */}
          <div className="account-content">

            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <div>
                {/* Header & Sales Channel Filter Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0 }}>Dashboard Overview</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '3px', margin: 0 }}>
                      {overviewChannelFilter === 'all' && 'Viewing combined stats for both online store orders and offline sales.'}
                      {overviewChannelFilter === 'online' && 'Viewing stats strictly for customer online store orders.'}
                      {overviewChannelFilter === 'offline' && 'Viewing stats strictly for recorded offline sales.'}
                    </p>
                  </div>

                  {/* Channel Switcher */}
                  <div style={{ display: 'inline-flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '4px', gap: '4px', boxShadow: 'var(--shadow-sm)' }}>
                    <button
                      type="button"
                      onClick={() => setOverviewChannelFilter('all')}
                      style={{
                        padding: '7px 16px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: overviewChannelFilter === 'all' ? 'linear-gradient(135deg, #172A72 0%, #3D3A86 100%)' : 'transparent',
                        color: overviewChannelFilter === 'all' ? '#fff' : 'var(--color-text-muted)',
                        boxShadow: overviewChannelFilter === 'all' ? '0 4px 12px rgba(23, 42, 114, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🌐 All Sales
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewChannelFilter('online')}
                      style={{
                        padding: '7px 16px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: overviewChannelFilter === 'online' ? 'linear-gradient(135deg, #216DB2 0%, #3D3A86 100%)' : 'transparent',
                        color: overviewChannelFilter === 'online' ? '#fff' : 'var(--color-text-muted)',
                        boxShadow: overviewChannelFilter === 'online' ? '0 4px 12px rgba(33, 109, 178, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💻 Online Sales
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewChannelFilter('offline')}
                      style={{
                        padding: '7px 16px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: overviewChannelFilter === 'offline' ? 'linear-gradient(135deg, #3D3A86 0%, #68408D 100%)' : 'transparent',
                        color: overviewChannelFilter === 'offline' ? '#fff' : 'var(--color-text-muted)',
                        boxShadow: overviewChannelFilter === 'offline' ? '0 4px 12px rgba(61, 58, 134, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🧾 Offline Sales
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                {(() => {
                  const displayedRevenue = overviewChannelFilter === 'all'
                    ? totalSales
                    : overviewChannelFilter === 'online'
                    ? onlineRevenue
                    : offlineRevenue;

                  const displayedRevenueSub = overviewChannelFilter === 'all'
                    ? `Online: NPR ${onlineRevenue.toLocaleString()} + Offline: NPR ${offlineRevenue.toLocaleString()}`
                    : overviewChannelFilter === 'online'
                    ? `Revenue from ${orders.length} website orders`
                    : `Revenue from ${offlineSales.length} recorded offline sales`;

                  const displayedOrdersCount = overviewChannelFilter === 'all'
                    ? (orders.length + offlineSales.length)
                    : overviewChannelFilter === 'online'
                    ? orders.length
                    : offlineSales.length;

                  const displayedOrdersLabel = overviewChannelFilter === 'all'
                    ? 'Total Transactions'
                    : overviewChannelFilter === 'online'
                    ? 'Online Orders'
                    : 'Offline Sales';

                  const displayedOrdersSub = overviewChannelFilter === 'all'
                    ? `${orders.length} online + ${offlineSales.length} offline`
                    : overviewChannelFilter === 'online'
                    ? `${orders.filter(o => o.order_status === 'Order Placed').length} pending website orders`
                    : `from recorded offline sales`;

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                      {[
                        {
                          label: overviewChannelFilter === 'all' ? 'Total Revenue' : overviewChannelFilter === 'online' ? 'Online Revenue' : 'Offline Revenue',
                          val: `NPR ${displayedRevenue.toLocaleString()}`,
                          icon: TrendingUp,
                          color: overviewChannelFilter === 'offline' ? '#68408D' : overviewChannelFilter === 'online' ? '#216DB2' : '#172A72',
                          sub: displayedRevenueSub
                        },
                        {
                          label: displayedOrdersLabel,
                          val: displayedOrdersCount,
                          icon: ShoppingCart,
                          color: '#3D3A86',
                          sub: displayedOrdersSub
                        },
                        {
                          label: 'Products',
                          val: productList.length,
                          icon: Package,
                          color: '#68408D',
                          sub: 'in catalog'
                        },
                        {
                          label: overviewChannelFilter === 'offline' ? 'Offline Profit' : 'Customers',
                          val: overviewChannelFilter === 'offline' ? `NPR ${totalOfflineProfit.toLocaleString()}` : uniqueCustomers.length,
                          icon: overviewChannelFilter === 'offline' ? DollarSign : Users,
                          color: overviewChannelFilter === 'offline' ? '#16a34a' : '#B94F8C',
                          sub: overviewChannelFilter === 'offline' ? `from ${offlineSales.length} recorded sales` : 'unique accounts'
                        },
                      ].map(stat => (
                        <div key={stat.label} className="admin-stat-card animate-fade-in" style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px 16px', border: '1px solid var(--color-border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                            <stat.icon size={18} color={stat.color} />
                          </div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-primary-navy)', marginBottom: '4px' }}>{stat.val}</div>
                          <div style={{ fontSize: '11.5px', color: stat.color, fontWeight: 500 }}>{stat.sub}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Offline Sales Summary Widget (Shown when ALL or OFFLINE selected) */}
                {overviewChannelFilter !== 'online' && (
                  <div style={{ background: 'linear-gradient(135deg, #172A72 0%, #3D3A86 45%, #68408D 100%)', borderRadius: '16px', padding: '24px 28px', color: '#fff', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 12px 32px rgba(61, 58, 134, 0.25)' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={15} color="#93C5FD" /> Offline Sales Summary
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                        {offlineSales.length} Offline Sale{offlineSales.length === 1 ? '' : 's'} Recorded · Total Revenue: NPR {offlineRevenue.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#E2E8F0', marginTop: '6px' }}>
                        Cumulative Net Profit from offline channels: <strong style={{ color: '#4ADE80', fontWeight: 800 }}>NPR {totalOfflineProfit.toLocaleString()}</strong>
                      </div>
                    </div>
                    <button
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #B94F8C 0%, #D96B91 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 22px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(185, 79, 140, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onClick={() => { setTab('offline-sales'); openAddOfflineSale(); }}
                    >
                      <Plus size={16} /> Record Offline Sale
                    </button>
                  </div>
                )}

                {/* Recent Sales & Orders Feed */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700 }}>
                    {overviewChannelFilter === 'all' && 'Recent Sales & Orders'}
                    {overviewChannelFilter === 'online' && 'Recent Online Orders'}
                    {overviewChannelFilter === 'offline' && 'Recent Offline Sales'}
                  </h3>
                  <span className="live-badge-pulse" style={{ fontSize: '12px', background: '#eef9ee', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }}></span> Live Data
                  </span>
                </div>

                {(() => {
                  const filteredRecentFeed = [
                    ...(overviewChannelFilter === 'offline' ? [] : orders.map(o => ({
                      type: 'online',
                      id: o.id || o.order_number,
                      title: `#${o.order_number || o.id} — ${o.customer_name}`,
                      sub: `${o.customer_email || o.customer_phone || ''} · ${o.payment_method || 'COD'}`,
                      date: o.created_at,
                      total: o.total || 0,
                      status: o.order_status,
                      raw: o,
                    }))),
                    ...(overviewChannelFilter === 'online' ? [] : offlineSales.map(s => ({
                      type: 'offline',
                      id: s.id,
                      title: `Offline Sale — ${s.customer_name}`,
                      sub: `Frame: ${s.frame_name} · Cost: NPR ${(s.cost_price || 0).toLocaleString()} · Profit: NPR ${(s.profit || 0).toLocaleString()}`,
                      date: s.order_date || s.created_at,
                      total: s.sold_price || 0,
                      status: 'Recorded',
                      raw: s,
                    }))),
                  ]
                  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                  if (loadingOrders || loadingOfflineSales) {
                    return <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px 0' }}>Loading sales data...</p>;
                  }

                  if (filteredRecentFeed.length === 0) {
                    return <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px 0' }}>No {overviewChannelFilter === 'all' ? 'sales' : overviewChannelFilter} recorded yet.</p>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredRecentFeed.slice(0, 7).map((item, idx) => (
                        <div key={item.id || idx} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-white)' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{item.title}</span>
                              {item.type === 'online' && <CopyButton text={item.raw.order_number || item.raw.id} />}
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: item.type === 'online' ? '#e0f2fe' : '#dcfce7',
                                color: item.type === 'online' ? '#0369a1' : '#15803d',
                                letterSpacing: '0.04em'
                              }}>
                                {item.type === 'online' ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </div>
                            <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                              {item.sub} · {item.date ? new Date(item.date).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--color-primary-navy)' }}>NPR {(item.total || 0).toLocaleString()}</div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#fff',
                              background: item.type === 'online' ? (statusColor[item.status] || '#216DB2') : '#16a34a',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              display: 'inline-block',
                              marginTop: '4px'
                            }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}


            {/* LIVE ORDERS TAB */}
            {tab === 'orders' && (
              <div>
                {/* ── STICKY DASHBOARD ZONE ── */}
                <div style={{
                  position: pinOrdersDash ? 'sticky' : 'relative',
                  top: pinOrdersDash ? '0px' : 'auto',
                  zIndex: 20,
                  background: 'var(--color-white)',
                  paddingBottom: '16px',
                  marginBottom: '8px',
                  borderBottom: pinOrdersDash ? '1px solid var(--color-border-light)' : 'none',
                }}>
                  {/* Tab header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0 }}>Live Order Management</h2>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '3px', margin: 0 }}>Real-time overview of all online store orders.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', background: '#eef9ee', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>● Live Data</span>
                      <button
                        type="button"
                        onClick={() => setPinOrdersDash(p => !p)}
                        title={pinOrdersDash ? 'Unpin dashboard (scroll with page)' : 'Pin dashboard (stays at top)'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '5px 12px', fontSize: '12px', fontWeight: 700,
                          borderRadius: '8px', border: `1.5px solid ${pinOrdersDash ? '#216DB2' : 'var(--color-border)'}`,
                          background: pinOrdersDash ? 'rgba(33,109,178,0.1)' : 'transparent',
                          color: pinOrdersDash ? '#216DB2' : 'var(--color-text-muted)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        📌 {pinOrdersDash ? 'Dashboard Pinned' : 'Pin Dashboard'}
                      </button>
                      <button className="btn btn-outline" onClick={loadOrders} style={{ fontSize: '12px', padding: '6px 12px' }}>
                        <RefreshCw size={14} /> Refresh
                      </button>
                    </div>
                  </div>

                  {/* Dashboard stats */}
                  {(() => {
                    const totalOnlineRev = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
                    const totalDelivery  = orders.reduce((s, o) => s + (parseFloat(o.delivery_charge) || 0), 0);
                    const avgOrder       = orders.length ? totalOnlineRev / orders.length : 0;
                    const statusCounts   = ['Order Placed','Confirmed','Preparing','Shipped','Delivered']
                      .map(st => ({ st, count: orders.filter(o => o.order_status === st).length }));
                    const paymentBreakdown = orders.reduce((acc, o) => {
                      const pm = o.payment_method || 'COD';
                      acc[pm] = (acc[pm] || 0) + 1;
                      return acc;
                    }, {});
                    const topCity = (() => {
                      const cc = orders.reduce((a,o) => { if(o.city){a[o.city]=(a[o.city]||0)+1;} return a;},{});
                      return Object.entries(cc).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
                    })();
                    return (
                      <div>
                        {/* Hero banner */}
                        <div style={{ background: 'linear-gradient(135deg, #172A72 0%, #216DB2 50%, #3D3A86 100%)', borderRadius: '14px', padding: '20px 24px', color: '#fff', marginBottom: '12px', boxShadow: '0 8px 24px rgba(23,42,114,0.22)', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>💻 Online Sales Overview</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>NPR {totalOnlineRev.toLocaleString()}</div>
                            <div style={{ fontSize: '12.5px', color: '#E2E8F0', marginTop: '3px' }}>{orders.length} orders · Avg NPR {Math.round(avgOrder).toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#FCD34D' }}>{orders.filter(o=>o.order_status==='Order Placed').length}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>PENDING</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#4ADE80' }}>{orders.filter(o=>o.order_status==='Delivered').length}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>DELIVERED</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#F472B6' }}>NPR {totalDelivery.toLocaleString()}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>DELIVERY FEES</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#A5F3FC' }}>{topCity}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>TOP CITY</div></div>
                          </div>
                        </div>
                        {/* Status cards row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '12px' }}>
                          {statusCounts.map(({ st, count }) => (
                            <div key={st} className="admin-stat-card" style={{ borderRadius: '10px', padding: '12px 10px', border: `1.5px solid ${orderStatusFilter === st ? (statusColor[st] || '#216DB2') : 'var(--color-border-light)'}`, textAlign: 'center', cursor: 'pointer', transition: 'all 0.18s' }} onClick={() => setOrderStatusFilter(st)}>
                              <div style={{ fontSize: '22px', fontWeight: 900, color: statusColor[st] || '#216DB2' }}>{count}</div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{st}</div>
                            </div>
                          ))}
                        </div>
                        {/* Payment + search + filter row (all sticky together) */}
                        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--color-border-light)' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Payment:</span>
                            {Object.entries(paymentBreakdown).map(([pm, cnt]) => (
                              <span key={pm} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: 'var(--color-dark)' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: pm === 'COD' ? '#F59E0B' : pm === 'eSewa' ? '#10B981' : pm === 'Khalti' ? '#8B5CF6' : '#3B82F6', flexShrink: 0 }} />
                                {pm}: <span style={{ color: 'var(--color-primary-navy)', fontWeight: 900 }}>{cnt}</span>
                              </span>
                            ))}
                            {Object.keys(paymentBreakdown).length === 0 && <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>No orders yet</span>}
                          </div>
                          {/* Search + filter chips */}
                          <div className="search-bar" style={{ marginBottom: '10px' }}>
                            <Search size={15} color="var(--color-text-muted)" />
                            <input type="text" placeholder="Search by customer name, email, phone or order ID..." value={orderSearchQuery} onChange={e => setOrderSearchQuery(e.target.value)} />
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginRight: '4px' }}>Status:</span>
                            {['All', 'Order Placed', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'].map(st => (
                              <button key={st} className={`filter-chip ${orderStatusFilter === st ? 'active' : ''}`} style={{ fontSize: '11.5px', padding: '4px 12px' }} onClick={() => setOrderStatusFilter(st)}>{st}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>{/* end sticky dashboard */}

                {/* ── ORDERS LIST (normal page scroll) ── */}
                <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {loadingOrders ? (
                    <p style={{ color: 'var(--color-text-muted)', padding: '40px 0', textAlign: 'center' }}>Loading orders...</p>
                  ) : filteredOrders.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                      <div className="empty-state-icon"><ShoppingCart size={48} strokeWidth={1} /></div>
                      <h3>No matching orders found</h3>
                      <p>Try clearing your search or status filters.</p>
                      <button className="btn btn-outline btn-sm" onClick={() => { setOrderStatusFilter('All'); setOrderSearchQuery(''); }}>Clear Filters</button>
                    </div>
                  ) : (
                    filteredOrders.map(order => {
                      const num = order.order_number || order.id;
                      return (
                        <div key={order.id || num} style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '20px', background: 'var(--color-white)', boxShadow: 'var(--shadow-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-navy)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span>Order #{num}</span>
                                <CopyButton text={num} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: statusColor[order.order_status] || '#216DB2', padding: '3px 10px', borderRadius: '12px' }}>{order.order_status}</span>
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
                              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Delivery: NPR {(order.delivery_charge || 0).toLocaleString()}</div>
                            </div>
                          </div>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-dark)' }}>Update Status:</span>
                            {['Order Placed', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'].map(st => (
                              <button key={st} className={`btn btn-sm ${order.order_status === st ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '11.5px', padding: '5px 12px' }} onClick={() => handleStatusChange(order, st)}>{st}</button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>{/* end orders list */}
              </div>
            )}
       
            {/* OFFLINE SALES TAB */}
            {tab === 'offline-sales' && (
              <div>
                {/* ── STICKY DASHBOARD ZONE ── */}
                <div style={{
                  position: pinOfflineDash ? 'sticky' : 'relative',
                  top: pinOfflineDash ? '0px' : 'auto',
                  zIndex: 20,
                  background: 'var(--color-white)',
                  paddingBottom: '16px',
                  marginBottom: '8px',
                  borderBottom: pinOfflineDash ? '1px solid var(--color-border-light)' : 'none',
                }}>
                  {/* Tab header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0 }}>Offline Sales</h2>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '3px', margin: 0 }}>Record and manage sales made outside the website.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setPinOfflineDash(p => !p)}
                        title={pinOfflineDash ? 'Unpin dashboard' : 'Pin dashboard'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '5px 12px', fontSize: '12px', fontWeight: 700,
                          borderRadius: '8px', border: `1.5px solid ${pinOfflineDash ? '#3D3A86' : 'var(--color-border)'}`,
                          background: pinOfflineDash ? 'rgba(61,58,134,0.1)' : 'transparent',
                          color: pinOfflineDash ? '#3D3A86' : 'var(--color-text-muted)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        📌 {pinOfflineDash ? 'Dashboard Pinned' : 'Pin Dashboard'}
                      </button>
                      <button className="btn btn-outline" onClick={loadOfflineSales} style={{ fontSize: '13px' }}>
                        <RefreshCw size={14} /> Refresh
                      </button>
                      <button className="btn btn-primary" onClick={openAddOfflineSale}>
                        <Plus size={16} /> + Add Offline Sale
                      </button>
                    </div>
                  </div>

                  {/* Dashboard stats */}
                  {offlineSales.length > 0 && (() => {
                    const totalRev     = offlineSales.reduce((s, x) => s + (parseFloat(x.sold_price) || 0), 0);
                    const totalCost    = offlineSales.reduce((s, x) => s + (parseFloat(x.cost_price) || 0), 0);
                    const totalProfit  = offlineSales.reduce((s, x) => s + (parseFloat(x.profit) || 0), 0);
                    const avgSold      = offlineSales.length ? totalRev / offlineSales.length : 0;
                    const profitMargin = totalRev ? ((totalProfit / totalRev) * 100).toFixed(1) : 0;
                    const categoryMap  = { 'photo-frames':'Photo Frames','wedding-frames':'Wedding Frames','wall-art':'Wall Art','personalized-gifts':'Personalized Gifts','collage-frames':'Collage Frames','custom':'Custom / Other' };
                    const catBreakdown = offlineSales.reduce((acc, s) => { const k = categoryMap[s.category]||s.category||'Other'; acc[k]=(acc[k]||0)+1; return acc; }, {});
                    const topCat       = Object.entries(catBreakdown).sort((a,b)=>b[1]-a[1])[0];
                    const todayStr     = new Date().toISOString().split('T')[0];
                    const todaySales   = offlineSales.filter(s => s.order_date === todayStr);
                    const todayRev     = todaySales.reduce((s,x) => s+(parseFloat(x.sold_price)||0), 0);
                    const thisMonth    = new Date().toISOString().slice(0,7);
                    const monthSales   = offlineSales.filter(s => (s.order_date||'').startsWith(thisMonth));
                    const monthRev     = monthSales.reduce((s,x) => s+(parseFloat(x.sold_price)||0), 0);
                    const catColors    = ['#216DB2','#3D3A86','#68408D','#B94F8C','#16a34a','#0284c7'];
                    return (
                      <div>
                        <div style={{ background: 'linear-gradient(135deg, #172A72 0%, #3D3A86 45%, #68408D 100%)', borderRadius: '14px', padding: '20px 24px', color: '#fff', marginBottom: '12px', boxShadow: '0 8px 24px rgba(61,58,134,0.22)', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>🧾 Offline Sales Overview</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>NPR {totalRev.toLocaleString()}</div>
                            <div style={{ fontSize: '12.5px', color: '#E2E8F0', marginTop: '3px' }}>{offlineSales.length} sale{offlineSales.length!==1?'s':''} · Avg NPR {Math.round(avgSold).toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#4ADE80' }}>NPR {totalProfit.toLocaleString()}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>NET PROFIT</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#FCD34D' }}>{profitMargin}%</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>MARGIN</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#F472B6' }}>NPR {todayRev.toLocaleString()}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>TODAY</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '20px', fontWeight: 800, color: '#A5F3FC' }}>NPR {monthRev.toLocaleString()}</div><div style={{ fontSize: '10px', color: '#93C5FD', fontWeight: 700 }}>THIS MONTH</div></div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px', marginBottom: '12px' }}>
                          {[
                            { label: 'Total Revenue', val: `NPR ${totalRev.toLocaleString()}`,    color: '#216DB2', icon: '💰' },
                            { label: 'Total Cost',    val: `NPR ${totalCost.toLocaleString()}`,   color: '#B94F8C', icon: '📦' },
                            { label: 'Net Profit',    val: `NPR ${totalProfit.toLocaleString()}`, color: '#16a34a', icon: '📈' },
                            { label: 'Today Sales',   val: todaySales.length,                     color: '#3D3A86', icon: '📅' },
                            { label: 'Month Sales',   val: monthSales.length,                     color: '#0284c7', icon: '🗓️' },
                            { label: 'Top Category',  val: topCat ? topCat[0] : '—',             color: '#68408D', icon: '🏆' },
                          ].map(card => (
                            <div key={card.label} className="admin-stat-card" style={{ borderRadius: '10px', padding: '12px 12px', border: '1px solid var(--color-border-light)' }}>
                              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{card.icon}</div>
                              <div style={{ fontSize: '16px', fontWeight: 900, color: card.color }}>{card.val}</div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>{card.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '12px 16px', border: '1px solid var(--color-border-light)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>By Category:</span>
                          {Object.entries(catBreakdown).sort((a,b)=>b[1]-a[1]).map(([cat, cnt], i) => (
                            <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--color-dark)' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: catColors[i%catColors.length], flexShrink: 0 }} />
                              {cat} <span style={{ color: catColors[i%catColors.length], fontWeight: 900 }}>({cnt})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>{/* end sticky dashboard */}

                {/* ── SALES LIST ── */}
                <div style={{ paddingTop: '8px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px', background: 'var(--color-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-light)', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ flex: '1 1 220px', position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Search customer or frame..."
                        value={offlineSearch}
                        onChange={e => setOfflineSearch(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
                      />
                    </div>

                    {/* Category Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={15} color="var(--color-text-muted)" />
                      <select
                        className="form-input"
                        value={offlineCategoryFilter}
                        onChange={e => setOfflineCategoryFilter(e.target.value)}
                        style={{ width: 'auto', fontSize: '13px' }}
                      >
                        <option value="all">All Categories</option>
                        <option value="photo-frames">Photo Frames</option>
                        <option value="wedding-frames">Wedding Frames</option>
                        <option value="wall-art">Wall Art</option>
                        <option value="personalized-gifts">Personalized Gifts</option>
                        <option value="collage-frames">Collage Frames</option>
                        <option value="custom">Custom / Other</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} color="var(--color-text-muted)" />
                      <select
                        className="form-input"
                        value={offlineDateFilter}
                        onChange={e => setOfflineDateFilter(e.target.value)}
                        style={{ width: 'auto', fontSize: '13px' }}
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Date Range</option>
                      </select>
                    </div>

                    {/* Custom Date Inputs */}
                    {offlineDateFilter === 'custom' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="date"
                          className="form-input"
                          value={offlineCustomStart}
                          onChange={e => setOfflineCustomStart(e.target.value)}
                          style={{ fontSize: '12.5px', padding: '6px 10px' }}
                          title="Start date"
                        />
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>to</span>
                        <input
                          type="date"
                          className="form-input"
                          value={offlineCustomEnd}
                          onChange={e => setOfflineCustomEnd(e.target.value)}
                          style={{ fontSize: '12.5px', padding: '6px 10px' }}
                          title="End date"
                        />
                      </div>
                    )}

                    {/* Sorting */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      <SlidersHorizontal size={15} color="var(--color-text-muted)" />
                      <select
                        className="form-input"
                        value={offlineSort}
                        onChange={e => setOfflineSort(e.target.value)}
                        style={{ width: 'auto', fontSize: '13px' }}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="sold-desc">Highest Sold Price</option>
                        <option value="profit-desc">Highest Profit</option>
                      </select>
                    </div>
                  </div>

                  {/* Offline Sales List / Table */}
                  {loadingOfflineSales ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading offline sales...</div>
                  ) : filteredOfflineSales.length === 0 ? (
                    <div className="empty-state" style={{ background: 'var(--color-white)', borderRadius: '14px', border: '1px dashed var(--color-border)', padding: '48px 24px', textAlign: 'center' }}>
                      <div className="empty-state-icon" style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '6px' }}>
                        {offlineSearch || offlineDateFilter !== 'all' || offlineCategoryFilter !== 'all' ? 'No matching offline sales found' : 'No offline sales yet'}
                      </h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                        {offlineSearch || offlineDateFilter !== 'all' || offlineCategoryFilter !== 'all'
                          ? 'Try clearing your search query or adjusting your category and date filters.'
                          : 'Record your first offline sale to start tracking your complete EverFrame sales.'}
                      </p>
                      <button className="btn btn-primary" onClick={openAddOfflineSale}>
                        <Plus size={16} /> + Add Offline Sale
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-white)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '12px 16px' }}>Date</th>
                            <th style={{ padding: '12px 16px' }}>Customer</th>
                            <th style={{ padding: '12px 16px' }}>Frame</th>
                            <th style={{ padding: '12px 16px' }}>Category</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Cost Price</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Sold Price</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Profit</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Photo</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOfflineSales.map(sale => {
                            const profitVal = parseFloat(sale.profit) || 0;
                            const categoryMap = {
                              'photo-frames': 'Photo Frames',
                              'wedding-frames': 'Wedding Frames',
                              'wall-art': 'Wall Art',
                              'personalized-gifts': 'Personalized Gifts',
                              'collage-frames': 'Collage Frames',
                              'custom': 'Custom / Other',
                            };
                            const catLabel = categoryMap[sale.category] || sale.category || 'Photo Frames';

                            return (
                              <tr key={sale.id} className="admin-table-row" style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.15s' }}>
                                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--color-dark)' }}>
                                  {sale.order_date ? new Date(sale.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
                                  {sale.customer_name}
                                  {sale.notes && (
                                    <div style={{ fontSize: '11.5px', fontWeight: 400, color: 'var(--color-text-muted)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sale.notes}>
                                      📝 {sale.notes}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '14px 16px', fontWeight: 600 }}>{sale.frame_name}</td>
                                <td style={{ padding: '14px 16px' }}>
                                  <span style={{ fontSize: '11.5px', fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '3px 9px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                    {catLabel}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                                  NPR {(parseFloat(sale.cost_price) || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--color-dark)' }}>
                                  NPR {(parseFloat(sale.sold_price) || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: profitVal >= 0 ? '#16a34a' : '#dc2626' }}>
                                  NPR {profitVal.toLocaleString()}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  {sale.photo_url ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPhotoUrl(sale.photo_url)}
                                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                                      title="Click to view photo preview"
                                    >
                                      <img src={sale.photo_url} alt="Frame" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--color-border)' }} />
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '4px 8px', borderRadius: '6px' }}>No photo</span>
                                  )}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => openEditOfflineSale(sale)}>
                                      <Edit2 size={13} /> Edit
                                    </button>
                                    <button className="btn" style={{ padding: '4px 10px', fontSize: '12px', background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', cursor: 'pointer' }} onClick={() => setDeleteOfflineConfirm(sale)}>
                                      <Trash2 size={13} /> Delete
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
                </div>{/* end sales list */}
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

      {/* ── ADD / EDIT OFFLINE SALE MODAL ───────────────────────── */}
      {showOfflineModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(23,42,114,0.45)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => !offlineSaving && setShowOfflineModal(false)}
        >
          <div
            className="admin-modal-anim"
            style={{ background: 'var(--color-white)', borderRadius: '20px', padding: '32px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(23,42,114,0.25)', border: '1px solid var(--color-border-light)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-dark)' }}>
                  {editingOfflineSale ? 'Edit Offline Sale' : 'Add Offline Sale'}
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '2px', margin: 0 }}>
                  {editingOfflineSale ? 'Update offline sale record details.' : 'Record a new sales transaction made outside the website.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOfflineModal(false)}
                disabled={offlineSaving}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {offlineFormError && (
              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {offlineFormError}
              </div>
            )}

            <form onSubmit={handleSaveOfflineSale}>
              {/* Customer Name & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Niva Sharma"
                    value={offlineForm.customer_name}
                    onChange={e => setOfflineForm(f => ({ ...f, customer_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Order Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={offlineForm.order_date}
                    onChange={e => setOfflineForm(f => ({ ...f, order_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Frame Name & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Frame Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder='e.g. Classic Couple Frame'
                    value={offlineForm.frame_name}
                    onChange={e => setOfflineForm(f => ({ ...f, frame_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={offlineForm.category}
                    onChange={e => setOfflineForm(f => ({ ...f, category: e.target.value }))}
                    required
                  >
                    <option value="photo-frames">Photo Frames</option>
                    <option value="wedding-frames">Wedding Frames</option>
                    <option value="wall-art">Wall Art</option>
                    <option value="personalized-gifts">Personalized Gifts</option>
                    <option value="collage-frames">Collage Frames</option>
                    <option value="custom">Custom / Other</option>
                  </select>
                </div>
              </div>

              {/* Cost Price & Sold Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Cost Price (NPR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 1000"
                    value={offlineForm.cost_price}
                    onChange={e => setOfflineForm(f => ({ ...f, cost_price: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sold Price (NPR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 1500"
                    value={offlineForm.sold_price}
                    onChange={e => setOfflineForm(f => ({ ...f, sold_price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Automatic Profit Calculation Display */}
              {(() => {
                const cost = parseFloat(offlineForm.cost_price);
                const sold = parseFloat(offlineForm.sold_price);
                const hasValidNumbers = !isNaN(cost) && !isNaN(sold);
                const profit = hasValidNumbers ? (sold - cost) : 0;
                return (
                  <div style={{
                    background: hasValidNumbers ? (profit >= 0 ? '#f0fdf4' : '#fef2f2') : 'var(--color-surface)',
                    border: `1px solid ${hasValidNumbers ? (profit >= 0 ? '#bbf7d0' : '#fecaca') : 'var(--color-border-light)'}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark)' }}>
                      Automated Profit Calculation:
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: hasValidNumbers ? (profit >= 0 ? '#15803d' : '#dc2626') : 'var(--color-text-muted)' }}>
                      Profit: NPR {hasValidNumbers ? profit.toLocaleString() : '0'}
                    </span>
                  </div>
                );
              })()}

              {/* Frame Photo Upload (Optional) */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Photo of Frame <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' }}>(Optional — JPG, PNG, WebP)</span></label>
                <div
                  onClick={() => offlineFileInputRef.current?.click()}
                  style={{ border: '2px dashed var(--color-border)', borderRadius: '10px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-surface)', transition: 'border-color 0.2s' }}
                >
                  <ImagePlus size={20} color="var(--color-blue)" style={{ margin: '0 auto 6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-dark)' }}>Click to upload frame image</div>
                  <input
                    ref={offlineFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleOfflineImageSelect}
                  />
                </div>

                {/* Photo preview thumbnail */}
                {offlineImagePreview && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                    <img src={offlineImagePreview} alt="Frame Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--color-dark)', flex: 1, fontWeight: 500 }}>
                      {offlineImageFile ? offlineImageFile.name : 'Uploaded frame image'}
                    </span>
                    <button
                      type="button"
                      onClick={removeOfflineImage}
                      style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '12px' }}>(Optional)</span></label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Additional details such as customer requests, delivery information, discount given, etc."
                  value={offlineForm.notes}
                  onChange={e => setOfflineForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowOfflineModal(false)} disabled={offlineSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={offlineSaving}>
                  {offlineSaving ? (
                    <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', verticalAlign: 'middle', marginRight: '6px' }} />
                    {editingOfflineSale ? 'Saving changes...' : 'Saving sale...'}</>
                  ) : (
                    <>{editingOfflineSale ? <><CheckCircle size={15} /> Save Changes</> : <><Plus size={15} /> Save Offline Sale</>}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE OFFLINE SALE CONFIRMATION MODAL ───────────── */}
      {deleteOfflineConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,30,0.55)', backdropFilter: 'blur(4px)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => !deletingOffline && setDeleteOfflineConfirm(null)}
        >
          <div
            style={{ background: 'var(--color-white)', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '56px', height: '56px', background: '#fff1f2', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={24} color="#E11D48" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-dark)' }}>Delete Offline Sale?</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '8px' }}>
              Are you sure you want to delete this offline sale for <strong style={{ color: 'var(--color-dark)' }}>"{deleteOfflineConfirm.customer_name}"</strong>?
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', marginBottom: '28px' }}>
              This action cannot be undone. Online orders will not be affected.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteOfflineConfirm(null)} disabled={deletingOffline}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: '#E11D48', color: '#fff', border: 'none', cursor: 'pointer', padding: '10px' }}
                onClick={handleConfirmDeleteOfflineSale}
                disabled={deletingOffline}
              >
                {deletingOffline ? 'Deleting...' : 'Delete Offline Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO LIGHTBOX PREVIEW MODAL ───────────────────────── */}
      {previewPhotoUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,30,0.85)', backdropFilter: 'blur(6px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={previewPhotoUrl} alt="Frame Full Preview" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }} />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', background: '#fff', color: '#000', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

