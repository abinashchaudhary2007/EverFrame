import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CopyButton({ text, label, className = '', style = {} }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied "${text}"`, {
      position: 'bottom-right',
      style: { background: '#172A72', color: '#fff', borderRadius: '8px', fontSize: '13px' },
      iconTheme: { primary: '#22c55e', secondary: '#fff' }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        border: '1px solid var(--color-border)',
        background: copied ? '#F0FDF4' : 'var(--color-surface)',
        color: copied ? '#16A34A' : 'var(--color-text-muted)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {copied ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
      {copied ? 'Copied!' : (label !== undefined ? label : 'Copy')}
    </button>
  );
}
