import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { products as localProducts } from '../data/products';

// Fetch all products (Supabase database -> Fallback to local products)
export async function getProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localProducts, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return { data: localProducts, source: 'local' };
    }
    return { data, source: 'supabase' };
  } catch {
    return { data: localProducts, source: 'local' };
  }
}

// Create new Order in Supabase with localStorage fallback
export async function createOrder(orderPayload) {
  const fallbackNumber = `EF${Date.now().toString().slice(-6)}`;
  const custName = orderPayload.customer_name || orderPayload.name || 'Valued Customer';
  const custPhone = orderPayload.customer_phone || orderPayload.phone || '';
  const custEmail = orderPayload.customer_email || orderPayload.email || '';
  const city = orderPayload.city || 'Kathmandu';
  const province = orderPayload.province || 'Bagmati';
  const address = orderPayload.address || '';
  const paymentMethod = orderPayload.payment_method || orderPayload.paymentMethod || 'COD';
  const subtotal = orderPayload.subtotal || 0;
  const deliveryCharge = orderPayload.delivery_charge ?? orderPayload.deliveryCharge ?? 100;
  const discountAmount = orderPayload.discount_amount ?? orderPayload.discountAmount ?? 0;
  const couponCode = orderPayload.coupon_code || orderPayload.couponCode || null;
  const total = orderPayload.total || (subtotal + deliveryCharge - discountAmount);

  const localFallbackOrder = {
    id: fallbackNumber,
    order_number: fallbackNumber,
    customer_name: custName,
    customer_email: custEmail,
    customer_phone: custPhone,
    province,
    city,
    address,
    payment_method: paymentMethod,
    subtotal,
    delivery_charge: deliveryCharge,
    discount_amount: discountAmount,
    coupon_code: couponCode,
    total,
    order_status: 'Order Placed',
    created_at: new Date().toISOString(),
    items: orderPayload.items || [],
    order_items: orderPayload.items || [],
  };

  if (!isSupabaseConfigured || !supabase) {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      localStorage.setItem('everframe_orders', JSON.stringify([localFallbackOrder, ...savedOrders]));
    } catch (e) {
      console.error(e);
    }
    return {
      success: true,
      data: localFallbackOrder,
      order: localFallbackOrder,
      orderNumber: fallbackNumber,
      source: 'local',
    };
  }

  try {
    const orderNumber = fallbackNumber;
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          customer_name: custName,
          customer_email: custEmail || null,
          customer_phone: custPhone,
          province,
          city,
          address,
          payment_method: paymentMethod,
          subtotal,
          delivery_charge: deliveryCharge,
          total,
        },
      ])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    if (orderPayload.items && orderPayload.items.length > 0) {
      const itemsPayload = orderPayload.items.map(item => ({
        order_id: orderData.id,
        product_id: typeof item.id === 'number' || typeof item.product_id === 'number' ? (item.id || item.product_id) : null,
        product_name: item.name || item.product_name,
        price: item.price,
        quantity: item.quantity,
        options: item.options || item.variant || {},
      }));

      await supabase.from('order_items').insert(itemsPayload);
    }

    // Save to local cache as well for instant resilience
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      localStorage.setItem('everframe_orders', JSON.stringify([orderData, ...savedOrders]));
    } catch {}

    // Dispatch global events for instant live sync across user & admin pages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('everframe_order_updated', { detail: { orderNumber, orderData } }));
      window.dispatchEvent(new CustomEvent('everframe_new_order', { detail: { orderNumber, orderData } }));
    }

    return {
      success: true,
      data: orderData,
      order: orderData,
      orderNumber,
      source: 'supabase',
    };
  } catch (err) {
    console.error('Supabase Order Error, using local fallback:', err);
    
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      localStorage.setItem('everframe_orders', JSON.stringify([localFallbackOrder, ...savedOrders]));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('everframe_order_updated', { detail: { orderNumber: fallbackNumber, orderData: localFallbackOrder } }));
      window.dispatchEvent(new CustomEvent('everframe_new_order', { detail: { orderNumber: fallbackNumber, orderData: localFallbackOrder } }));
    }

    return {
      success: true,
      data: localFallbackOrder,
      order: localFallbackOrder,
      orderNumber: fallbackNumber,
      source: 'local',
    };
  }
}

// Helper to get status overrides saved in localStorage
function getStatusOverrides() {
  try {
    return JSON.parse(localStorage.getItem('everframe_order_statuses') || '{}');
  } catch {
    return {};
  }
}

