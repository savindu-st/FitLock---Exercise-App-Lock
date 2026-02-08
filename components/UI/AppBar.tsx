import React from 'react';

interface AppBarProps {
  title: string;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
}

const AppBar: React.FC<AppBarProps> = ({ title, leading, actions }) => {
  return (
    <header className="h-16 bg-blue-600 shadow-md flex items-center px-4 justify-between shrink-0 z-20">
      <div className="flex items-center gap-4">
        {leading && (
          <button className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
            {leading}
          </button>
        )}
        <h1 className="text-xl font-medium text-white tracking-wide">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  );
};

export default AppBar;