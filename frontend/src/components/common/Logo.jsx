import React from 'react';

/**
 * Single Canonical ShodhSetu Logo
 * Shield & Checkmark / Innovation mark with Manrope typography
 */
export const LogoMark = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-2xl'
  };

  return (
    <div 
      className={`relative rounded-xl bg-gradient-to-br from-navy to-navy-light border border-teal/40 flex items-center justify-center text-teal font-extrabold shadow-md transition-transform group-hover:scale-105 shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-hidden="true"
    >
      {/* Shield/Checkmark Emblem SVG */}
      <svg 
        viewBox="0 0 32 32" 
        className="w-3/5 h-3/5 text-teal fill-none stroke-current stroke-[2.2] stroke-linecap-round stroke-linejoin-round drop-shadow"
      >
        {/* Shield contour */}
        <path d="M16 3 L27 7 C27 18, 16 28, 16 28 C16 28, 5 18, 5 7 Z" className="fill-teal/15 stroke-teal" />
        {/* Verified checkmark representing resolved grassroots innovation */}
        <path d="M11 15.5 L14.5 19 L21 12" className="stroke-white stroke-[2.5]" />
      </svg>
    </div>
  );
};

export const Logo = ({ 
  size = 'md', 
  light = true, 
  showSubtitle = true, 
  className = '' 
}) => {
  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <LogoMark size={size} />
      <div className="text-left">
        <div className="flex items-center space-x-2">
          <span className={`font-heading font-extrabold tracking-tight ${titleSizes[size] || titleSizes.md} ${light ? 'text-white' : 'text-navy'}`}>
            ShodhSetu
          </span>
          <span className="text-[11px] bg-teal/20 text-teal px-2 py-0.5 rounded border border-teal/40 font-medium whitespace-nowrap">
            शोध सेतु
          </span>
        </div>
        {showSubtitle && (
          <p className={`text-[11px] -mt-0.5 font-normal tracking-normal ${light ? 'text-slate-300' : 'text-slate-500'}`}>
            Societal Innovation & Research Mobilizer
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;
