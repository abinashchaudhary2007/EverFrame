import { Star } from 'lucide-react';

export default function Rating({ rating, count, size = 14 }) {
  return (
    <div className="product-rating">
      <div className="stars">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            size={size}
            fill={s <= Math.round(rating) ? 'var(--color-accent)' : 'none'}
            color={s <= Math.round(rating) ? 'var(--color-accent)' : 'var(--color-border)'}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="rating-count">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
