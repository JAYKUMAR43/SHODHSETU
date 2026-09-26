import React from 'react';
import { 
  Droplet, 
  Wheat, 
  HeartPulse, 
  BookOpen, 
  Zap, 
  Leaf, 
  Building, 
  Accessibility, 
  Landmark, 
  Shirt, 
  Layers,
  Sparkles
} from 'lucide-react';

export const CATEGORY_META = {
  water_resources: { label: 'Water Resources', icon: Droplet, color: 'text-blue-400 bg-blue-500/20 border-blue-400/40' },
  agriculture: { label: 'Agriculture', icon: Wheat, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40' },
  healthcare: { label: 'Healthcare', icon: HeartPulse, color: 'text-rose-400 bg-rose-500/20 border-rose-400/40' },
  education: { label: 'Education', icon: BookOpen, color: 'text-indigo-400 bg-indigo-500/20 border-indigo-400/40' },
  energy: { label: 'Energy & Power', icon: Zap, color: 'text-amber-400 bg-amber-500/20 border-amber-400/40' },
  environment: { label: 'Environment & Mining', icon: Leaf, color: 'text-teal bg-teal/20 border-teal/40' },
  rural_livelihoods: { label: 'Rural Livelihoods', icon: Shirt, color: 'text-orange-400 bg-orange-500/20 border-orange-400/40' },
  urban_development: { label: 'Urban Development', icon: Building, color: 'text-slate-300 bg-slate-500/20 border-slate-400/40' },
  accessibility: { label: 'Accessibility', icon: Accessibility, color: 'text-purple-400 bg-purple-500/20 border-purple-400/40' },
  public_administration: { label: 'Public Administration', icon: Landmark, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-400/40' }
};

/**
 * Interactive category pill filter bar with dark glass styling and item counts.
 */
export const CategoryFilterBar = ({
  items = [],
  selectedCategory = 'all',
  onSelectCategory,
  categoryExtractor = (item) => item.category || item.challenge?.category
}) => {
  // Count items per category
  const counts = items.reduce((acc, item) => {
    const rawCat = categoryExtractor(item);
    if (!rawCat) return acc;
    const cat = String(rawCat).toLowerCase().trim();
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // List of categories that have at least 1 item
  const availableCategories = Object.keys(counts);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-extrabold text-teal uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-teal" />
          <span>Category Classification & Filter:</span>
        </span>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs font-bold text-teal hover:text-teal-light hover:underline flex items-center space-x-1"
          >
            <span>Reset to All ({items.length})</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2.5 overflow-x-auto pb-1.5 no-scrollbar">
        {/* All Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shrink-0 border ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-teal to-teal-dark text-navy border-teal shadow-glow-teal scale-102 font-extrabold'
              : 'bg-white/[0.06] text-slate-200 border-white/10 hover:border-teal/40 hover:bg-white/[0.12] hover:text-white'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${selectedCategory === 'all' ? 'text-navy' : 'text-teal'}`} />
          <span>All Problems</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
            selectedCategory === 'all' ? 'bg-navy/30 text-navy font-extrabold' : 'bg-white/10 text-slate-300'
          }`}>
            {items.length}
          </span>
        </button>

        {/* Dynamic Category Pills */}
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = counts[key] || 0;
          if (count === 0 && !availableCategories.includes(key)) {
            return null;
          }
          const Icon = meta.icon;
          const isSelected = selectedCategory === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectCategory(key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shrink-0 border ${
                isSelected
                  ? 'bg-teal text-navy border-teal shadow-glow-teal scale-102 font-extrabold'
                  : 'bg-white/[0.06] text-slate-200 border-white/10 hover:border-teal/40 hover:bg-white/[0.12] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-navy' : 'text-teal'}`} />
              <span>{meta.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                isSelected ? 'bg-navy/30 text-navy font-extrabold' : 'bg-white/10 text-slate-300 font-semibold'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilterBar;
