import React from 'react';

/**
 * Standard Avatar component for faculty, officers, citizen reporters, and partners
 */
export const Avatar = ({ 
  src, 
  name = '', 
  size = 'md', 
  role = '', 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base'
  };

  const getInitials = (str) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Deterministic color palette for avatars based on name hash
  const getBgColor = (str) => {
    const colors = [
      'bg-navy text-white',
      'bg-steel text-white',
      'bg-teal/20 text-teal-dark',
      'bg-emerald-500/20 text-emerald-300',
      'bg-purple-100 text-purple-400',
      'bg-amber-500/20 text-amber-300'
    ];
    if (!str) return colors[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover border border-white/10 shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-heading font-bold border border-white/10 shrink-0 ${getBgColor(name)} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={role ? `${name} (${role})` : name}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