// Normalize order keys for 100% reliable matching (strips '#', trims, lowercases)
function normalizeOrderKey(val) {
  if (val === null || val === undefined) return '';
  return val.toString().trim().replace(/^#/, '').toLowerCase();
}

// Helper to apply status overrides to an array of orders
function applyStatusOverrides(ordersList) {
  if (!ordersList || !Array.isArray(ordersList)) return [];
  const overrides = getStatusOverrides();

  // Pre-normalize all override keys
  const normOverrides = {};
  Object.keys(overrides).forEach(k => {
    const nk = normalizeOrderKey(k);
    if (nk) normOverrides[nk] = overrides[k];
  });

  return ordersList.map(o => {
    const kNum = normalizeOrderKey(o.order_number);
    const kId = normalizeOrderKey(o.id);
    const overridden = normOverrides[kNum] || normOverrides[kId];

    if (overridden) {
      return { ...o, order_status: overridden, status: overridden };
    }
    return o;
  });
}

// Fetch orders specifically for a logged-in user by email
export async function getUserOrders(userEmail) {
  if (!userEmail) return [];
  let list = [];

  if (!isSupabaseConfigured || !supabase) {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      list = savedOrders.filter(o => o.customer_email?.toLowerCase() === userEmail.toLowerCase());
    } catch {
      list = [];
    }
    return applyStatusOverrides(list);
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('customer_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Supabase returned live data — use it directly without localStorage overrides
    return data || [];
  } catch (err) {
    console.error('Fetch User Orders Error:', err);
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      list = savedOrders.filter(o => o.customer_email?.toLowerCase() === userEmail.toLowerCase());
    } catch {
      list = [];
    }
  }
  // Fallback to localStorage with overrides
  return applyStatusOverrides(list);
}

// Fetch ALL orders for Admin Portal
export async function getAllOrders() {
  let list = [];
  if (!isSupabaseConfigured || !supabase) {
    try {
      list = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
    } catch {
      list = [];
    }
    return applyStatusOverrides(list);
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    list = data || [];
  } catch (err) {
    console.error('Fetch All Orders Error:', err);
    try {
      list = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
    } catch {
      list = [];
    }
  }
  return applyStatusOverrides(list);
}

// Update Order Status (Admin)
export async function updateOrderStatus(orderId, newStatus, orderNumber) {
  // 1. Save to status overrides map in localStorage
  try {
    const overrides = getStatusOverrides();
    if (orderId) overrides[orderId] = newStatus;
    if (orderNumber) overrides[orderNumber] = newStatus;
    const nk1 = normalizeOrderKey(orderId);
    const nk2 = normalizeOrderKey(orderNumber);
    if (nk1) overrides[nk1] = newStatus;
    if (nk2) overrides[nk2] = newStatus;
    
    localStorage.setItem('everframe_order_statuses', JSON.stringify(overrides));

    // Also update everframe_orders list in localStorage
    const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
    const updated = savedOrders.map(o =>
      (normalizeOrderKey(o.id) === nk1 || normalizeOrderKey(o.order_number) === nk1 || 
       normalizeOrderKey(o.id) === nk2 || normalizeOrderKey(o.order_number) === nk2)
        ? { ...o, order_status: newStatus, status: newStatus }
        : o
    );
    localStorage.setItem('everframe_orders', JSON.stringify(updated));

    // Dispatch global event for instant UI sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('everframe_order_updated', { detail: { orderId, orderNumber, newStatus } }));
    }
  } catch (e) { console.error('Local order status override error:', e); }

  // 2. Also attempt Supabase update
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Attempt update by ID
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)
        .select();

      // 2. If no match or error, try by order_number
      if (error || !data || data.length === 0) {
        const targetNum = orderNumber || orderId;
        await supabase
          .from('orders')
          .update({ order_status: newStatus })
          .eq('order_number', targetNum);
      }
    } catch (err) {
      console.error('Supabase Update Order Status Error:', err);
    }
  }

  return true;
}

// Delete an online order (Admin)
export async function deleteOrder(orderId, orderNumber) {
  // 1. Remove from localStorage
  try {
    const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
    const filtered = savedOrders.filter(o =>
      String(o.id) !== String(orderId) &&
      (!orderNumber || String(o.order_number) !== String(orderNumber))
    );
    localStorage.setItem('everframe_orders', JSON.stringify(filtered));

    // Also clean up any status overrides for this order
    const overrides = JSON.parse(localStorage.getItem('everframe_order_status_overrides') || '{}');
    if (orderId && overrides[orderId]) delete overrides[orderId];
    if (orderNumber && overrides[orderNumber]) delete overrides[orderNumber];
    localStorage.setItem('everframe_order_status_overrides', JSON.stringify(overrides));
  } catch (e) {
    console.error('Local order delete error:', e);
  }

  // 2. Delete from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // First delete associated order items if orderId is available
      if (orderId) {
        await supabase.from('order_items').delete().eq('order_id', orderId);
      }

      // Delete the order itself by id
      let { error } = await supabase.from('orders').delete().eq('id', orderId);

      // If failed or no id matched, try deleting by order_number
      if (error && orderNumber) {
        const retry = await supabase.from('orders').delete().eq('order_number', orderNumber);
        error = retry.error;
      }

      if (error) {
        console.error('Supabase Delete Order Error:', error);
      }
    } catch (err) {
      console.error('Supabase Delete Order Exception:', err);
    }
  }

  // 3. Dispatch global event for instant UI sync across open tabs
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('everframe_order_updated', { detail: { deletedOrderId: orderId, deletedOrderNumber: orderNumber } }));
  }

  return { success: true };
}

