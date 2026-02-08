import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-6 right-4 w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/40 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 active:shadow-sm transition-all duration-200 z-10"
      aria-label="Add new item"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
};

export default FloatingActionButton;