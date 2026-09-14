import React from 'react';
import { List, Map as MapIcon } from 'lucide-react';
import { ViewMode } from '../types';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  count: number;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  viewMode,
  onChangeView,
  count,
}) => {
  return (
    <div className="inline-flex items-center p-1 rounded-2xl bg-[#080E21] border border-white/10 shadow-inner">
      <button
        id="btn-switch-list-mode"
        onClick={() => onChangeView('list')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
          viewMode === 'list'
            ? 'bg-gradient-to-r from-[#00E5FF] to-[#00B4D8] text-[#0B132B] shadow-[0_0_15px_rgba(0,229,255,0.35)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <List className="w-4 h-4" />
        <span>Modo Lista</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
            viewMode === 'list' ? 'bg-[#0B132B]/20 text-[#0B132B]' : 'bg-white/10 text-gray-300'
          }`}
        >
          {count}
        </span>
      </button>

      <button
        id="btn-switch-map-mode"
        onClick={() => onChangeView('map')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
          viewMode === 'map'
            ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] text-white shadow-[0_0_15px_rgba(255,107,0,0.35)]'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <MapIcon className="w-4 h-4" />
        <span>Modo Mapa</span>
      </button>
    </div>
  );
};