// Track Single Order by Order Number
export async function getOrderByNumber(orderNumber) {
  if (!orderNumber) return null;
  const cleanNumber = orderNumber.trim().toUpperCase().replace('#', '');
  let found = null;

  if (!isSupabaseConfigured || !supabase) {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      found = savedOrders.find(o => o.order_number?.toString().toUpperCase() === cleanNumber || o.id?.toString().toUpperCase() === cleanNumber) || null;
    } catch {
      found = null;
    }
    return found ? applyStatusOverrides([found])[0] : null;
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('order_number', cleanNumber)
      .maybeSingle();

    if (!error && data) {
      // Supabase returned live data with the real updated status — return it directly
      return data;
    }
  } catch (err) {
    console.error('Track Order Error:', err);
  }

  // Supabase failed — fallback to localStorage with overrides
  try {
    const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
    found = savedOrders.find(o => o.order_number?.toString().toUpperCase() === cleanNumber || o.id?.toString().toUpperCase() === cleanNumber) || null;
  } catch {
    found = null;
  }

  return found ? applyStatusOverrides([found])[0] : null;
}

// Upload Custom Photo to Supabase Storage Bucket
export async function uploadCustomPhoto(file) {
  if (!isSupabaseConfigured || !supabase) {
    return { url: URL.createObjectURL(file), source: 'local' };
  }

  try {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage
      .from('custom-photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('custom-photos')
      .getPublicUrl(fileName);

    return { url: data.publicUrl, source: 'supabase' };
  } catch {
    return { url: URL.createObjectURL(file), source: 'local' };
  }
}

// =====================================================
// COUPON FUNCTIONS
// =====================================================

// Validate a coupon code against cart total
export async function validateCoupon(code, cartTotal) {
  if (!code || !code.trim()) return { valid: false, error: 'Enter a coupon code' };
  const cleanCode = code.trim().toUpperCase();

  // Offline fallback — check localStorage coupons
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_coupons') || '[]');
      const coupon = local.find(c => c.code === cleanCode);
      if (!coupon) return { valid: false, error: 'Invalid coupon code' };
      if (!coupon.is_active) return { valid: false, error: 'This coupon is no longer active' };
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return { valid: false, error: 'This coupon has expired' };
      if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) return { valid: false, error: 'This coupon has reached its usage limit' };
      if (cartTotal < coupon.min_order_amount) return { valid: false, error: `Minimum order of NPR ${coupon.min_order_amount.toLocaleString()} required` };
      const discount = coupon.discount_type === 'percentage'
        ? Math.round((cartTotal * coupon.discount_value) / 100)
        : Math.min(coupon.discount_value, cartTotal);
      return { valid: true, coupon, discount };
    } catch {
      return { valid: false, error: 'Could not validate coupon' };
    }
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .maybeSingle();

    if (error || !data) return { valid: false, error: 'Invalid coupon code' };
    if (!data.is_active) return { valid: false, error: 'This coupon is no longer active' };
    if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, error: 'This coupon has expired' };
    if (data.max_uses !== null && data.usage_count >= data.max_uses) return { valid: false, error: 'This coupon has reached its usage limit' };
    if (cartTotal < data.min_order_amount) return { valid: false, error: `Minimum order of NPR ${data.min_order_amount.toLocaleString()} required` };

    const discount = data.discount_type === 'percentage'
      ? Math.round((cartTotal * data.discount_value) / 100)
      : Math.min(data.discount_value, cartTotal);

    return { valid: true, coupon: data, discount };
  } catch (err) {
    console.error('Validate Coupon Error:', err);
    return { valid: false, error: 'Could not validate coupon. Please try again.' };
  }
}

