import { Play, Heart, Flame, Gamepad2 } from 'lucide-react';

// Vibrant Palette theme color-mapping based on game category
const categoryColorMap = {
  puzzle: {
    badge: 'bg-emerald-400 text-slate-950 font-black',
    hoverBorder: 'hover:border-emerald-400/60',
    hoverShadow: 'hover:shadow-emerald-500/10',
    text: 'text-emerald-400'
  },
  retro: {
    badge: 'bg-amber-400 text-slate-950 font-black',
    hoverBorder: 'hover:border-amber-400/60',
    hoverShadow: 'hover:shadow-amber-500/10',
    text: 'text-amber-400'
  },
  casual: {
    badge: 'bg-yellow-400 text-slate-950 font-black',
    hoverBorder: 'hover:border-yellow-400/60',
    hoverShadow: 'hover:shadow-yellow-500/10',
    text: 'text-yellow-400'
  },
  action: {
    badge: 'bg-pink-500 text-white font-black',
    hoverBorder: 'hover:border-pink-500/60',
    hoverShadow: 'hover:shadow-pink-500/10',
    text: 'text-pink-400'
  },
  arcade: {
    badge: 'bg-cyan-400 text-slate-950 font-black',
    hoverBorder: 'hover:border-cyan-400/60',
    hoverShadow: 'hover:shadow-cyan-500/10',
    text: 'text-cyan-400'
  }
};

export default function GameCard({ game, isFavorited, onSelect, onToggleFavorite, onDelete }) {
  // Built-in status flagger
  const isBuiltIn = game.id.endsWith('_internal');

  // Lookup styling accents
  const styleConfig = categoryColorMap[game.category.toLowerCase()] || {
    badge: 'bg-cyan-400 text-slate-950 font-black',
    hoverBorder: 'hover:border-cyan-400/60',
    hoverShadow: 'hover:shadow-cyan-500/10',
    text: 'text-cyan-400'
  };

  return (
    <div
      onClick={onSelect}
      className={`group bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full relative ${styleConfig.hoverBorder} ${styleConfig.hoverShadow} hover:shadow-xl hover:-translate-y-0.5`}
      id={`game-card-${game.id}`}
    >
      {/* Thumbnail Banner */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-950">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay with a stylized Play button badge */}
        <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white p-1 hover:scale-110 active:scale-95 shadow-lg shadow-cyan-500/40 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {game.isFeatured && (
            <span className="flex items-center space-x-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-mono font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
              <Flame className="w-3 h-3 fill-white animate-bounce" />
              <span>HOT</span>
            </span>
          )}
          {isBuiltIn && (
            <span className="flex items-center space-x-1 bg-slate-800/90 text-cyan-400 border border-cyan-400/30 font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md backdrop-blur-xs">
              <Gamepad2 className="w-3 h-3" />
              <span>BUILT-IN</span>
            </span>
          )}
          {game.isCustom && (
            <span className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 font-mono font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md">
              <span>MINE</span>
            </span>
          )}
        </div>

        {/* Favorite Icon button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-xl transition-all shadow-md ${
            isFavorited
              ? 'bg-gradient-to-tr from-pink-500 to-rose-600 text-white border border-pink-400/40 hover:scale-105'
              : 'bg-slate-950/70 backdrop-blur-sm text-slate-400 hover:text-pink-400 hover:bg-slate-950/90'
          }`}
          id={`favorite-toggle-${game.id}`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Info Content details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`font-mono text-[10px] tracking-widest uppercase font-bold ${styleConfig.text}`}>
              {game.category}
            </span>
            <span className="font-mono text-[10px] font-bold text-yellow-400 flex items-center gap-0.5">
              🚀 {game.rating.toFixed(1)}
            </span>
          </div>

          <h3 className="font-display font-bold text-white group-hover:text-cyan-400 transition-colors text-base line-clamp-1">
            {game.title}
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {game.description}
          </p>
        </div>

        {/* Card Footer details */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
          <span className="truncate max-w-[120px]">Dev: {game.developer}</span>
          
          {game.isCustom && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-pink-500 hover:text-pink-400 hover:underline cursor-pointer font-bold"
              id={`delete-game-${game.id}`}
            >
              DELETE GAME
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
