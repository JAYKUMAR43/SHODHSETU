import React from 'react';

/**
 * Bharat Panchyt Official Government of Jharkhand Seal & Logo Mark
 * Featuring the official circular emblem with the golden Jharkhand state map.
 */
export const LogoMark = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11', // ~44px for header
    lg: 'w-16 h-16'
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 rounded-full overflow-hidden shadow-md ring-2 ring-teal/40 bg-navy ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-hidden="true"
    >
      <img 
        src="/jharkhand_state_emblem.jpg" 
        alt="Government of Jharkhand Seal"
        className="w-full h-full object-cover object-center rounded-full"
        onError={(e) => {
          // Fallback SVG if image not found
          e.target.style.display = 'none';
        }}
      />
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
            Bharat Panchyt
          </span>
          <span className="text-[11px] bg-teal/20 text-teal px-2 py-0.5 rounded border border-teal/40 font-medium whitespace-nowrap">
            भारत पंचायत
          </span>
        </div>
        {showSubtitle && (
          <p className={`text-[10px] -mt-0.5 font-normal tracking-normal max-w-xs truncate ${light ? 'text-slate-300' : 'text-slate-500'}`} title="People's Actual Needs Connected With Higher-Education, Youth And Technology">
            People's Actual Needs Connected With Higher-Education, Youth And Technology
          </p>
        )}
      </div>
    </div>
  );
};

export default Logo;