// Increment coupon usage count after order is placed
export async function incrementCouponUsage(code) {
  if (!code || !isSupabaseConfigured || !supabase) return;
  const cleanCode = code.trim().toUpperCase();
  try {
    // Read current usage_count then increment
    const { data } = await supabase
      .from('coupons')
      .select('usage_count')
      .ilike('code', cleanCode)
      .maybeSingle();
    if (data) {
      await supabase
        .from('coupons')
        .update({ usage_count: (data.usage_count || 0) + 1 })
        .ilike('code', cleanCode);
    }
  } catch (err) {
    console.error('Increment Coupon Usage Error:', err);
  }
}

// Fetch all coupons (Admin)
export async function getAllCoupons() {
  if (!isSupabaseConfigured || !supabase) {
    try {
      return JSON.parse(localStorage.getItem('everframe_coupons') || '[]');
    } catch { return []; }
  }
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Get All Coupons Error:', err);
    return [];
  }
}

// Create a new coupon (Admin)
export async function createCoupon(couponData) {
  const payload = {
    code: couponData.code.trim().toUpperCase(),
    discount_type: couponData.discount_type,
    discount_value: parseFloat(couponData.discount_value),
    min_order_amount: parseFloat(couponData.min_order_amount) || 0,
    max_uses: couponData.max_uses ? parseInt(couponData.max_uses) : null,
    is_active: true,
    expires_at: couponData.expires_at || null,
  };

  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_coupons') || '[]');
      const newCoupon = { ...payload, id: Date.now().toString(), usage_count: 0, created_at: new Date().toISOString() };
      localStorage.setItem('everframe_coupons', JSON.stringify([newCoupon, ...local]));
      return { success: true, coupon: newCoupon };
    } catch { return { success: false, error: 'Failed to create coupon' }; }
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return { success: true, coupon: data };
  } catch (err) {
    console.error('Create Coupon Error:', err);
    const msg = err?.message?.includes('unique') ? 'Coupon code already exists' : 'Failed to create coupon';
    return { success: false, error: msg };
  }
}

// Toggle coupon active/inactive (Admin)
export async function toggleCoupon(id, isActive) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_coupons') || '[]');
      const updated = local.map(c => c.id === id ? { ...c, is_active: isActive } : c);
      localStorage.setItem('everframe_coupons', JSON.stringify(updated));
      return true;
    } catch { return false; }
  }
  try {
    await supabase.from('coupons').update({ is_active: isActive }).eq('id', id);
    return true;
  } catch (err) {
    console.error('Toggle Coupon Error:', err);
    return false;
  }
}

// Delete a coupon (Admin)
export async function deleteCoupon(id) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_coupons') || '[]');
      localStorage.setItem('everframe_coupons', JSON.stringify(local.filter(c => c.id !== id)));
      return true;
    } catch { return false; }
  }
  try {
    await supabase.from('coupons').delete().eq('id', id);
    return true;
  } catch (err) {
    console.error('Delete Coupon Error:', err);
    return false;
  }
}

// Submit a contact form message
export async function submitContactForm({ name, email, subject, message }) {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback: store locally
    try {
      const local = JSON.parse(localStorage.getItem('everframe_contact_submissions') || '[]');
      const entry = { id: Date.now(), name, email, subject, message, created_at: new Date().toISOString(), is_read: false };
      localStorage.setItem('everframe_contact_submissions', JSON.stringify([entry, ...local]));
      return { success: true };
    } catch { return { success: false, error: 'Failed to save locally' }; }
  }
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .insert([{ name, email, subject, message }]);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Contact Form Submit Error:', err);
    return { success: false, error: err.message };
  }
}

// Fetch all contact submissions (Admin)
export async function getContactSubmissions() {
  if (!isSupabaseConfigured || !supabase) {
    try {
      return JSON.parse(localStorage.getItem('everframe_contact_submissions') || '[]');
    } catch { return []; }
  }
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Get Contact Submissions Error:', err);
    return [];
  }
}

// Mark a contact submission as read (Admin)
export async function markContactRead(id) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_contact_submissions') || '[]');
      localStorage.setItem('everframe_contact_submissions', JSON.stringify(local.map(s => s.id === id ? { ...s, is_read: true } : s)));
    } catch {}
    return;
  }
  try {
    await supabase.from('contact_submissions').update({ is_read: true }).eq('id', id);
  } catch (err) {
    console.error('Mark Contact Read Error:', err);
  }
}

// =====================================================
// PRODUCT MANAGEMENT FUNCTIONS
// =====================================================

// Normalize a Supabase product row to match the shape expected by components
export function normalizeProduct(p) {
  if (!p) return null;
  return {
    ...p,
    categoryLabel: p.category_label || p.categoryLabel || '',
    originalPrice: p.original_price ?? p.originalPrice ?? null,
    discount: p.discount ?? null,
    isFeatured: p.is_featured ?? p.isFeatured ?? false,
    isAvailable: p.is_available !== false, // default true
    reviewCount: p.review_count ?? p.reviewCount ?? 0,
    frameType: p.frame_type || p.frameType || '',
    images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    slug: p.slug || '',
    stock: p.stock ?? 50,
    rating: p.rating ?? 5.0,
  };
}

