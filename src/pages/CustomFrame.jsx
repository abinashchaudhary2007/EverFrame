import { useState, useRef } from 'react';
import { Upload, ChevronDown, ChevronRight, ShoppingBag, Sparkles, Image as ImageIcon, Check, Sliders, Type, Frame, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { frameOptions, frameSizes, samplePhotos, mattingOptions } from '../data/products';
import { useCart } from '../context/CartContext';

const STEPS = [
  { id: 1, title: 'Upload or Select Photo', icon: ImageIcon },
  { id: 2, title: 'Choose Frame Design', icon: Frame },
  { id: 3, title: 'Mat Board (Passe-Partout)', icon: Sliders },
  { id: 4, title: 'Size & Orientation', icon: Sliders },
  { id: 5, title: 'Personal Inscription', icon: Type },
  { id: 6, title: 'Review & Order', icon: Eye },
];

const FRAME_CATEGORIES = ['All', 'Wooden', 'Modern', 'Vintage', 'Rustic', 'Minimalist'];

export default function CustomFrame() {
  const { addToCart } = useCart();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set([1, 2, 3, 4]));
  
  // Selection states
  const [uploadedPhoto, setUploadedPhoto] = useState(samplePhotos[0].url);
  const [photoTitle, setPhotoTitle] = useState('Sample Photo');
  const [selectedFrame, setSelectedFrame] = useState(frameOptions[0]);
  const [selectedMat, setSelectedMat] = useState(mattingOptions[1]); // Default to Museum White
  const [selectedSize, setSelectedSize] = useState(frameSizes[2]); // Default 8x10
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape' | 'square'
  const [glassGloss, setGlassGloss] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Text & Plaque states
  const [customText, setCustomText] = useState('');
  const [plaqueStyle, setPlaqueStyle] = useState('brass'); // 'brass' | 'mat-script' | 'modern'
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const completeStep = (stepId) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    if (stepId < STEPS.length) setActiveStep(stepId + 1);
  };

  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload a valid JPG or PNG image file');
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedPhoto(url);
    setPhotoTitle(file.name || 'Your Photo');
    completeStep(1);
    toast.success('Photo loaded successfully! 🎉', {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px' }
    });
  };

  const handleSelectSample = (sample) => {
    setUploadedPhoto(sample.url);
    setPhotoTitle(sample.title);
    completeStep(1);
    toast.success(`Loaded "${sample.title}"`, {
      position: 'bottom-right',
      duration: 2000,
      style: { background: '#172A72', color: '#fff', borderRadius: '8px', fontSize: '13px' }
    });
  };

  const totalPrice = (selectedFrame?.price || 0) + (selectedSize?.priceAdd || 0) + (selectedMat?.priceAdd || 0);

  const handleAddToCart = () => {
    if (!uploadedPhoto || !selectedFrame || !selectedSize) {
      toast.error('Please configure your frame before adding to cart');
      return;
    }
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: `Custom ${selectedFrame.name} (${selectedSize.label})`,
      slug: 'custom-frame',
      price: totalPrice,
      images: [selectedFrame.image, uploadedPhoto],
      categoryLabel: 'CUSTOM FRAME',
    };
    addToCart(customProduct, 1, {
      frame: selectedFrame.name,
      material: selectedFrame.material,
      size: selectedSize.label,
      matting: selectedMat.label,
      orientation,
      text: customText || null,
      plaqueStyle: customText ? plaqueStyle : null,
      photo: uploadedPhoto,
    });
    toast.success('Custom frame added to cart! 🛒', {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
      iconTheme: { primary: '#F59E0B', secondary: '#fff' },
    });
  };

  // Compute realistic frame borders and dimensional styles for the preview visualizer
  const getFrameStyling = () => {
    const frameId = selectedFrame?.id || 'classic-wood';

    switch (frameId) {
      case 'classic-wood':
        return {
          border: '18px solid #5C3A21',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6), 0 16px 36px rgba(0,0,0,0.35)',
          background: '#5C3A21',
        };
      case 'modern-black':
        return {
          border: '14px solid #111418',
          boxShadow: 'inset 0 0 4px rgba(255,255,255,0.1), 0 16px 36px rgba(0,0,0,0.4)',
          background: '#111418',
        };
      case 'gold-ornate':
        return {
          border: '22px solid #D4AF37',
          outline: '3px solid #8C6D1F',
          outlineOffset: '-7px',
          boxShadow: 'inset 0 0 14px rgba(0,0,0,0.45), 0 18px 40px rgba(184, 134, 11, 0.35)',
          background: 'linear-gradient(135deg, #FFDF73 0%, #D4AF37 50%, #AA820A 100%)',
        };
      case 'rustic':
        return {
          border: '18px solid #6E5339',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.7), 0 14px 30px rgba(0,0,0,0.35)',
          background: '#6E5339',
        };
      case 'vintage-mahogany':
        return {
          border: '20px solid #4A151B',
          outline: '2.5px solid #D4AF37',
          outlineOffset: '-5px',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 18px 40px rgba(0,0,0,0.4)',
          background: '#4A151B',
        };
      case 'slim-silver':
        return {
          border: '10px solid #D1D5DB',
          boxShadow: 'inset 0 0 6px rgba(255,255,255,0.8), 0 14px 30px rgba(0,0,0,0.25)',
          background: 'linear-gradient(135deg, #F3F4F6 0%, #9CA3AF 100%)',
        };
      case 'white-minimalist':
        return {
          border: '16px solid #FFFFFF',
          boxShadow: '0 0 0 1px #E5E7EB, inset 0 0 8px rgba(0,0,0,0.06), 0 16px 36px rgba(0,0,0,0.18)',
          background: '#FFFFFF',
        };
      case 'rose-gold':
        return {
          border: '16px solid #C98A7D',
          boxShadow: 'inset 0 0 10px rgba(255,255,255,0.6), 0 16px 36px rgba(201, 138, 125, 0.35)',
          background: 'linear-gradient(135deg, #FAD0C4 0%, #C98A7D 100%)',
        };
      case 'acrylic-float':
        return {
          border: '22px solid rgba(255,255,255,0.45)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.3)',
          background: 'rgba(255,255,255,0.25)',
        };
      case 'deep-shadowbox':
        return {
          border: '24px solid #1E232A',
          boxShadow: 'inset 0 0 16px rgba(0,0,0,0.9), 0 20px 44px rgba(0,0,0,0.45)',
          background: '#1E232A',
        };
      default:
        return {
          border: '16px solid #5C3A21',
          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
        };
    }
  };

  const filteredFrames = categoryFilter === 'All'
    ? frameOptions
    : frameOptions.filter(f => f.category === categoryFilter);

  // Aspect ratio calculation
  const getAspectRatio = () => {
    if (orientation === 'landscape') return '4 / 3';
    if (orientation === 'square') return '1 / 1';
    return '3 / 4';
  };

  return (
    <div className="frame-builder page-enter">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div className="section-label" style={{ marginBottom: '8px' }}>
            <Sparkles size={14} color="var(--color-pink)" /> Custom Frame Studio
          </div>
          <h1 className="section-heading" style={{ fontSize: 'clamp(24px, 4vw, 36px)', marginBottom: '8px' }}>
            Design Your Museum-Quality Custom Frame
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px', maxWidth: '640px', lineHeight: 1.6 }}>
            Upload your precious photo or pick a sample below. Explore handcrafted timber, royal ornate gold, modern matte finishes, and authentic museum matting in real-time.
          </p>
        </div>

        <div className="builder-grid">
          
          {/* ====================================================
              LEFT: LIVE 3D INTERACTIVE VISUALIZER
             ==================================================== */}
          <div className="preview-area" style={{ position: 'sticky', top: '100px' }}>
            
            {/* Visualizer Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '12px 12px 0 0',
              padding: '10px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                  Orientation:
                </span>
                <div style={{ display: 'inline-flex', background: 'var(--color-white)', borderRadius: '8px', padding: '2px', border: '1px solid var(--color-border)' }}>
                  {[
                    { id: 'portrait', label: 'Portrait' },
                    { id: 'landscape', label: 'Landscape' },
                    { id: 'square', label: 'Square' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrientation(opt.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: orientation === opt.id ? 700 : 500,
                        background: orientation === opt.id ? 'var(--color-primary-navy)' : 'transparent',
                        color: orientation === opt.id ? '#ffffff' : 'var(--color-text-muted)',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Glaze reflection toggle */}
              <button
                type="button"
                onClick={() => setGlassGloss(g => !g)}
                title="Toggle Glass Reflection Effect"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: glassGloss ? 'var(--color-blue)' : 'var(--color-text-muted)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={13} />
                <span>{glassGloss ? 'Gloss Glass' : 'Matte Glass'}</span>
              </button>
            </div>

            {/* Main Stage Canvas */}
            <div style={{
              background: 'radial-gradient(circle at center, #2C3549 0%, #151A2C 100%)',
              padding: '36px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '440px',
              borderLeft: '1px solid var(--color-border-light)',
              borderRight: '1px solid var(--color-border-light)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              
              {/* Subtle background wall texture */}
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.08,
                backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />

              {/* Physical Frame Assembly */}
              <div
                style={{
                  ...getFrameStyling(),
                  width: '100%',
                  maxWidth: orientation === 'landscape' ? '460px' : orientation === 'square' ? '380px' : '350px',
                  aspectRatio: getAspectRatio(),
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxSizing: 'border-box',
                }}
              >
                
                {/* Acrylic Floating Standoff Bolts (if acrylic frame) */}
                {selectedFrame?.id === 'acrylic-float' && (
                  <>
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '18px', height: '18px', borderRadius: '50%', background: 'radial-gradient(circle, #f3f4f6 30%, #9ca3af 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10, border: '1px solid #475569' }} />
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '18px', height: '18px', borderRadius: '50%', background: 'radial-gradient(circle, #f3f4f6 30%, #9ca3af 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10, border: '1px solid #475569' }} />
                    <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '18px', height: '18px', borderRadius: '50%', background: 'radial-gradient(circle, #f3f4f6 30%, #9ca3af 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10, border: '1px solid #475569' }} />
                    <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '18px', height: '18px', borderRadius: '50%', background: 'radial-gradient(circle, #f3f4f6 30%, #9ca3af 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10, border: '1px solid #475569' }} />
                  </>
                )}

                {/* Inner Passe-Partout Matting Container */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: selectedMat?.color !== 'transparent' ? selectedMat.color : 'transparent',
                  padding: selectedMat?.id !== 'none' ? '20px' : '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: selectedMat?.id !== 'none' ? 'inset 0 0 6px rgba(0,0,0,0.25)' : 'none',
                  position: 'relative',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}>

                  {/* Photo Window & Artwork */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '2px',
                    boxShadow: selectedMat?.id !== 'none' ? 'inset 0 1px 4px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  }}>
                    {uploadedPhoto ? (
                      <img
                        src={uploadedPhoto}
                        alt="Your Custom Frame"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                        <ImageIcon size={44} strokeWidth={1.5} />
                        <span style={{ fontSize: '13px', marginTop: '8px', fontWeight: 600 }}>Select or Upload a Photo</span>
                      </div>
                    )}

                    {/* Glass Gloss Sheen Reflection */}
                    {glassGloss && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 60%)',
                      }} />
                    )}
                  </div>

                  {/* Personal Inscription on Plaque or Mat */}
                  {customText && (
                    <div style={{
                      marginTop: selectedMat?.id !== 'none' ? '8px' : '0px',
                      position: selectedMat?.id === 'none' ? 'absolute' : 'relative',
                      bottom: selectedMat?.id === 'none' ? '12px' : 'unset',
                      zIndex: 8,
                    }}>
                      {plaqueStyle === 'brass' ? (
                        <div style={{
                          background: 'linear-gradient(180deg, #F3E7C4 0%, #D4AF37 50%, #AA820A 100%)',
                          color: '#261B05',
                          padding: '3px 14px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 800,
                          fontFamily: 'serif',
                          letterSpacing: '0.08em',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                          border: '1px solid #6E530F',
                          textAlign: 'center',
                          maxWidth: '240px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {customText}
                        </div>
                      ) : plaqueStyle === 'mat-script' ? (
                        <div style={{
                          fontFamily: 'cursive',
                          fontSize: '13px',
                          fontStyle: 'italic',
                          color: selectedMat?.id === 'black' || selectedMat?.id === 'navy' ? '#E2E8F0' : '#475569',
                          textAlign: 'center',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          "{customText}"
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textAlign: 'center',
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {customText}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Visualizer Bottom Summary Card */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '0 0 12px 12px',
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configured Total</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-primary-navy)', lineHeight: 1.2 }}>
                    NPR {totalPrice.toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-dark)' }}>{selectedFrame?.name}</div>
                  <div>{selectedSize?.label} · {selectedMat?.label}</div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <ShoppingBag size={18} />
                <span>Add Custom Frame to Cart · NPR {totalPrice.toLocaleString()}</span>
              </button>
            </div>

          </div>


          {/* ====================================================
              RIGHT: STEP-BY-STEP CUSTOMIZATION ACCORDION
             ==================================================== */}
          <div className="builder-steps">
            
            {/* STEP 1: Photo Selection / Upload */}
            <div className={`builder-step ${activeStep === 1 ? 'active' : ''} ${completedSteps.has(1) ? 'completed' : ''}`}>
              <div className="builder-step-header" onClick={() => setActiveStep(1)}>
                <span className="builder-step-num">{completedSteps.has(1) ? '✓' : 1}</span>
                <div style={{ flex: 1 }}>
                  <div className="builder-step-title">Upload Photo or Pick a Sample</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{photoTitle}</div>
                </div>
                {activeStep === 1 ? <ChevronDown size={18} color="var(--color-blue)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
              </div>

              {activeStep === 1 && (
                <div className="builder-step-content animate-fade-in" style={{ padding: '20px' }}>
                  
                  {/* Upload Dropzone */}
                  <div
                    className="upload-area"
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      borderColor: isDragging ? 'var(--color-blue)' : 'var(--color-border)',
                      background: isDragging ? 'var(--brand-gradient-soft)' : 'var(--color-surface)',
                      borderRadius: '12px',
                      padding: '28px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: '2px dashed var(--color-border)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Upload size={32} color="var(--color-blue)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-dark)', marginBottom: '4px' }}>
                      Click or drag your photo here
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Supports high-res JPG, PNG, HEIC up to 50MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleFileUpload(e.target.files[0])}
                    />
                  </div>

                  {/* Sample Photos Gallery */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                      Or choose a sample photo to test:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {samplePhotos.map(sample => (
                        <div
                          key={sample.id}
                          onClick={() => handleSelectSample(sample)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            aspectRatio: '1',
                            border: uploadedPhoto === sample.url ? '2.5px solid var(--color-blue)' : '1px solid var(--color-border-light)',
                            boxShadow: uploadedPhoto === sample.url ? '0 0 0 2px rgba(99,102,241,0.25)' : 'none',
                          }}
                        >
                          <img src={sample.url} alt={sample.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', display: 'flex', alignItems: 'flex-end', padding: '6px' }}>
                            <span style={{ fontSize: '10.5px', color: '#ffffff', fontWeight: 600 }}>{sample.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => completeStep(1)}>
                    Continue to Choose Frame →
                  </button>
                </div>
              )}
            </div>


            {/* STEP 2: Frame Design Selection */}
            <div className={`builder-step ${activeStep === 2 ? 'active' : ''} ${completedSteps.has(2) ? 'completed' : ''}`}>
              <div className="builder-step-header" onClick={() => setActiveStep(2)}>
                <span className="builder-step-num">{completedSteps.has(2) ? '✓' : 2}</span>
                <div style={{ flex: 1 }}>
                  <div className="builder-step-title">Choose Frame Design & Material</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {selectedFrame ? `${selectedFrame.name} · NPR ${selectedFrame.price.toLocaleString()}` : 'Select a style'}
                  </div>
                </div>
                {activeStep === 2 ? <ChevronDown size={18} color="var(--color-blue)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
              </div>

              {activeStep === 2 && (
                <div className="builder-step-content animate-fade-in" style={{ padding: '20px' }}>
                  
                  {/* Category Filter Chips */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                    {FRAME_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: categoryFilter === cat ? 700 : 500,
                          background: categoryFilter === cat ? 'var(--color-primary-navy)' : 'var(--color-surface)',
                          color: categoryFilter === cat ? '#ffffff' : 'var(--color-text-muted)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Frame Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '12px' }}>
                    {filteredFrames.map(frame => {
                      const isSelected = selectedFrame?.id === frame.id;
                      return (
                        <div
                          key={frame.id}
                          onClick={() => setSelectedFrame(frame)}
                          style={{
                            border: isSelected ? '2px solid var(--color-blue)' : '1.5px solid var(--color-border-light)',
                            borderRadius: '12px',
                            background: isSelected ? 'var(--brand-gradient-soft)' : 'var(--color-white)',
                            padding: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={frame.image} alt={frame.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {frame.badge && (
                              <span style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: 'rgba(23, 42, 114, 0.85)',
                                color: '#ffffff',
                                fontSize: '9px',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '10px',
                                letterSpacing: '0.04em',
                                backdropFilter: 'blur(4px)',
                              }}>
                                {frame.badge}
                              </span>
                            )}
                            {isSelected && (
                              <div style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--color-blue)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Check size={13} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-dark)', lineHeight: 1.3 }}>
                              {frame.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {frame.material}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary-navy)', marginTop: '4px' }}>
                              NPR {frame.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => completeStep(2)}>
                    Continue to Mat Board →
                  </button>
                </div>
              )}
            </div>


            {/* STEP 3: Passe-Partout Mat Board Selection */}
            <div className={`builder-step ${activeStep === 3 ? 'active' : ''} ${completedSteps.has(3) ? 'completed' : ''}`}>
              <div className="builder-step-header" onClick={() => setActiveStep(3)}>
                <span className="builder-step-num">{completedSteps.has(3) ? '✓' : 3}</span>
                <div style={{ flex: 1 }}>
                  <div className="builder-step-title">Mat Board (Passe-Partout Mount)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {selectedMat ? `${selectedMat.label} (${selectedMat.priceAdd === 0 ? 'Included' : `+NPR ${selectedMat.priceAdd}`})` : 'Choose mount'}
                  </div>
                </div>
                {activeStep === 3 ? <ChevronDown size={18} color="var(--color-blue)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
              </div>

              {activeStep === 3 && (
                <div className="builder-step-content animate-fade-in" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                    Matting creates a clean museum border between your photo and frame, adding luxury depth.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mattingOptions.map(mat => {
                      const isSelected = selectedMat?.id === mat.id;
                      return (
                        <div
                          key={mat.id}
                          onClick={() => setSelectedMat(mat)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid var(--color-blue)' : '1px solid var(--color-border)',
                            background: isSelected ? 'var(--brand-gradient-soft)' : 'var(--color-white)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: mat.color === 'transparent' ? '#cbd5e1' : mat.color,
                              border: '1px solid #94a3b8',
                              boxShadow: 'inset 0 0 3px rgba(0,0,0,0.15)',
                            }} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--color-dark)' }}>{mat.label}</div>
                              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{mat.desc}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-primary-navy)' }}>
                            {mat.priceAdd === 0 ? 'Included' : `+NPR ${mat.priceAdd}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => completeStep(3)}>
                    Continue to Size & Dimensions →
                  </button>
                </div>
              )}
            </div>


            {/* STEP 4: Size & Dimensions Selection */}
            <div className={`builder-step ${activeStep === 4 ? 'active' : ''} ${completedSteps.has(4) ? 'completed' : ''}`}>
              <div className="builder-step-header" onClick={() => setActiveStep(4)}>
                <span className="builder-step-num">{completedSteps.has(4) ? '✓' : 4}</span>
                <div style={{ flex: 1 }}>
                  <div className="builder-step-title">Frame Size & Format</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {selectedSize ? `${selectedSize.label} (${selectedSize.desc})` : 'Choose size'}
                  </div>
                </div>
                {activeStep === 4 ? <ChevronDown size={18} color="var(--color-blue)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
              </div>

              {activeStep === 4 && (
                <div className="builder-step-content animate-fade-in" style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {frameSizes.map(size => {
                      const isSelected = selectedSize?.id === size.id;
                      return (
                        <div
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          style={{
                            border: isSelected ? '2px solid var(--color-blue)' : '1px solid var(--color-border)',
                            borderRadius: '10px',
                            background: isSelected ? 'var(--brand-gradient-soft)' : 'var(--color-white)',
                            padding: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-dark)' }}>{size.label}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{size.desc}</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-blue)', marginTop: '6px' }}>
                            {size.priceAdd === 0 ? 'Standard Size' : `+NPR ${size.priceAdd}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => completeStep(4)}>
                    Continue to Inscription →
                  </button>
                </div>
              )}
            </div>


            {/* STEP 5: Personal Inscription / Plaque */}
            <div className={`builder-step ${activeStep === 5 ? 'active' : ''} ${completedSteps.has(5) ? 'completed' : ''}`}>
              <div className="builder-step-header" onClick={() => setActiveStep(5)}>
                <span className="builder-step-num">{completedSteps.has(5) ? '✓' : 5}</span>
                <div style={{ flex: 1 }}>
                  <div className="builder-step-title">Personal Quote or Inscription</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {customText ? `"${customText}"` : 'Optional engraving'}
                  </div>
                </div>
                {activeStep === 5 ? <ChevronDown size={18} color="var(--color-blue)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
              </div>

              {activeStep === 5 && (
                <div className="builder-step-content animate-fade-in" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                    Add a special anniversary date, names, or meaningful quote that will be custom inscribed on your frame.
                  </p>

                  <input
                    type="text"
                    maxLength={60}
                    placeholder="e.g. Aarav & Shreya — 24 Nov 2024"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'var(--font-sans)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-dark)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />

                  {customText && (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        Plaque Style:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {[
                          { id: 'brass', label: 'Brass Plaque' },
                          { id: 'mat-script', label: 'Mat Calligraphy' },
                          { id: 'modern', label: 'Modern Minimal' },
                        ].map(pl => (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => setPlaqueStyle(pl.id)}
                            style={{
                              padding: '8px',
                              fontSize: '11.5px',
                              fontWeight: plaqueStyle === pl.id ? 700 : 500,
                              background: plaqueStyle === pl.id ? 'var(--color-primary-navy)' : 'var(--color-surface)',
                              color: plaqueStyle === pl.id ? '#ffffff' : 'var(--color-text)',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer',
                            }}
                          >
                            {pl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => completeStep(5)}>
                    Review & Complete Frame →
                  </button>
                </div>
              )}
            </div>


            {/* STEP 6: Final Review & Order */}
            <div className={`builder-step ${activeStep === 6 ? 'active' : ''} ${completedSteps.has(6) ? 'completed' : ''}`}>
              <div className="builder-step-header" onClick={() => setActiveStep(6)}>
                <span className="builder-step-num">{completedSteps.has(6) ? '✓' : 6}</span>
                <div style={{ flex: 1 }}>
                  <div className="builder-step-title">Final Review & Add to Cart</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ready to craft</div>
                </div>
                {activeStep === 6 ? <ChevronDown size={18} color="var(--color-blue)" /> : <ChevronRight size={18} color="var(--color-text-muted)" />}
              </div>

              {activeStep === 6 && (
                <div className="builder-step-content animate-fade-in" style={{ padding: '20px' }}>
                  
                  <div style={{ background: 'var(--color-surface)', borderRadius: '10px', padding: '16px', border: '1px solid var(--color-border-light)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary-navy)', marginBottom: '12px' }}>
                      Order Summary Specifications
                    </div>
                    {[
                      ['Frame Model', selectedFrame?.name],
                      ['Material', selectedFrame?.material],
                      ['Frame Size', selectedSize?.label],
                      ['Matting Mount', selectedMat?.label],
                      ['Orientation', orientation.toUpperCase()],
                      ['Personal Inscription', customText || 'None'],
                      ['Total Price', `NPR ${totalPrice.toLocaleString()}`],
                    ].map(([lbl, val]) => (
                      <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: '1px dashed var(--color-border-light)' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{lbl}:</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-dark)' }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                    📦 Handcrafted upon order in Kathmandu. Comes pre-assembled with hanging hardware and museum backing.
                  </p>

                  <button
                    className="btn btn-primary"
                    onClick={handleAddToCart}
                    style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <ShoppingBag size={18} />
                    <span>Add to Cart · NPR {totalPrice.toLocaleString()}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
