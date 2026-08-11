import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, ChevronRight, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Rating from '../components/ui/Rating';
import ProductCard from '../components/product/ProductCard';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const product = products.find(p => p.slug === slug);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] || '');
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-icon">🖼️</div>
        <h3>Product Not Found</h3>
        <p>This product doesn't exist or may have been removed.</p>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const wished = isWishlisted(product.id);
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, qty, { size: selectedSize, color: selectedColor });
    toast.success(`${product.name} added to cart!`, {
      position: 'bottom-right',
      style: { borderRadius: '8px', background: '#1A1A1A', color: '#fff', fontSize: '13.5px' },
      iconTheme: { primary: 'var(--color-accent)', secondary: '#fff' },
    });
  };

  return (
    <div className="product-detail page-enter">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop">Shop</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          {/* Gallery */}
          <div>
            <div className="gallery-main">
              <img src={product.images[activeImg]} alt={product.name} />
            </div>
            {product.images.length > 1 && (
              <div className="gallery-thumbs">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className={`gallery-thumb ${i === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt={`${product.name} view ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="product-detail-category">{product.categoryLabel}</p>
            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-detail-rating">
              <Rating rating={product.rating} count={product.reviewCount} size={15} />
            </div>

            <div className="product-detail-price">
              <span className="detail-price">NPR {product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="detail-price-original">NPR {product.originalPrice.toLocaleString()}</span>
                  <span className="badge badge-accent">{product.discount}% off</span>
                </>
              )}
            </div>

            <p className="product-desc">{product.description}</p>

            {/* Size */}
            <div className="variant-section">
              <div className="variant-label">Size: <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{selectedSize}</span></div>
              <div className="variant-options">
                {product.sizes.map(s => (
                  <button
                    key={s}
                    className={`variant-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="variant-section" style={{ marginTop: '16px' }}>
              <div className="variant-label">Color: <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{selectedColor}</span></div>
              <div className="variant-options">
                {product.colors.map(c => (
                  <button
                    key={c}
                    className={`variant-btn ${selectedColor === c ? 'active' : ''}`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div style={{ marginTop: '20px' }}>
              <div className="variant-label" style={{ marginBottom: '10px' }}>Quantity</div>
              <div className="qty-selector">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
                  <Minus size={15} />
                </button>
                <input
                  type="number"
                  className="qty-input"
                  value={qty}
                  min={1}
                  max={product.stock}
                  onChange={e => setQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  readOnly
                />
                <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="product-actions">
              <button className="btn btn-dark" style={{ flex: 2 }} onClick={handleAddToCart}>
                <ShoppingBag size={16} />
                Add to Cart
              </button>
              <button
                className={`btn ${wished ? 'btn-outline' : 'btn-outline'}`}
                style={{ flex: 1, color: wished ? '#e53e3e' : undefined, borderColor: wished ? '#e53e3e' : undefined }}
                onClick={() => { toggleWishlist(product); toast(wished ? 'Removed from wishlist' : '❤️ Saved to wishlist!', { position: 'bottom-right', style: { background: '#1A1A1A', color: '#fff', borderRadius: '8px', fontSize: '13.5px' } }); }}
              >
                <Heart size={16} fill={wished ? '#e53e3e' : 'none'} />
                {wished ? 'Saved' : 'Wishlist'}
              </button>
            </div>

            {/* Meta */}
            <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['Material', product.material],
                ['Frame Type', product.frameType.charAt(0).toUpperCase() + product.frameType.slice(1)],
                ['Stock', `${product.stock} available`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '12px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--color-text-muted)', width: '80px', flexShrink: 0 }}>{label}:</span>
                  <span style={{ color: 'var(--color-dark)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Custom CTA */}
            <div style={{ marginTop: '24px', background: 'var(--brand-gradient-soft)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '24px' }}>🎨</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary-navy)' }}>Want it personalized?</p>
                <Link to="/customize" style={{ fontSize: '13.5px', color: 'var(--color-blue)', textDecoration: 'underline', fontWeight: 600 }}>
                  Use the Custom Frame Builder →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h2 className="section-heading" style={{ fontSize: '26px' }}>You May Also Like</h2>
              <Link to="/shop" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="product-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