// Fetch all products for ADMIN (includes unavailable ones)
export async function getAdminProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return localProducts.map(normalizeProduct);
  }
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeProduct);
  } catch (err) {
    console.error('Get Admin Products Error:', err);
    return localProducts.map(normalizeProduct);
  }
}

// Fetch only AVAILABLE products for customer-facing pages
export async function getPublicProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: localProducts.map(normalizeProduct), source: 'local' };
  }
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      return { data: localProducts.map(normalizeProduct), source: 'local' };
    }
    return { data: data.map(normalizeProduct), source: 'supabase' };
  } catch (err) {
    console.error('Get Public Products Error:', err);
    return { data: localProducts.map(normalizeProduct), source: 'local' };
  }
}

// Fetch a single product by slug (customer-facing, must be available)
export async function getProductBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    const found = localProducts.find(p => p.slug === slug);
    return found ? normalizeProduct(found) : null;
  }
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('is_available', true)
      .maybeSingle();
    if (error) throw error;
    return data ? normalizeProduct(data) : null;
  } catch (err) {
    console.error('Get Product By Slug Error:', err);
    const found = localProducts.find(p => p.slug === slug);
    return found ? normalizeProduct(found) : null;
  }
}

// Upload a product image to Supabase Storage (product-images bucket)
export async function uploadProductImage(file) {
  if (!isSupabaseConfigured || !supabase) {
    return { url: URL.createObjectURL(file), source: 'local' };
  }
  try {
    const ext = file.name.split('.').pop();
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return { url: data.publicUrl, source: 'supabase' };
  } catch (err) {
    console.error('Upload Product Image Error:', err);
    return { url: URL.createObjectURL(file), source: 'local' };
  }
}

