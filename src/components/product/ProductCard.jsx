import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Rating from '../ui/Rating';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const wished = isWishlisted(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`, {
      position: 'bottom-right',
      style: {
        borderRadius: '8px',
        background: '#1A1A1A',
        color: '#fff',
        fontSize: '13.5px',
      },
      iconTheme: { primary: 'var(--color-accent)', secondary: '#fff' },
    });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast(wished ? 'Removed from wishlist' : 'Added to wishlist!', {
      icon: wished ? '💔' : '❤️',
      position: 'bottom-right',
      style: {
        borderRadius: '8px',
        background: '#1A1A1A',
        color: '#fff',
        fontSize: '13.5px',
      },
    });
  };

  return (
    <Link to={`/product/${product.slug}`} className="product-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
      <div className="product-card-image">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
        />

        {/* Badges */}
        <div className="product-card-badges">
          {product.discount && (
            <span className="badge badge-accent">{product.discount}% off</span>
          )}
          {product.badge === 'BESTSELLER' && (
            <span className="badge badge-dark">Bestseller</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          className={`wishlist-btn ${wished ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={wished ? '#e53e3e' : 'none'} color={wished ? '#e53e3e' : 'currentColor'} />
        </button>
      </div>

      <div className="product-card-body">
        <p className="product-category">{product.categoryLabel}</p>
        <h3 className="product-name">{product.name}</h3>
        <Rating rating={product.rating} count={product.reviewCount} size={13} />
        <div className="product-price">
          <span className="price-current">NPR {product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="price-original">NPR {product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        <button
          className="btn btn-dark btn-full"
          style={{ fontSize: '13px', padding: '10px' }}
          onClick={handleAddToCart}
        >
          <ShoppingBag size={14} />
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
