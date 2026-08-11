import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Rating from '../ui/Rating';
import { useCart } from '../../context/CartContext';

export default function FeaturedCard({ product }) {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`, {
      position: 'bottom-right',
      style: { borderRadius: '8px', background: '#1A1A1A', color: '#fff', fontSize: '13.5px' },
      iconTheme: { primary: 'var(--color-accent)', secondary: '#fff' },
    });
  };

  return (
    <Link to={`/product/${product.slug}`} className="featured-card" style={{ textDecoration: 'none', display: 'block' }}>
      <div className="featured-card-image">
        <img src={product.images[0]} alt={product.name} loading="lazy" />
      </div>
      <div className="featured-card-body">
        <h3 className="featured-card-name">{product.name}</h3>
        <div className="featured-card-rating">
          <Rating rating={product.rating} count={product.reviewCount} size={12} />
        </div>
        <div className="featured-card-footer">
          <span className="featured-card-price">NPR {product.price.toLocaleString()}</span>
          <button
            className="btn btn-dark btn-sm"
            style={{ fontSize: '12px', padding: '7px 14px', gap: '5px' }}
            onClick={handleAddToCart}
          >
            <ShoppingBag size={13} />
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}
