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
    list = data || [];
  } catch (err) {
    console.error('Fetch User Orders Error:', err);
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      list = savedOrders.filter(o => o.customer_email?.toLowerCase() === userEmail.toLowerCase());
    } catch {
      list = [];
    }
  }
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
      found = data;
    }
  } catch (err) {
    console.error('Track Order Error:', err);
  }

  if (!found) {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('everframe_orders') || '[]');
      found = savedOrders.find(o => o.order_number?.toString().toUpperCase() === cleanNumber || o.id?.toString().toUpperCase() === cleanNumber) || null;
    } catch {
      found = null;
    }
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
