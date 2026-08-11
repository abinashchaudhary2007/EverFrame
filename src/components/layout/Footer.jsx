import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-logo">
              <img src="/logo.png" alt="EverFrame" className="footer-logo-img" />
              EverFrame
            </div>
            <p className="footer-brand-desc">
              Premium custom photo frames and personalized gifts, crafted with love and delivered across Nepal.
            </p>
            <div className="footer-social">
              <a href="https://www.instagram.com/everframeofficial.np?igsh=MWZ0b2dyYmk2MXQ2Mw%3D%3D" aria-label="Instagram" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              </a>
              <a href="https://youtube.com" aria-label="Youtube" target="_blank" rel="noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <div className="footer-col-title">Shop</div>
            <div className="footer-links">
              <Link to="/shop">All Products</Link>
              <Link to="/shop?category=photo-frames">Photo Frames</Link>
              <Link to="/shop?category=wedding-frames">Wedding Frames</Link>
              <Link to="/shop?category=wall-art">Wall Art</Link>
              <Link to="/shop?category=personalized-gifts">Personalized Gifts</Link>
              <Link to="/customize">Custom Frame</Link>
            </div>
          </div>

          {/* Help */}
          <div>
            <div className="footer-col-title">Help</div>
            <div className="footer-links">
              <Link to="/track-order">Track Order</Link>
              <Link to="/account/orders">My Orders</Link>
              <a href="#faq">FAQ</a>
              <a href="#returns">Returns & Refunds</a>
              <a href="#shipping">Shipping Info</a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <div className="footer-col-title">Stay Updated</div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px', lineHeight: '1.65' }}>
              Get exclusive deals, new arrivals and inspiration straight to your inbox.
            </p>
            <div className="footer-newsletter">
              <input type="email" placeholder="Your email address" />
              <button className="btn btn-primary btn-sm btn-full">Subscribe</button>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '10px' }}>
              📍 Kathmandu, Nepal &nbsp;·&nbsp; 📞 <a href="tel:+9779805185431" style={{ color: 'inherit', textDecoration: 'underline' }}>+977-9805185431</a>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © {new Date().getFullYear()} EverFrame. All rights reserved.
          </p>
          <div className="footer-payment">
            <span className="payment-icon">eSewa</span>
            <span className="payment-icon">Khalti</span>
            <span className="payment-icon">COD</span>
            <span className="payment-icon">Card</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
