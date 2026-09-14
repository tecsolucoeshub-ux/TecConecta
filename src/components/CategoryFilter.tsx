import React from 'react';
import { CATEGORIES } from '../data/categories';
import { Sparkles } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  customCategories?: string[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  customCategories = [],
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name || (cat.id === 'all' && selectedCategory === 'all');
          return (
            <button
              key={cat.id}
              id={`filter-cat-${cat.id}`}
              onClick={() => onSelectCategory(cat.id === 'all' ? 'all' : cat.name)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#00E5FF] text-[#0B132B] font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-105'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:border-[#00E5FF]/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}

        {/* Dynamic custom categories registered by users or administration */}
        {customCategories.map((customName) => {
          const isSelected = selectedCategory === customName;
          return (
            <button
              key={`custom-${customName}`}
              onClick={() => onSelectCategory(customName)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#FF6B00] text-white font-bold shadow-[0_0_15px_rgba(255,107,0,0.4)] scale-105'
                  : 'bg-white/5 text-[#00E5FF] border border-[#00E5FF]/30 hover:border-[#00E5FF] hover:bg-[#00E5FF]/10'
              }`}
              title={`Filtrar por categoria personalizada: ${customName}`}
            >
              <Sparkles className="w-3 h-3 text-[#FF6B00]" />
              <span>{customName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
