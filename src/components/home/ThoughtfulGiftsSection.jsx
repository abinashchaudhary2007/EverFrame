import { Link } from 'react-router-dom';

const gifts = [
  {
    emoji: '💍',
    title: 'Wedding Gifts',
    desc: 'A custom frame with the couple\'s photo and date — a keepsake they\'ll treasure forever.',
    link: '/shop?category=wedding-frames',
  },
  {
    emoji: '🎂',
    title: 'Birthday Surprises',
    desc: 'Make their birthday unforgettable with a personalized frame filled with your favorite memories.',
    link: '/shop?category=personalized-gifts',
  },
  {
    emoji: '🏠',
    title: 'Housewarming',
    desc: 'Help them turn a house into a home with beautiful wall art and premium frames.',
    link: '/shop?category=wall-art',
  },
];

export default function ThoughtfulGiftsSection() {
  return (
    <section className="gifts-section">
      <div className="container">
        <div className="section-label" style={{ justifyContent: 'center', marginBottom: '16px' }}>
          Thoughtful Gifts
        </div>
        <h2 className="section-heading" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 16px' }}>
          Made for the People Who Matter Most
        </h2>
        <p className="gifts-desc">
          A frame is more than a gift. It is proof that you were paying attention — to the moments, the people, and the memories that matter.
        </p>

        <div className="gifts-grid">
          {gifts.map(gift => (
            <Link to={gift.link} key={gift.title} className="gift-card" style={{ textDecoration: 'none' }}>
              <div className="gift-icon">{gift.emoji}</div>
              <h3 className="gift-title">{gift.title}</h3>
              <p className="gift-desc">{gift.desc}</p>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Shop All Gifts
          </Link>
        </div>
      </div>
    </section>
  );
}
