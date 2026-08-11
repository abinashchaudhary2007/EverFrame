import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { products, categories } from '../data/products';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('featured');

  const filtered = useMemo(() => {
    let list = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Category
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break;
      case 'newest':     list.sort((a, b) => b.id - a.id); break;
      default:           break;
    }

    return list;
  }, [search, activeCategory, sortBy]);

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat === 'all') params.delete('category');
    else params.set('category', cat);
    setSearchParams(params);
  };

  return (
    <div className="shop-page page-enter">
      <div className="container">
        {/* Header */}
        <div className="shop-header">
          <h1 className="shop-title">Shop All Frames</h1>
          <p className="shop-subtitle">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: '20px' }}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search frames, gifts, wall art..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Toolbar */}
        <div className="shop-toolbar">
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={16} color="var(--color-text-muted)" />
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or category filter</p>
            <button className="btn btn-primary" onClick={() => { setSearch(''); setActiveCategory('all'); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
