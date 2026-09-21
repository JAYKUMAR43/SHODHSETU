import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable BottomSheet / Modal Shell
 * Provides consistent backdrop, drag handle, header, body, and footer slots.
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

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl w-full ${maxWidthClasses[maxWidth] || maxWidthClasses['2xl']} max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-start space-x-3 pr-4">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-teal/10 text-teal border border-teal/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {badge && (
                <div className="mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal/15 text-teal-dark border border-teal/30">
                    {badge}
                  </span>
                </div>
              )}
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-navy leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {children}
        </div>

        {/* Modal Footer (if provided) */}
        {footer && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl shrink-0 flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmationModal = BottomSheet;
export default BottomSheet;
