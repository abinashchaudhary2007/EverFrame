import { Link } from 'react-router-dom';
import HeroCarousel from '../components/home/HeroCarousel';
import CustomFrameSection from '../components/home/CustomFrameSection';
import ProcessSection from '../components/home/ProcessSection';
import ThoughtfulGiftsSection from '../components/home/ThoughtfulGiftsSection';
import ProductCard from '../components/product/ProductCard';
import FeaturedCard from '../components/product/FeaturedCard';
import { products } from '../data/products';

const popularProducts = products.slice(0, 8);
const featuredProducts = products.filter(p => p.isFeatured);

export default function Home() {
  return (
    <div className="page-enter">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Featured Products - Horizontal Scroll */}
      <section className="section" style={{ background: 'var(--color-white)', paddingTop: '72px', paddingBottom: '72px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="section-label" style={{ marginBottom: '12px' }}>Featured</div>
              <h2 className="section-heading">Our Best Sellers</h2>
            </div>
            <Link to="/shop" className="btn btn-outline" style={{ flexShrink: 0 }}>
              View All
            </Link>
          </div>

          <div className="featured-scroll">
            {featuredProducts.map(product => (
              <FeaturedCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Custom Frame Builder Section */}
      <CustomFrameSection />

      {/* Popular Products Grid */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Our Collection</div>
            <h2 className="section-heading">Explore Our Frames</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', maxWidth: '480px', lineHeight: '1.7' }}>
              From classic wooden frames to personalized gifts — find the perfect frame for every moment.
            </p>
          </div>

          <div className="product-grid">
            {popularProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/shop" className="btn btn-dark btn-lg">
              Shop All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <ProcessSection />

      {/* Thoughtful Gifts Section */}
      <ThoughtfulGiftsSection />

      {/* Trust Banner */}
      <section style={{ background: 'var(--color-white)', padding: '48px 0', borderTop: '1px solid var(--color-border-light)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
            {[
              { icon: '🚚', title: 'Free Delivery', desc: 'On orders above Rs. 2,000' },
              { icon: '🎨', title: 'Custom Made', desc: 'Handcrafted to your specs' },
              { icon: '⭐', title: 'Premium Quality', desc: 'Museum-grade materials' },
              { icon: '🔄', title: 'Easy Returns', desc: '7-day return policy' },
            ].map(item => (
              <div key={item.title} className="trust-card">
                <div className="trust-icon">{item.icon}</div>
                <h4 style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-dark)', marginBottom: '4px' }}>{item.title}</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO */}
      <title>EverFrame — Premium Custom Photo Frames & Personalized Gifts | Nepal</title>
    </div>
  );
}
