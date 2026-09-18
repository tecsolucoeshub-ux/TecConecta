import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface TecLogoProps {
  className?: string;
  showTagline?: boolean;
}

export const TecLogo: React.FC<TecLogoProps> = ({ className = '', showTagline = true }) => {
  const { isLight } = useTheme();

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-tech DaMaceno Soluções Vector Symbol */}
      <div className="relative w-10 h-10 shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#FF6B00" />
            </linearGradient>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#00B4D8" />
            </linearGradient>
          </defs>

          {/* Outer Hexagonal Shield */}
          <polygon
            points="50,5 88,27 88,73 50,95 12,73 12,27"
            stroke="url(#logoGrad)"
            strokeWidth="3.5"
            fill="#0B132B"
          />

          {/* Circuit connection nodes */}
          <circle cx="50" cy="5" r="3" fill="#00E5FF" />
          <circle cx="88" cy="27" r="3" fill="#FF6B00" />
          <circle cx="88" cy="73" r="3" fill="#FF6B00" />
          <circle cx="50" cy="95" r="3" fill="#00E5FF" />
          <circle cx="12" cy="73" r="3" fill="#00E5FF" />
          <circle cx="12" cy="27" r="3" fill="#00E5FF" />

          {/* Stylized "T" in Cyan and "S" Interlock in Orange */}
          {/* T-bar */}
          <path
            d="M30 35 L70 35 M50 35 L50 70"
            stroke="url(#cyanGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Subtle pulse orb in center */}
          <circle cx="50" cy="52" r="4.5" fill="#FF6B00" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-['Outfit'] font-extrabold text-xl tracking-tight ${
              isLight ? 'text-[#0B132B]' : 'text-white'
            }`}
          >
            Tec<span className="text-[#00E5FF]">Conecta</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30">
            Direto
          </span>
        </div>
        {showTagline && (
          <span className={`text-[10px] font-medium tracking-wide mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            por <strong className={`${isLight ? 'text-slate-800' : 'text-gray-200'} font-semibold`}>TecSoluções</strong>
          </span>
        )}
      </div>
    </div>
  );
};
