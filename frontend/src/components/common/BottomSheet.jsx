import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Reusable BottomSheet / Modal Shell
 * Modern Antigravity Dark Luxury Glassmorphism modal shell.
 * Rendered directly into document.body using createPortal so it is never trapped
 * inside transformed containers (such as .animate-fade-in-up) or hidden behind sticky headers.
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon: Icon,
  children,
  footer,
  maxWidth = '2xl',
  className = ''
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] bg-[#060E1A]/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-[#0E1F36] text-white rounded-t-2xl sm:rounded-2xl w-full ${maxWidthClasses[maxWidth] || maxWidthClasses['2xl']} max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-slate-700 animate-modal-enter ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-white/10 shrink-0">
          <div className="flex items-start space-x-3.5 pr-4">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-teal/20 text-teal border border-teal/40 flex items-center justify-center shrink-0 mt-0.5 shadow-glow-teal">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {badge && (
                <div className="mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal/20 text-teal border border-teal/40">
                    {badge}
                  </span>
                </div>
              )}
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-white leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-slate-200">
          {children}
        </div>

        {/* Modal Footer Slot */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end space-x-3 shrink-0 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BottomSheet;
