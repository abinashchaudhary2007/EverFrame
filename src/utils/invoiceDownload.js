import html2pdf from 'html2pdf.js';

/**
 * Generate and download an official EverFrame Invoice as a PDF file.
 * @param {Object} order - The order details object
 */
export async function downloadInvoicePDF(order) {
  const origin = window.location.origin;
  const placedDate = order.placedAt instanceof Date 
    ? order.placedAt 
    : new Date(order.placedAt || Date.now());

  const container = document.createElement('div');
  container.style.width = '700px';
  container.style.padding = '32px 36px';
  container.style.background = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";
  container.style.boxSizing = 'border-box';

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px;">
        <div style="font-weight: 700; color: #0f172a;">${item.name || 'Custom Frame'}</div>
        ${item.variant?.size || item.variant?.color ? `
          <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
            ${[item.variant?.size, item.variant?.color].filter(Boolean).join(' · ')}
          </div>
        ` : ''}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; text-align: center; font-weight: 700;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; text-align: right; color: #475569;">
        NPR ${(item.price || 0).toLocaleString()}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; text-align: right; font-weight: 800; color: #0f172a;">
        NPR ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #172A72; padding-bottom: 18px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="${origin}/logo.png" alt="EverFrame" style="width: 52px; height: 52px; border-radius: 50%; object-fit: contain;" />
        <div>
          <div style="font-size: 26px; font-weight: 900; color: #172A72; letter-spacing: -0.5px;">EverFrame</div>
          <div style="font-size: 11.5px; color: #64748b; margin-top: 1px;">Premium Custom Photo Frames & Wall Art · Nepal</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #172A72;">Official Invoice</div>
        <div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 2px;">#${order.orderNumber}</div>
        <div style="font-size: 11.5px; color: #64748b; margin-top: 3px; line-height: 1.4;">
          ${placedDate.toLocaleDateString('en-NP', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
          ${placedDate.toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; margin-bottom: 24px; background: #f8fafc; padding: 18px 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div>
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #172A72; margin-bottom: 6px;">Bill To & Delivery Address</div>
        <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${order.name}</div>
        <div style="font-size: 12.5px; color: #334155; margin-top: 4px; line-height: 1.6;">
          📞 ${order.phone || ''}${order.email ? `<br/>✉️ ${order.email}` : ''}<br/>
          📍 ${order.address || ''}<br/>
          ${order.city || 'Kathmandu'}, Nepal
        </div>
      </div>
      <div>
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #172A72; margin-bottom: 6px;">Payment & Status</div>
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 11.5px; font-weight: 800; padding: 3px 12px; border-radius: 20px; border: 1px solid #bbf7d0;">
            ${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : order.paymentMethod || 'Paid Online'}
          </span>
        </div>
        <div style="font-size: 11.5px; color: #64748b;">Order Status: <strong style="color: #0f172a;">Confirmed & Processing</strong></div>
        <div style="font-size: 11.5px; color: #64748b; margin-top: 3px;">Estimated Delivery: <strong style="color: #0f172a;">2-3 Business Days</strong></div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 800; text-align: left; border-bottom: 2px solid #cbd5e1;">Item Details</th>
          <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 800; text-align: center; border-bottom: 2px solid #cbd5e1;">Qty</th>
          <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 800; text-align: right; border-bottom: 2px solid #cbd5e1;">Price</th>
          <th style="padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; font-weight: 800; text-align: right; border-bottom: 2px solid #cbd5e1;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals Box -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 28px;">
      <div style="width: 300px; background: #f8fafc; padding: 16px 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px;">
          <span>Subtotal</span>
          <span style="font-weight: 700; color: #0f172a;">NPR ${(order.subtotal || 0).toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px;">
          <span>Delivery Charge</span>
          <span style="font-weight: 700; color: ${order.deliveryCharge === 0 ? '#16a34a' : '#0f172a'};">
            ${order.deliveryCharge === 0 ? 'FREE 🎉' : `NPR ${order.deliveryCharge}`}
          </span>
        </div>
        ${order.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #16a34a; font-weight: 700; margin-bottom: 6px;">
            <span>Coupon (${order.couponCode || 'PROMO'})</span>
            <span>− NPR ${order.discountAmount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #172A72; padding-top: 10px; border-top: 2px solid #172A72; margin-top: 8px;">
          <span>Grand Total</span>
          <span>NPR ${(order.total || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- Footer Note -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; text-align: center; font-size: 11.5px; color: #94a3b8; line-height: 1.6;">
      Thank you for choosing <strong>EverFrame Nepal</strong>! ❤️ Handcrafted with museum-grade quality.<br/>
      Support: <strong>everframe.np@gmail.com</strong> · Track real-time status anytime at <strong>/track-order</strong>
    </div>
  `;

  // Append off-screen for clean rendering
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '-10000px';
  wrapper.style.left = '-10000px';
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `EverFrame-Invoice-${order.orderNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.error('PDF Generation failed, falling back to HTML file download', err);
    // Fallback: Download formatted standalone HTML invoice
    const blob = new Blob([container.innerHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EverFrame-Invoice-${order.orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(wrapper);
  }
}