// Generate a URL-safe slug from a product name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Create a new product (Admin)
export async function createProduct(formData, imageFiles = []) {
  // Upload images first
  const imageUrls = [];
  for (const file of imageFiles) {
    if (file instanceof File) {
      const { url } = await uploadProductImage(file);
      imageUrls.push(url);
    } else if (typeof file === 'string') {
      imageUrls.push(file);
    }
  }

  let slug = generateSlug(formData.name);
  if (!slug) slug = `product-${Date.now()}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existingSlug } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (existingSlug) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }
    } catch {}
  }

  const payload = {
    name: formData.name.trim(),
    slug,
    category: formData.category,
    category_label: formData.category_label || formData.categoryLabel || formData.category.replace(/-/g, ' ').toUpperCase(),
    price: parseFloat(formData.price),
    original_price: formData.original_price ? parseFloat(formData.original_price) : null,
    discount: formData.original_price && formData.price
      ? Math.round(((parseFloat(formData.original_price) - parseFloat(formData.price)) / parseFloat(formData.original_price)) * 100)
      : null,
    description: formData.description || '',
    images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80'],
    sizes: Array.isArray(formData.sizes) ? formData.sizes : (formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['5x7', '8x10']),
    colors: Array.isArray(formData.colors) ? formData.colors : (formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : ['Natural']),
    material: formData.material || 'Wood',
    frame_type: formData.frame_type || 'classic',
    badge: formData.badge || null,
    is_featured: Boolean(formData.is_featured),
    is_available: formData.is_available !== false,
    rating: 5.0,
    review_count: 0,
    stock: parseInt(formData.stock) || 50,
  };

  if (!isSupabaseConfigured || !supabase) {
    const newProduct = { ...payload, id: Date.now(), created_at: new Date().toISOString() };
    try {
      const local = JSON.parse(localStorage.getItem('everframe_products') || '[]');
      localStorage.setItem('everframe_products', JSON.stringify([newProduct, ...local]));
    } catch {}
    return { success: true, product: normalizeProduct(newProduct) };
  }

  try {
    let { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select()
      .single();

    // Auto-fix if PostgreSQL BIGSERIAL sequence is behind initial seed IDs (products_pkey error)
    if (error && (error.message?.includes('products_pkey') || error.code === '23505')) {
      const { data: maxRow } = await supabase
        .from('products')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextId = (maxRow?.id ? Number(maxRow.id) : 10) + 1;
      const retryResult = await supabase
        .from('products')
        .insert([{ ...payload, id: nextId }])
        .select()
        .single();

      if (!retryResult.error && retryResult.data) {
        return { success: true, product: normalizeProduct(retryResult.data) };
      }
      error = retryResult.error || error;
    }

    if (error) throw error;
    return { success: true, product: normalizeProduct(data) };
  } catch (err) {
    console.error('Create Product Error:', err);
    let msg = err?.message || 'Failed to create product';
    if (err?.message?.includes('products_slug_key')) {
      msg = 'A product with this URL slug already exists. Please modify the name slightly.';
    }
    return { success: false, error: msg };
  }
}

// Update an existing product (Admin)
export async function updateProduct(id, formData, newImageFiles = []) {
  // Handle image uploads — keep existing URLs, upload new File objects
  const imageUrls = [];
  for (const file of newImageFiles) {
    if (file instanceof File) {
      const { url } = await uploadProductImage(file);
      imageUrls.push(url);
    } else if (typeof file === 'string') {
      imageUrls.push(file);
    }
  }

  const updates = {
    name: formData.name.trim(),
    category: formData.category,
    category_label: formData.category_label || formData.categoryLabel || formData.category.replace(/-/g, ' ').toUpperCase(),
    price: parseFloat(formData.price),
    original_price: formData.original_price ? parseFloat(formData.original_price) : null,
    discount: formData.original_price && formData.price
      ? Math.round(((parseFloat(formData.original_price) - parseFloat(formData.price)) / parseFloat(formData.original_price)) * 100)
      : null,
    description: formData.description || '',
    material: formData.material || 'Wood',
    frame_type: formData.frame_type || 'classic',
    sizes: Array.isArray(formData.sizes) ? formData.sizes : (formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : []),
    colors: Array.isArray(formData.colors) ? formData.colors : (formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : []),
    is_featured: Boolean(formData.is_featured),
    is_available: formData.is_available !== false,
    stock: parseInt(formData.stock) || 50,
    updated_at: new Date().toISOString(),
  };

  if (imageUrls.length > 0) {
    updates.images = imageUrls;
  }

  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_products') || '[]');
      const updated = local.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem('everframe_products', JSON.stringify(updated));
    } catch {}
    return { success: true };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: normalizeProduct(data) };
  } catch (err) {
    console.error('Update Product Error:', err);
    return { success: false, error: err?.message || 'Failed to update product' };
  }
}

// Delete a product (Admin) — hard delete (order_items stores product_name text so history is safe)
export async function deleteProduct(id) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_products') || '[]');
      localStorage.setItem('everframe_products', JSON.stringify(local.filter(p => p.id !== id)));
    } catch {}
    return { success: true };
  }
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Delete Product Error:', err);
    return { success: false, error: err?.message || 'Failed to delete product' };
  }
}

// Toggle product availability (hide/show from customer pages)
export async function toggleProductAvailability(id, isAvailable) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_products') || '[]');
      localStorage.setItem('everframe_products', JSON.stringify(local.map(p => p.id === id ? { ...p, is_available: isAvailable } : p)));
    } catch {}
    return { success: true };
  }
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Toggle Product Availability Error:', err);
    return { success: false, error: err?.message || 'Failed to update availability' };
  }
}

// Toggle product featured status
export async function toggleProductFeatured(id, isFeatured) {
  if (!isSupabaseConfigured || !supabase) {
    try {
      const local = JSON.parse(localStorage.getItem('everframe_products') || '[]');
      localStorage.setItem('everframe_products', JSON.stringify(local.map(p => p.id === id ? { ...p, is_featured: isFeatured, isFeatured } : p)));
    } catch {}
    return { success: true };
  }
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Toggle Product Featured Error:', err);
    return { success: false, error: err?.message || 'Failed to update featured status' };
  }
}

// =====================================================
// PRODUCT REVIEWS & COMMENTS API
// =====================================================

const DEFAULT_SAMPLE_REVIEWS = [
  {
    id: 'sample-1',
    product_slug: 'classic-wooden-frame',
    user_name: 'Aarav Sharma',
    rating: 5,
    title: 'Superior craftsmanship!',
    comment: 'The oak wood finish is stunning and arrived securely packaged in Kathmandu within 2 days. Fits our family portrait perfectly.',
    is_verified: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'sample-2',
    product_slug: 'classic-wooden-frame',
    user_name: 'Pooja Thapa',
    rating: 5,
    title: 'Beautiful frame, museum quality glass',
    comment: 'Ordered this for our 5th anniversary portrait. Looks very elegant and premium on our living room wall.',
    is_verified: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'sample-3',
    product_slug: 'premium-black-frame',
    user_name: 'Sujan Shrestha',
    rating: 5,
    title: 'Minimalist & modern design',
    comment: 'The matte black edge gives artwork a sleek gallery vibe. High quality at a very reasonable price.',
    is_verified: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'sample-4',
    product_slug: 'couple-memory-frame',
    user_name: 'Bikash & Anjali',
    rating: 5,
    title: 'Best gift ever ❤️',
    comment: 'Custom engraved with our wedding date. The recipient absolutely loved it! Will definitely order again.',
    is_verified: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

// Fetch reviews for a specific product
export async function getProductReviews(productSlug, productId) {
  let list = [];
  const cleanSlug = (productSlug || '').toLowerCase().trim();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .or(`product_slug.eq.${cleanSlug}${productId ? `,product_id.eq.${productId}` : ''}`)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error('Fetch Reviews Error:', err);
    }
  }

  // Local fallback
  try {
    const saved = JSON.parse(localStorage.getItem('everframe_reviews') || '[]');
    const localMatches = saved.filter(r => r.product_slug === cleanSlug || (productId && r.product_id === productId));
    const sampleMatches = DEFAULT_SAMPLE_REVIEWS.filter(r => r.product_slug === cleanSlug);
    list = [...localMatches, ...sampleMatches];
  } catch {
    list = DEFAULT_SAMPLE_REVIEWS.filter(r => r.product_slug === cleanSlug);
  }

  return list;
}

// Submit a new review
export async function createProductReview(reviewData) {
  const payload = {
    product_slug: (reviewData.product_slug || '').toLowerCase().trim(),
    product_id: reviewData.product_id || null,
    user_name: reviewData.user_name.trim(),
    user_email: reviewData.user_email?.trim() || null,
    rating: parseInt(reviewData.rating) || 5,
    title: reviewData.title?.trim() || '',
    comment: reviewData.comment.trim(),
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  // Always save to localStorage for instant local access
  try {
    const local = JSON.parse(localStorage.getItem('everframe_reviews') || '[]');
    const localEntry = { ...payload, id: `rev-${Date.now()}` };
    localStorage.setItem('everframe_reviews', JSON.stringify([localEntry, ...local]));
  } catch (e) {
    console.error('Save local review error:', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { success: true, review: data };
    } catch (err) {
      console.error('Supabase Create Review Error:', err);
    }
  }

  return { success: true, review: { ...payload, id: `rev-${Date.now()}` } };
}

// =====================================================
// OFFLINE SALES SERVICE FUNCTIONS
// =====================================================

// Helper to convert File to Base64 string for reliable localStorage image persistence
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Upload offline sale photo to Supabase storage bucket (custom-photos or product-images) with base64 fallback
export async function uploadOfflineSaleImage(file) {
  if (!file) return { url: null };
  if (typeof file === 'string') return { url: file };

  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `offline-sale-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('custom-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (!uploadError) {
        const { data } = supabase.storage.from('custom-photos').getPublicUrl(fileName);
        if (data?.publicUrl) {
          return { url: data.publicUrl, source: 'supabase' };
        }
      }
    } catch (err) {
      console.warn('Supabase offline sale photo upload warning, falling back to base64 encoding:', err);
    }
  }

  // Fallback to Base64 data URL for offline / local storage persistence
  try {
    const base64Url = await fileToBase64(file);
    return { url: base64Url, source: 'local' };
  } catch (err) {
    console.error('File to base64 conversion failed:', err);
    return { url: null, source: 'local' };
  }
}

