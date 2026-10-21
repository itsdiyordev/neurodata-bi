import React from 'react';

export const Logo: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Brand Icon SVG (Crafted following logo-design & optical alignment principles) */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/30 shadow-glow-indigo">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-indigo-400"
        >
          {/* Central analytical neural core */}
          <polygon
            points="16,3 27,9 27,23 16,29 5,23 5,9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            className="opacity-70"
          />
          {/* Inner data nodes & neural connections */}
          <circle cx="16" cy="16" r="2.5" fill="#818CF8" />
          <line x1="16" y1="16" x2="16" y2="6" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="16" x2="25" y2="21" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="16" x2="7" y2="21" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
          {/* Surrounding intelligence orbits */}
          <circle cx="16" cy="6" r="1.5" fill="#C7D2FE" />
          <circle cx="25" cy="21" r="1.5" fill="#E9D5FF" />
          <circle cx="7" cy="21" r="1.5" fill="#A7F3D0" />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white font-sans">
              NeuroData <span className="text-indigo-400">BI</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
              DuckDB &bull; Gemini 2.5
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
