import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

const steps = [
  { num: 1, label: 'Upload Photo' },
  { num: 2, label: 'Choose Frame' },
  { num: 3, label: 'Choose Size' },
  { num: 4, label: 'Add Text' },
  { num: 5, label: 'Preview' },
];

export default function CustomFrameSection() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section className="custom-frame-section">
      <div className="container">
        <div className="custom-frame-inner">
          {/* Image */}
          <div className="custom-frame-image">
            <img
              src="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=700&q=85"
              alt="Woman holding a gold frame"
              style={{ width: '100%', maxWidth: '460px', borderRadius: '12px', objectFit: 'cover', aspectRatio: '4/5' }}
            />
          </div>

          {/* Content */}
          <div>
            <div className="section-label" style={{ marginBottom: '16px' }}>
              Custom Builder
            </div>
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>
              Create a Frame That's Uniquely Yours
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px', lineHeight: '1.75', marginBottom: '32px', maxWidth: '440px' }}>
              Every EverFrame is built around your photo. Choose your material, size, and finish — then add a personal quote or date that makes it truly yours.
            </p>

            <div className="custom-frame-steps">
              {steps.map(step => (
                <div
                  key={step.num}
                  className={`step-item ${activeStep === step.num ? 'active' : ''}`}
                  onClick={() => setActiveStep(step.num)}
                >
                  <span className="step-number">{step.num}</span>
                  <span className="step-label">{step.label}</span>
                  {activeStep === step.num && (
                    <ChevronRight size={16} className="step-chevron" />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px' }}>
              <Link to="/customize" className="btn btn-primary btn-lg">
                Start Customizing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
