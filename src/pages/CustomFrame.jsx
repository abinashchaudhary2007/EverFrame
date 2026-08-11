import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, ChevronDown, ChevronRight, ShoppingBag, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { frameOptions, frameSizes } from '../data/products';
import { useCart } from '../context/CartContext';

const STEPS = [
  { id: 1, title: 'Upload Photo' },
  { id: 2, title: 'Choose Frame' },
  { id: 3, title: 'Choose Size' },
  { id: 4, title: 'Add Text' },
  { id: 5, title: 'Preview' },
];

export default function CustomFrame() {
  const { addToCart } = useCart();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [customText, setCustomText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const completeStep = (stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    if (stepId < 5) setActiveStep(stepId + 1);
  };

  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedPhoto(url);
    completeStep(1);
    toast.success('Photo uploaded!', { position: 'bottom-right', style: { background: '#1A1A1A', color: '#fff', borderRadius: '8px' } });
  };

  const totalPrice = (selectedFrame?.price || 0) + (selectedSize?.priceAdd || 0);

  const handleAddToCart = () => {
    if (!uploadedPhoto || !selectedFrame || !selectedSize) {
      toast.error('Please complete all steps before adding to cart');
      return;
    }
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: `Custom ${selectedFrame.name} Frame`,
      slug: 'custom-frame',
      price: totalPrice,
      images: [selectedFrame.image],
      categoryLabel: 'CUSTOM FRAME',
    };
    addToCart(customProduct, 1, {
      frame: selectedFrame.name,
      size: selectedSize.label,
      text: customText,
      photo: uploadedPhoto,
    });
    toast.success('Custom frame added to cart!', {
      position: 'bottom-right',
      style: { background: '#1A1A1A', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
      iconTheme: { primary: 'var(--color-accent)', secondary: '#fff' },
    });
  };

  // Frame border style for preview
  const frameBorderStyle = () => {
    if (!selectedFrame) return { border: '12px solid #e8e2d8' };
    const styles = {
      'classic-wood': { border: '16px solid #8B6914', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)' },
      'modern-black': { border: '8px solid #111111' },
      'gold-ornate': { border: '20px solid #C9A052', boxShadow: 'inset 0 0 12px rgba(201,160,82,0.4), 0 0 0 4px #A8822F' },
      'rustic': { border: '14px solid #6B4C2A', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4)' },
      'slim-silver': { border: '5px solid #C0C0C0' },
      'white-minimalist': { border: '10px solid #FFFFFF', boxShadow: '0 0 0 1px #ddd' },
    };
    return styles[selectedFrame.id] || { border: '12px solid #e8e2d8' };
  };

  return (
    <div className="frame-builder page-enter">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div className="section-label" style={{ marginBottom: '12px' }}>Custom Builder</div>
          <h1 className="section-heading">Create a Frame That's Uniquely Yours</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', marginTop: '10px', maxWidth: '520px' }}>
            Every EverFrame is built around your photo. Choose your material, size, and finish — then add a personal quote or date that makes it truly yours.
          </p>
        </div>

        <div className="builder-grid">
          {/* LEFT: Preview */}
          <div className="preview-area">
            <div className="preview-canvas">
              <div
                className="preview-frame-outer"
                style={{ ...frameBorderStyle(), borderRadius: '4px', overflow: 'hidden', position: 'absolute', inset: '20px' }}
              >
                {uploadedPhoto ? (
                  <>
                    <img src={uploadedPhoto} alt="Your photo" className="preview-photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {customText && (
                      <div className="preview-text-overlay">{customText}</div>
                    )}
                  </>
                ) : (
                  <div className="preview-upload-prompt">
                    <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>🖼️</div>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Your photo will appear here</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Estimated Total</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-dark)' }}>
                    {totalPrice > 0 ? `NPR ${totalPrice.toLocaleString()}` : 'NPR —'}
                  </div>
                </div>
                {selectedFrame && selectedSize && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                    <div>{selectedFrame.name}</div>
                    <div>{selectedSize.label}</div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-full" onClick={handleAddToCart}>
                <ShoppingBag size={16} /> Add to Cart
              </button>
            </div>
          </div>

          {/* RIGHT: Steps */}
          <div className="builder-steps">
            {STEPS.map(step => {
              const isActive = activeStep === step.id;
              const isCompleted = completedSteps.has(step.id);

              return (
                <div
                  key={step.id}
                  className={`builder-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div
                    className="builder-step-header"
                    onClick={() => setActiveStep(step.id)}
                  >
                    <span className="builder-step-num">
                      {isCompleted ? '✓' : step.id}
                    </span>
                    <span className="builder-step-title">{step.title}</span>
                    {isActive ? <ChevronDown size={16} color="var(--color-accent)" /> : <ChevronRight size={16} color="var(--color-text-muted)" />}
                  </div>

                  <div className="builder-step-content">
                    {/* Step 1: Upload */}
                    {step.id === 1 && (
                      <div>
                        <div
                          className="upload-area"
                          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
                          onClick={() => fileInputRef.current?.click()}
                          style={{ borderColor: isDragging ? 'var(--color-accent)' : undefined, background: isDragging ? '#FBF4E8' : undefined }}
                        >
                          <Upload size={28} color="var(--color-accent)" style={{ margin: '0 auto 12px' }} />
                          <p style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--color-dark)', marginBottom: '6px' }}>
                            {uploadedPhoto ? '✓ Photo uploaded — click to change' : 'Click or drag to upload your photo'}
                          </p>
                          <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                            PNG, JPG, HEIC up to 50MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => handleFileUpload(e.target.files[0])}
                          />
                        </div>
                        {uploadedPhoto && (
                          <button className="btn btn-primary btn-full" style={{ marginTop: '12px' }} onClick={() => completeStep(1)}>
                            Continue to Choose Frame →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 2: Frame */}
                    {step.id === 2 && (
                      <div>
                        <div className="frame-options">
                          {frameOptions.map(frame => (
                            <div
                              key={frame.id}
                              className={`frame-option ${selectedFrame?.id === frame.id ? 'selected' : ''}`}
                              onClick={() => setSelectedFrame(frame)}
                            >
                              <img src={frame.image} alt={frame.name} />
                              <div className="frame-option-name">{frame.name}</div>
                              <div className="frame-option-price">NPR {frame.price.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                        {selectedFrame && (
                          <button className="btn btn-primary btn-full" style={{ marginTop: '16px' }} onClick={() => completeStep(2)}>
                            Continue →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 3: Size */}
                    {step.id === 3 && (
                      <div>
                        <div className="size-options">
                          {frameSizes.map(size => (
                            <button
                              key={size.id}
                              className={`variant-btn ${selectedSize?.id === size.id ? 'active' : ''}`}
                              onClick={() => setSelectedSize(size)}
                            >
                              {size.label}
                              {size.priceAdd > 0 && <span style={{ fontSize: '11px', marginLeft: '4px', opacity: 0.7 }}>+{size.priceAdd}</span>}
                            </button>
                          ))}
                        </div>
                        {selectedSize && (
                          <button className="btn btn-primary btn-full" style={{ marginTop: '16px' }} onClick={() => completeStep(3)}>
                            Continue →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 4: Text */}
                    {step.id === 4 && (
                      <div>
                        <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                          Add a quote, name, date, or personal message to appear on your frame.
                        </p>
                        <textarea
                          style={{
                            width: '100%', padding: '12px', border: '1.5px solid var(--color-border)',
                            borderRadius: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)',
                            resize: 'vertical', minHeight: '80px', outline: 'none',
                            transition: 'border-color 0.15s ease',
                          }}
                          placeholder="e.g. Forever & Always — August 2024"
                          value={customText}
                          onChange={e => setCustomText(e.target.value)}
                          onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                        />
                        <button className="btn btn-primary btn-full" style={{ marginTop: '12px' }} onClick={() => completeStep(4)}>
                          Continue to Preview →
                        </button>
                      </div>
                    )}

                    {/* Step 5: Preview */}
                    {step.id === 5 && (
                      <div>
                        <div style={{ background: 'var(--color-surface)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                          <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px', color: 'var(--color-dark)' }}>Your Custom Frame Summary</h4>
                          {[
                            ['Frame', selectedFrame?.name || '—'],
                            ['Size', selectedSize?.label || '—'],
                            ['Text', customText || 'None'],
                            ['Total', `NPR ${totalPrice.toLocaleString()}`],
                          ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                              <span>{label}:</span>
                              <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>{value}</span>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                          Check the live preview on the left to see exactly how your frame will look before ordering.
                        </p>
                        <button className="btn btn-primary btn-full" onClick={handleAddToCart}>
                          <ShoppingBag size={15} />
                          Add Custom Frame to Cart
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
