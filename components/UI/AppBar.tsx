import React from 'react';

interface AppBarProps {
  title: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
}

const AppBar: React.FC<AppBarProps> = ({ title, leading, actions }) => {
  return (
    <header className="pt-12 pb-3 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md flex items-center px-4 justify-between shrink-0 z-20">
      <div className="flex items-center gap-3">
        {leading && (
          <button className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none">
            {leading}
          </button>
        )}
        <img src="/logo.png" alt="FitLock Logo" className="w-8 h-8 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.2)]" />
        <h1 className="text-lg font-semibold text-white tracking-wide">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  );
};

export default AppBar;