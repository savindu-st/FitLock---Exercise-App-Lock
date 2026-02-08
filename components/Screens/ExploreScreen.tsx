import React from 'react';
import { Image, MapPin, Star } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'Nature', color: 'bg-green-100 text-green-700' },
  { id: 2, name: 'Urban', color: 'bg-orange-100 text-orange-700' },
  { id: 3, name: 'Travel', color: 'bg-blue-100 text-blue-700' },
  { id: 4, name: 'Food', color: 'bg-red-100 text-red-700' },
];

const PLACES = [
  { id: 1, title: 'Mountain View', loc: 'California, USA', rating: 4.8, img: 1 },
  { id: 2, title: 'Kyoto Shrine', loc: 'Kyoto, Japan', rating: 4.9, img: 2 },
  { id: 3, title: 'Blue Lagoon', loc: 'Reykjavik, Iceland', rating: 4.7, img: 3 },
  { id: 4, title: 'Desert Oasis', loc: 'Dubai, UAE', rating: 4.6, img: 4 },
];

const ExploreScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Search Bar Placeholder */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        <span className="text-sm">Search destinations...</span>
      </div>

      {/* Categories Horizontal Scroll */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Categories</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat.id} className={`shrink-0 px-6 py-2.5 rounded-full font-medium text-sm transition-transform active:scale-95 ${cat.color}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry-ish Grid */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Popular Places</h3>
        <div className="grid grid-cols-2 gap-4">
          {PLACES.map(place => (
            <div key={place.id} className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="aspect-[4/5] bg-gray-200 rounded-xl mb-3 relative overflow-hidden">
                <img 
                   src={`https://picsum.photos/300/400?random=${place.img}`} 
                   alt={place.title}
                   className="w-full h-full object-cover"
                   loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm">
                    <Star size={8} className="fill-yellow-400 text-yellow-400" />
                    {place.rating}
                </div>
              </div>
              <div className="px-1">
                <h4 className="font-bold text-gray-900 text-sm mb-0.5">{place.title}</h4>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <MapPin size={10} />
                    <span className="truncate">{place.loc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExploreScreen;