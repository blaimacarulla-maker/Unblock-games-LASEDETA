import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import curatedGamesData from './data/games.json';
import GameCard from './components/GameCard';
import GameConsole from './components/GameConsole';
import AddGameModal from './components/AddGameModal';
import { Search, Gamepad2, Heart, Plus, Trophy, Clock, Flame, Archive } from 'lucide-react';

export default function App() {
  // All active games (curated + custom elements)
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  
  // Filtering & Search
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom dialog toggles
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Favorites bookmarked persisted in LocalStorage
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('arcade_favorites');
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return ['pacman', '2048', 'minesweeper_internal']; // Default preset favorites
  });

  // Client Session Playtime clock (tracks total lifetime session hours/mins/secs spent browsing or playing)
  const [totalSessionSecs, setTotalSessionSecs] = useState(0);

  // Rating overrides stored locally
  const [ratingOverrides, setRatingOverrides] = useState(() => {
    const saved = localStorage.getItem('arcade_rating_overrides');
    if (saved) {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {};
  });

  // Load and merge curated games + custom games
  useEffect(() => {
    // 1. Curated games from our JSON database
    const curated = curatedGamesData || [];

    // 2. Custom games added by users stored in LocalStorage
    const customSaved = localStorage.getItem('arcade_custom_games');
    let custom = [];
    if (customSaved) {
      try {
        custom = JSON.parse(customSaved);
      } catch {
        // Fallback
      }
    }

    const merged = [...curated, ...custom].map(game => {
      // Apply rating overrides if exist
      if (ratingOverrides[game.id]) {
        return { ...game, rating: ratingOverrides[game.id] };
      }
      return game;
    });

    setGames(merged);
  }, [ratingOverrides]);

  // Persist Favorites updates
  useEffect(() => {
    localStorage.setItem('arcade_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Persistent session ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalSessionSecs(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format active playtime ticker
  const formatSessionTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Toggle Favorite handler
  const handleToggleFavorite = (gameId) => {
    setFavorites(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      } else {
        return [...prev, gameId];
      }
    });
  };

  // Upvote/Downvote rating callback within console
  const handleRatingUpdate = (updatedGame) => {
    const updatedOverrides = { ...ratingOverrides, [updatedGame.id]: updatedGame.rating };
    setRatingOverrides(updatedOverrides);
    localStorage.setItem('arcade_rating_overrides', JSON.stringify(updatedOverrides));

    // Update active games state
    setGames(prev => prev.map(g => g.id === updatedGame.id ? { ...g, rating: updatedGame.rating } : g));
  };

  // Custom game adder response
  const handleAddCustomGame = (newGame) => {
    const customSaved = localStorage.getItem('arcade_custom_games');
    let custom = [];
    if (customSaved) {
      try { custom = JSON.parse(customSaved); } catch { custom = []; }
    }

    const updatedCustom = [...custom, newGame];
    localStorage.setItem('arcade_custom_games', JSON.stringify(updatedCustom));

    // Update active games state
    setGames(prev => [...prev, newGame]);
    setIsAddModalOpen(false);
  };

  // Custom game remover
  const handleDeleteCustomGame = (gameId) => {
    const customSaved = localStorage.getItem('arcade_custom_games');
    let custom = [];
    if (customSaved) {
      try { custom = JSON.parse(customSaved); } catch { custom = []; }
    }

    const updatedCustom = custom.filter(g => g.id !== gameId);
    localStorage.setItem('arcade_custom_games', JSON.stringify(updatedCustom));

    // If active game is being deleted, close cabinet terminal
    if (selectedGame?.id === gameId) {
      setSelectedGame(null);
    }

    setGames(prev => prev.filter(g => g.id !== gameId));
  };

  // Filter & Search computation
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      // 1. Search Matcher (matches title, category, controls or developer description)
      const query = searchQuery.toLowerCase().trim();
      const textMatches = 
        game.title.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query) ||
        game.developer.toLowerCase().includes(query);

      if (query && !textMatches) {
        return false;
      }

      // 2. Category Matcher
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Featured') return game.isFeatured;
      if (activeCategory === 'Favorites') return favorites.includes(game.id);
      
      return game.category.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [games, activeCategory, favorites, searchQuery]);

  // Featured Game Hero element selection
  const heroFeaturedGame = useMemo(() => {
    // Prefer games containing isFeatured: true
    const featuredList = games.filter(g => g.isFeatured);
    return featuredList.length > 0 ? featuredList[0] : games[0];
  }, [games]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950" id="main-arcade-hub">
      
      {/* Prime Header & Navigation Bar */}
      <header className="sticky top-0 z-[100] bg-slate-950/85 backdrop-blur-md border-b border-slate-900 px-4 py-3.5 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => setSelectedGame(null)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black italic text-2xl tracking-tighter text-white uppercase flex items-center gap-1.5 leading-none animate-pulse">
                GLITCH<span className="text-cyan-400">ZONE</span>
                <span className="text-[10px] tracking-widest font-mono not-italic bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-1 font-bold">HUB</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Safe Bypass &bull; Classic Arcade Console</p>
            </div>
          </div>

          {/* Quick Stats Banner details */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-slate-400 font-mono">
            <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:border-slate-750 transition-all select-none">
              <Trophy className="w-3.5 h-3.5 text-yellow-500 mr-1.5 shrink-0" />
              <span>GAMES: <strong className="text-white font-bold">{games.length}</strong></span>
            </div>
            <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:border-slate-750 transition-all select-none">
              <Heart className="w-3.5 h-3.5 text-pink-500 mr-1.5 shrink-0 fill-current" />
              <span>FAVORITES: <strong className="text-white font-bold">{favorites.length}</strong></span>
            </div>
            <div className="flex items-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:border-slate-750 transition-all select-none">
              <Clock className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0" />
              <span>LOG: <strong className="text-white font-bold">{formatSessionTime(totalSessionSecs)}</strong></span>
            </div>
            
            {/* Custom submit button trigger */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-mono font-bold px-3.5 py-1.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-pink-500/20 text-xs shrink-0 cursor-pointer text-[11px]"
              id="header-add-game"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>ADD GAME</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 relative">
        <AnimatePresence mode="wait">
          {selectedGame ? (
            
            // Render Selected Game Panel
            <motion.div
              key="console-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Back breadcrumb */}
              <button
                onClick={() => setSelectedGame(null)}
                className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-cyan-400 font-mono transition-colors border border-slate-800 px-4 py-2 bg-slate-900 rounded-xl hover:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 select-none cursor-pointer mb-2"
                id="back-to-directory"
              >
                <span>←</span>
                <span>RETURN TO ARCADE DIRECTORY</span>
              </button>

              <GameConsole 
                game={selectedGame}
                onClose={() => setSelectedGame(null)}
                onRatingUpdate={handleRatingUpdate}
              />
            </motion.div>

          ) : (

            // Render Catalog Navigation & Grid view
            <motion.div
              key="directory-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Featured Game Hero Billboard Section */}
              {heroFeaturedGame && !searchQuery && activeCategory === 'All' && (
                <div 
                  className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
                  id="featured-hero-billboard"
                >
                  {/* Glowing purple ambient highlight background decoration */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

                  {/* Banner details */}
                  <div className="space-y-4 max-w-xl text-center md:text-left z-10">
                    <span className="inline-flex items-center space-x-1 bg-cyan-500/10 text-cyan-400 font-mono font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-cyan-400/25">
                      <Flame className="w-3.5 h-3.5 fill-current text-cyan-400 mr-1 animate-pulse" />
                      <span>RECOMMENDED FOR YOU</span>
                    </span>

                    <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
                      {heroFeaturedGame.title}
                    </h2>

                    <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                      {heroFeaturedGame.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                      <button
                        onClick={() => setSelectedGame(heroFeaturedGame)}
                        className="px-6 py-3 bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-display font-black text-sm tracking-wide rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.03] active:scale-95 transition-all flex items-center space-x-2.5 cursor-pointer"
                        id="hero-play-button"
                      >
                        <Gamepad2 className="w-4 h-4 text-slate-950" />
                        <span>LAUNCH CABIN TERMINAL</span>
                      </button>

                      <button
                        onClick={() => handleToggleFavorite(heroFeaturedGame.id)}
                        className={`p-3 rounded-2xl border transition-all ${
                          favorites.includes(heroFeaturedGame.id)
                            ? 'bg-pink-950/40 border-pink-800 text-pink-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-pink-400'
                        }`}
                        title="Bookmarked"
                        id="bookmark-hero-trigger"
                      >
                        <Heart className={`w-4.5 h-4.5 ${favorites.includes(heroFeaturedGame.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Static Mock cover thumbnail rendering */}
                  <div className="w-full md:w-80 h-44 rounded-2xl overflow-hidden shadow-2xl relative border-2 border-slate-800 shrink-0 self-stretch md:self-auto select-none">
                    <img 
                      src={heroFeaturedGame.thumbnailUrl} 
                      alt={heroFeaturedGame.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 p-4 flex flex-col justify-end">
                      <span className="font-mono text-[9px] text-slate-500 uppercase">Interactive play link</span>
                      <span className="font-sans font-semibold text-xs text-white">No ad redirects &bull; Unblocked</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtering Controls Panel & Search bar */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-sm space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  
                  {/* Category Pills Navigation */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none scroll-smooth">
                    {['All', 'Featured', 'Favorites', 'Puzzle', 'Retro', 'Casual', 'Action', 'Arcade'].map((cat) => {
                      const isActive = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all whitespace-nowrap select-none cursor-pointer ${
                            isActive
                              ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 scale-[1.02] border border-cyan-300'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                          id={`filter-pill-${cat}`}
                        >
                          {cat === 'Favorites' ? `❤️ FAVORITES` : cat.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar element */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-505 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search arcade title or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-400/50 outline-none rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 font-mono"
                      id="search-input-box"
                    />
                  </div>
                </div>
              </div>

              {/* Main Directory Catalog Grid layout */}
              <div>
                <div className="flex items-center justify-between mb-5 px-1.5">
                  <div className="flex items-center space-x-2">
                    <Archive className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-display font-black text-white text-base tracking-tight uppercase">
                      {activeCategory === 'All' ? 'ALL ARCADE CATALOG' : `${activeCategory} GAMES`}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Showing <strong className="text-slate-300 font-bold">{filteredGames.length}</strong> matching entries
                  </span>
                </div>

                {filteredGames.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4 max-w-lg mx-auto">
                    <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                    <div>
                      <h4 className="font-display font-bold text-slate-300">NO UNBLOCKED MATCHES FOUND</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed font-mono">
                        No matches correspond to the query criteria. Try clear filtering or add your custom game!
                      </p>
                    </div>
                    {/* Clear filter button */}
                    <button
                      onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-white rounded-lg text-xs font-mono transition-all cursor-pointer border border-slate-705"
                      id="reset-search-btn"
                    >
                      RESET SEARCH FILTER
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGames.map((game) => (
                      <div key={game.id} className="animate-fade-in-delayed">
                        <GameCard
                          game={game}
                          isFavorited={favorites.includes(game.id)}
                          onSelect={() => setSelectedGame(game)}
                          onToggleFavorite={() => handleToggleFavorite(game.id)}
                          onDelete={game.isCustom ? () => handleDeleteCustomGame(game.id) : undefined}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Information footer bar */}
      <footer className="bg-gray-950 border-t border-gray-900 text-xs text-gray-500 font-mono py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="space-y-1">
            <span className="block text-slate-400 font-bold font-sans text-sm">Unblocked Arcade Hub</span>
            <span className="block text-gray-600 text-[10px]">Client-side secure sandbox container bypass engine. Powered by pure HTML5.</span>
          </p>
          <div className="flex items-center space-x-2.5 text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="uppercase text-[10px]">VERIFIED CLEAN NO TRACKING PIXELS &bull; V1.2</span>
          </div>
        </div>
      </footer>

      {/* Custom Game Creation Modal Dialog */}
      {isAddModalOpen && (
        <AddGameModal 
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddCustomGame}
        />
      )}
    </div>
  );
}
