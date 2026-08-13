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

// Create new Order in Supabase
export async function createOrder(orderPayload) {
  if (!isSupabaseConfigured || !supabase) {
    // Save to localStorage fallback for user-specific history if Supabase offline
    const localOrder = {
      id: `EF${Date.now().toString().slice(-6)}`,
      order_number: `EF${Date.now().toString().slice(-6)}`,
      customer_name: orderPayload.name,
      customer_email: orderPayload.email,
      customer_phone: orderPayload.phone,
      total: orderPayload.total,
      order_status: 'Order Placed',
      created_at: new Date().toISOString(),
      items: orderPayload.items || [],
    };
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      localStorage.setItem('everframe_orders', JSON.stringify([localOrder, ...savedOrders]));
    } catch (e) {
      console.error(e);
    }
    return {
      success: true,
      orderNumber: localOrder.order_number,
      source: 'local',
    };
  }

  try {
    const orderNumber = `EF${Date.now().toString().slice(-6)}`;
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          order_number: orderNumber,
          customer_name: orderPayload.name,
          customer_email: orderPayload.email,
          customer_phone: orderPayload.phone,
          province: orderPayload.province,
          city: orderPayload.city,
          address: orderPayload.address,
          payment_method: orderPayload.paymentMethod,
          subtotal: orderPayload.subtotal,
          delivery_charge: orderPayload.deliveryCharge,
          total: orderPayload.total,
        },
      ])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items
    if (orderPayload.items && orderPayload.items.length > 0) {
      const itemsPayload = orderPayload.items.map(item => ({
        order_id: orderData.id,
        product_id: typeof item.id === 'number' ? item.id : null,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.options || {},
      }));

      await supabase.from('order_items').insert(itemsPayload);
    }

    // Dispatch global events for instant live sync across user & admin pages
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('everframe_order_updated', { detail: { orderNumber, orderData } }));
      window.dispatchEvent(new CustomEvent('everframe_new_order', { detail: { orderNumber, orderData } }));
    }

    return { success: true, orderNumber, order: orderData, source: 'supabase' };
  } catch (err) {
    console.error('Supabase Order Error:', err);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('everframe_order_updated'));
      window.dispatchEvent(new CustomEvent('everframe_new_order'));
    }

    return {
      success: true,
      orderNumber: localOrder.order_number,
      order: localOrder,
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
