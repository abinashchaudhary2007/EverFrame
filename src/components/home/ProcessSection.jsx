import { Frame, ImageIcon, Pencil, Truck } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Frame,
    title: 'Choose Your Frame',
    desc: 'Browse our collection of premium frames — wood, metal, or acrylic — in dozens of sizes and finishes.',
  },
  {
    num: '02',
    icon: ImageIcon,
    title: 'Upload Your Photo',
    desc: 'Upload a high-resolution photo directly from your phone or computer. We accept all common formats.',
  },
  {
    num: '03',
    icon: Pencil,
    title: 'Customize Your Design',
    desc: 'Add a quote, a date, or a name — our live preview shows exactly how your frame will look before we make it.',
  },
  {
    num: '04',
    icon: Truck,
    title: 'We Create & Deliver',
    desc: 'Our craftspeople bring your frame to life. We package it with care and deliver it right to your door.',
  },
];

export default function ProcessSection() {
  return (
    <section className="process-section">
      <div className="container">
        <div style={{ textAlign: 'center' }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            Process
          </div>
          <h2 className="section-heading section-heading--light">
            From Your Camera Roll to Your Wall
          </h2>
        </div>

        <div className="process-grid">
          {steps.map(step => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="process-item">
                <Icon size={28} className="process-icon" style={{ color: 'var(--color-accent)', opacity: 0.85 }} />
                <div className="process-number">{step.num}</div>
                <h3 className="process-title">{step.title}</h3>
                <p className="process-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
