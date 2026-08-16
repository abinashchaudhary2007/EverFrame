import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, ChevronRight, Minus, Plus, MessageSquare, Star, ThumbsUp, CheckCircle, Send, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Rating from '../components/ui/Rating';
import ProductCard from '../components/product/ProductCard';
import { products as fallbackProducts } from '../data/products';
import { getProductBySlug, getPublicProducts, normalizeProduct, getProductReviews, createProductReview } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState(fallbackProducts.map(normalizeProduct));
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [qty, setQty] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      setActiveImg(0);
      const [prod, allRes] = await Promise.all([
        getProductBySlug(slug),
        getPublicProducts(),
      ]);

      if (prod) {
        setProduct(prod);
        setSelectedSize(prod.sizes?.[0] || '');
        setSelectedColor(prod.colors?.[0] || '');
        loadReviews(prod.slug, prod.id);
      } else {
        // fallback
        const fallback = fallbackProducts.find(p => p.slug === slug);
        if (fallback) {
          const norm = normalizeProduct(fallback);
          setProduct(norm);
          setSelectedSize(norm.sizes?.[0] || '');
          setSelectedColor(norm.colors?.[0] || '');
          loadReviews(norm.slug, norm.id);
        } else {
          setProduct(null);
        }
      }

      if (allRes?.data?.length > 0) {
        setAllProducts(allRes.data);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const loadReviews = async (pSlug, pId) => {
    setLoadingReviews(true);
    const data = await getProductReviews(pSlug, pId);
    setReviews(data);
    setLoadingReviews(false);
  };

  const handleToggleHelpful = (reviewId) => {
    setHelpfulMap(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim()) {
      toast.error('Please enter your name and review comment');
      return;
    }
    setSubmittingReview(true);
    const result = await createProductReview({
      product_slug: product.slug,
      product_id: product.id,
      user_name: reviewerName,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
    });
    setSubmittingReview(false);

    if (result.success && result.review) {
      setReviews(prev => [result.review, ...prev]);
      setShowReviewForm(false);
      setReviewerName('');
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      toast.success('Thank you! Your review has been published ✨', {
        position: 'bottom-right',
        style: { background: '#172A72', color: '#fff', borderRadius: '8px' }
      });
    } else {
      toast.error('Could not post review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>Loading product details...</p>
      </div>
    );
  }

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
  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, qty, { size: selectedSize, color: selectedColor });
    toast.success(`${product.name} added to cart!`, {
      position: 'bottom-right',
      style: { borderRadius: '8px', background: '#1A1A1A', color: '#fff', fontSize: '13.5px' },
      iconTheme: { primary: 'var(--color-accent)', secondary: '#fff' },
    });
  };

  // Compute rating metrics
  const totalReviewsCount = reviews.length || product.reviewCount || 1;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : (product.rating || 5.0).toFixed(1);

  const starCounts = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => Math.round(r.rating) === stars).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : (stars === 5 ? 85 : stars === 4 ? 15 : 0);
    return { stars, count, pct };
  });

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
              <img src={product.images[activeImg] || product.images[0]} alt={product.name} />
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

            <div className="product-detail-rating" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <Rating rating={parseFloat(avgRating)} count={reviews.length || product.reviewCount} size={15} />
              <span style={{ fontSize: '13px', color: 'var(--color-blue)', textDecoration: 'underline', marginLeft: '6px' }}>
                ({reviews.length} customer review{reviews.length !== 1 ? 's' : ''})
              </span>
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
            {product.sizes && product.sizes.length > 0 && (
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
            )}

            {/* Color */}
            {product.colors && product.colors.length > 0 && (
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
            )}

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
                ['Material', product.material || 'Wood'],
                ['Frame Type', (product.frameType || 'Classic').charAt(0).toUpperCase() + (product.frameType || 'Classic').slice(1)],
                ['Stock', `${product.stock || 50} available`],
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

        {/* ── CUSTOMER REVIEWS & COMMENTS SECTION ──────────────────── */}
        <section id="reviews-section" style={{ marginTop: '72px', paddingTop: '48px', borderTop: '1.5px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '8px' }}>Community Feedback</div>
              <h2 className="section-heading" style={{ fontSize: '26px' }}>Customer Reviews & Comments</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
                Real feedback from verified customers who bought this frame
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowReviewForm(prev => !prev)}
              style={{ fontSize: '13.5px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MessageSquare size={16} />
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* Rating Summary Card & Form Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '28px', marginBottom: '40px', alignItems: 'start' }}>
            {/* Rating breakdown box */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
                <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--color-primary-navy)', lineHeight: 1 }}>{avgRating}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', margin: '8px 0' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={18}
                      fill={s <= Math.round(parseFloat(avgRating)) ? '#f59e0b' : 'none'}
                      color={s <= Math.round(parseFloat(avgRating)) ? '#f59e0b' : '#d1d5db'}
                    />
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Progress bars per star */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                {starCounts.map(({ stars, count, pct }) => (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
                    <span style={{ width: '40px', fontWeight: 600, color: 'var(--color-dark)' }}>{stars} ★</span>
                    <div style={{ flex: 1, height: '7px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '10px', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ width: '32px', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '11.5px' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review Form or Prompt */}
            <div>
              {showReviewForm ? (
                <div style={{ background: '#fff', border: '1.5px solid var(--color-blue)', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 24px rgba(23,42,114,0.08)' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', fontWeight: 700, color: 'var(--color-primary-navy)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--color-blue)" /> Share Your Experience
                  </h3>

                  <form onSubmit={handleSubmitReview}>
                    {/* Interactive Star Picker */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-dark)' }}>
                        Overall Rating *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {[1, 2, 3, 4, 5].map(s => {
                          const active = s <= (hoverRating || reviewRating);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewRating(s)}
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'transform 0.15s' }}
                            >
                              <Star
                                size={28}
                                fill={active ? '#f59e0b' : 'none'}
                                color={active ? '#f59e0b' : '#d1d5db'}
                              />
                            </button>
                          );
                        })}
                        <span style={{ marginLeft: '12px', fontSize: '13.5px', fontWeight: 700, color: '#f59e0b' }}>
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || reviewRating]}
                        </span>
                      </div>
                    </div>

                    {/* Name + Title */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Your Name *</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Aarav Sharma"
                          value={reviewerName}
                          onChange={e => setReviewerName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Headline / Title (optional)</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Great quality and fast delivery!"
                          value={reviewTitle}
                          onChange={e => setReviewTitle(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="form-group">
                      <label className="form-label">Your Review & Comments *</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="What did you love about this frame? How is the finish, material quality, and glass?"
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        required
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowReviewForm(false)}
                        disabled={submittingReview}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingReview}
                        style={{ minWidth: '150px' }}
                      >
                        {submittingReview ? 'Submitting...' : <><Send size={15} /> Submit Review</>}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', border: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--color-dark)', marginBottom: '4px' }}>
                      Have you ordered this frame?
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
                      Help others in the EverFrame community by sharing your feedback and photos.
                    </p>
                  </div>
                  <button
                    className="btn btn-dark"
                    onClick={() => setShowReviewForm(true)}
                    style={{ fontSize: '13px' }}
                  >
                    <MessageSquare size={15} /> Write a Review
                  </button>
                </div>
              )}

              {/* Customer Reviews Feed */}
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, marginBottom: '18px', color: 'var(--color-dark)' }}>
                  Customer Comments ({reviews.length})
                </h3>

                {loadingReviews ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px 0' }}>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                    <MessageSquare size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-dark)' }}>No reviews yet</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '4px', marginBottom: '16px' }}>
                      Be the first to review this frame!
                    </p>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowReviewForm(true)}>
                      Write First Review
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map((rev, idx) => {
                      const isLiked = helpfulMap[rev.id || idx];
                      const initial = (rev.user_name || 'U').charAt(0).toUpperCase();
                      return (
                        <div
                          key={rev.id || idx}
                          style={{
                            background: '#fff',
                            borderRadius: '14px',
                            padding: '22px',
                            border: '1px solid var(--color-border-light)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                            transition: 'border-color 0.2s'
                          }}
                        >
                          {/* Reviewer Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Avatar */}
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--brand-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                                {initial}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-dark)' }}>{rev.user_name}</span>
                                  {rev.is_verified && (
                                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#eef9ee', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <CheckCircle size={11} /> Verified Buyer
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                  {/* Stars */}
                                  <div style={{ display: 'flex', gap: '2px' }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star
                                        key={s}
                                        size={13}
                                        fill={s <= (rev.rating || 5) ? '#f59e0b' : 'none'}
                                        color={s <= (rev.rating || 5) ? '#f59e0b' : '#d1d5db'}
                                      />
                                    ))}
                                  </div>
                                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                                    {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Title */}
                          {rev.title && (
                            <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-primary-navy)', marginBottom: '6px' }}>
                              {rev.title}
                            </div>
                          )}

                          {/* Review Comment */}
                          <p style={{ fontSize: '13.5px', color: 'var(--color-dark)', lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
                            {rev.comment}
                          </p>

                          {/* Helpful button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--color-border-light)' }}>
                            <button
                              onClick={() => handleToggleHelpful(rev.id || idx)}
                              style={{
                                background: isLiked ? '#eef2ff' : 'none',
                                border: `1px solid ${isLiked ? 'var(--color-blue)' : 'var(--color-border)'}`,
                                color: isLiked ? 'var(--color-blue)' : 'var(--color-text-muted)',
                                borderRadius: '20px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: isLiked ? 700 : 500,
                              }}
                            >
                              <ThumbsUp size={12} fill={isLiked ? 'currentColor' : 'none'} />
                              Helpful {isLiked ? '(1)' : ''}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

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