// Fetch all offline sales
export async function getOfflineSales() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('offline_sales')
        .select('*')
        .order('order_date', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error('Fetch Supabase Offline Sales Error:', err);
    }
  }

  // LocalStorage fallback
  try {
    const localData = JSON.parse(localStorage.getItem('everframe_offline_sales') || '[]');
    return localData.sort((a, b) => new Date(b.created_at || b.order_date) - new Date(a.created_at || a.order_date));
  } catch {
    return [];
  }
}

// Create a new offline sale
export async function createOfflineSale(formData, imageFile = null) {
  const cost = parseFloat(formData.cost_price) || 0;
  const delivery = parseFloat(formData.delivery_charge) || 0;
  const sold = parseFloat(formData.sold_price) || 0;
  const totalCost = cost + delivery;
  const profit = sold - totalCost;

  let photoUrl = formData.photo_url || null;
  if (imageFile) {
    const uploadRes = await uploadOfflineSaleImage(imageFile);
    if (uploadRes.url) {
      photoUrl = uploadRes.url;
    }
  }

  const payload = {
    customer_name: (formData.customer_name || '').trim(),
    order_date: formData.order_date || new Date().toISOString().split('T')[0],
    frame_name: (formData.frame_name || '').trim(),
    category: (formData.category || 'photo-frames').trim(),
    cost_price: cost,
    delivery_charge: delivery,
    sold_price: sold,
    profit: profit,
    photo_url: photoUrl,
    notes: (formData.notes || '').trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to localStorage fallback first for instant update
  let localRecord = null;
  try {
    localRecord = { ...payload, id: `OFFLINE-${Date.now()}` };
    const localSales = JSON.parse(localStorage.getItem('everframe_offline_sales') || '[]');
    localStorage.setItem('everframe_offline_sales', JSON.stringify([localRecord, ...localSales]));
  } catch (e) {
    console.error('LocalStorage offline sale error:', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let { data, error } = await supabase
        .from('offline_sales')
        .insert([payload])
        .select()
        .single();

      // Gracefully retry without delivery_charge column if Supabase table hasn't had the column added yet
      if (error && (error.message?.includes('delivery_charge') || error.code === '42703')) {
        console.warn('delivery_charge column not found in Supabase offline_sales table. Retrying insert without delivery_charge. (Run the migration in Supabase SQL editor)');
        const { delivery_charge: _, ...payloadWithoutDelivery } = payload;
        const retry = await supabase
          .from('offline_sales')
          .insert([payloadWithoutDelivery])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        // Replace temporary local fallback with real Supabase record
        try {
          const localSales = JSON.parse(localStorage.getItem('everframe_offline_sales') || '[]');
          const updatedLocal = localSales.map(s => s.id === localRecord?.id ? data : s);
          localStorage.setItem('everframe_offline_sales', JSON.stringify(updatedLocal));
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('everframe_offline_sale_updated', { detail: { sale: data } }));
        }
        return { success: true, sale: data, source: 'supabase' };
      }
    } catch (err) {
      console.error('Supabase create offline sale error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('everframe_offline_sale_updated', { detail: { sale: localRecord } }));
  }

  return { success: true, sale: localRecord, source: 'local' };
}

// Update an existing offline sale
export async function updateOfflineSale(id, formData, newImageFile = null) {
  const cost = parseFloat(formData.cost_price) || 0;
  const delivery = parseFloat(formData.delivery_charge) || 0;
  const sold = parseFloat(formData.sold_price) || 0;
  const totalCost = cost + delivery;
  const profit = sold - totalCost;

  let photoUrl = formData.photo_url || null;
  if (newImageFile) {
    const uploadRes = await uploadOfflineSaleImage(newImageFile);
    if (uploadRes.url) {
      photoUrl = uploadRes.url;
    }
  }

  const updates = {
    customer_name: (formData.customer_name || '').trim(),
    order_date: formData.order_date || new Date().toISOString().split('T')[0],
    frame_name: (formData.frame_name || '').trim(),
    category: (formData.category || 'photo-frames').trim(),
    cost_price: cost,
    delivery_charge: delivery,
    sold_price: sold,
    profit: profit,
    photo_url: photoUrl,
    notes: (formData.notes || '').trim() || null,
    updated_at: new Date().toISOString(),
  };

  // Update in localStorage
  try {
    const localSales = JSON.parse(localStorage.getItem('everframe_offline_sales') || '[]');
    const updated = localSales.map(s => String(s.id) === String(id) ? { ...s, ...updates } : s);
    localStorage.setItem('everframe_offline_sales', JSON.stringify(updated));
  } catch (e) {
    console.error('Update local offline sale error:', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let { data, error } = await supabase
        .from('offline_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      // Gracefully retry without delivery_charge column if Supabase table hasn't had the column added yet
      if (error && (error.message?.includes('delivery_charge') || error.code === '42703')) {
        console.warn('delivery_charge column not found in Supabase offline_sales table. Retrying update without delivery_charge.');
        const { delivery_charge: _, ...updatesWithoutDelivery } = updates;
        const retry = await supabase
          .from('offline_sales')
          .update(updatesWithoutDelivery)
          .eq('id', id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (!error && data) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('everframe_offline_sale_updated', { detail: { sale: data } }));
        }
        return { success: true, sale: data, source: 'supabase' };
      }
    } catch (err) {
      console.error('Supabase update offline sale error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('everframe_offline_sale_updated', { detail: { sale: { id, ...updates } } }));
  }

  return { success: true, sale: { id, ...updates }, source: 'local' };
}

// Delete an offline sale
export async function deleteOfflineSale(id) {
  // Delete from localStorage
  try {
    const localSales = JSON.parse(localStorage.getItem('everframe_offline_sales') || '[]');
    const filtered = localSales.filter(s => String(s.id) !== String(id));
    localStorage.setItem('everframe_offline_sales', JSON.stringify(filtered));
  } catch (e) {
    console.error('Delete local offline sale error:', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('offline_sales')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete offline sale error:', error);
      }
    } catch (err) {
      console.error('Delete offline sale exception:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('everframe_offline_sale_updated', { detail: { deletedId: id } }));
  }

  return { success: true };
}

