import { Link } from 'react-router-dom';
import { categories } from '../data/products';
import { products } from '../data/products';

const categoryImages = {
  'photo-frames': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
  'wedding-frames': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
  'wall-art': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'personalized-gifts': 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80',
  'collage-frames': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80',
};

export default function Categories() {
  const cats = categories.filter(c => c.id !== 'all');

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ background: 'var(--color-primary-navy)', padding: '80px 0', textAlign: 'center' }}>
        <div className="section-label" style={{ justifyContent: 'center', marginBottom: '16px' }}>Browse</div>
        <h1 className="section-heading section-heading--light">Shop by Category</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginTop: '12px' }}>
          Find the perfect frame for every occasion
        </p>
      </div>

      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {cats.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.id}`}
                style={{ textDecoration: 'none', display: 'block', borderRadius: '12px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3', boxShadow: 'var(--shadow-md)' }}
              >
                <img
                  src={categoryImages[cat.id]}
                  alt={cat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{cat.name}</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{count} product{count !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
