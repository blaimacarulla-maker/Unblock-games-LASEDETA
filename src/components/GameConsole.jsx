import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, RotateCcw, ThumbsUp, ThumbsDown, MessageSquare, Play, Calendar, User, Wifi, Info } from 'lucide-react';
import CyberMinesweeper from './CyberMinesweeper';
import RetroClicker from './RetroClicker';

export default function GameConsole({ game, onClose, onRatingUpdate }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [playSeconds, setPlaySeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0); // Trigger reload of iframe by changing key
  
  // Feedback reviews state
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem(`reviews_${game.id}`);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [
      { username: 'ArcadePro99', comment: 'Perfect frame rate! Works flawless.', timestamp: '1 hour ago' },
      { username: 'LobbyKing_2', comment: 'Highly addictive. Recommended!', timestamp: '3 hours ago' }
    ];
  });
  
  const [newUsername, setNewUsername] = useState('');
  const [newComment, setNewComment] = useState('');
  const [playerVote, setPlayerVote] = useState(() => {
    const saved = localStorage.getItem(`vote_${game.id}`);
    return saved || null;
  });

  const consoleRef = useRef(null);

  // Playtimer handler
  useEffect(() => {
    setPlaySeconds(0);
    const interval = setInterval(() => {
      setPlaySeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [game.id]);

  // Handle reload action
  const handleReload = () => {
    setIframeLoaded(false);
    setKey(prev => prev + 1);
  };

  // Upvote/downvote rate
  const handleVote = (voteType) => {
    let newRating = game.rating;
    
    if (playerVote === voteType) {
      // Undo vote
      newRating = voteType === 'up' ? game.rating - 0.1 : game.rating + 0.1;
      setPlayerVote(null);
      localStorage.removeItem(`vote_${game.id}`);
    } else {
      // Apply new vote
      if (playerVote === null) {
        newRating = voteType === 'up' ? game.rating + 0.1 : game.rating - 0.1;
      } else {
        // Change vote
        newRating = voteType === 'up' 
          ? game.rating + 0.2 
          : game.rating - 0.2;
      }
      setPlayerVote(voteType);
      localStorage.setItem(`vote_${game.id}`, voteType);
    }
    
    // Clamp rating between 1.0 and 5.0
    newRating = Math.max(1.0, Math.min(5.0, Number(newRating.toFixed(1))));
    
    const updated = { ...game, rating: newRating };
    onRatingUpdate(updated);
  };

  // Submit player feedback
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newComment.trim()) return;

    const newRev = {
      username: newUsername.trim(),
      comment: newComment.trim(),
      timestamp: 'Just now'
    };

    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${game.id}`, JSON.stringify(updatedReviews));
    setNewUsername('');
    setNewComment('');
  };

  // Format playtime duration string
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const rsecs = secs % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${mins > 0 ? mins + 'm ' : ''}${rsecs}s`;
  };

  // Fullscreen container handler
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (consoleRef.current?.requestFullscreen) {
        consoleRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Detect exit of native fullscreen to sync state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFull);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Determine if this is a built-in interactive game or an external iframe
  const isMinesweeper = game.id === 'minesweeper_internal';
  const isClicker = game.id === 'neon_clicker_internal';
  const isBuiltIn = isMinesweeper || isClicker;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto" id="game-cabinet-container">
      {/* Prime Console Screen Cabinet Column */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 text-sm gap-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span className="font-mono text-xs tracking-wider text-cyan-400 capitalize bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 font-bold">
              {game.category}
            </span>
            <h1 className="font-display font-black tracking-tight text-white text-base">{game.title}</h1>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
            <div className="hidden sm:block">
              SESSION TIMER: <span className="text-yellow-400 font-bold">{formatTime(playSeconds)}</span>
            </div>
            
            <button
              onClick={handleReload}
              className="p-1 px-2 rounded hover:bg-slate-850 hover:text-white transition-all text-slate-400 flex items-center space-x-1 border border-slate-800 cursor-pointer text-[11px]"
              title="Reload Frame"
              id="reload-frame-trigger"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RELOAD</span>
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-1 px-2 rounded hover:bg-slate-850 hover:text-white transition-all text-slate-400 flex items-center space-x-1 border border-slate-800 cursor-pointer text-[11px]"
              title="Maximize Console"
              id="toggle-fullscreen-trigger"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'WINDOW' : 'THEATER'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Monitor */}
        <div 
          ref={consoleRef} 
          className={`relative bg-black rounded-2xl border-2 border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden min-h-[480px] lg:min-h-[560px] ${
            isFullscreen ? 'w-full h-full p-0 border-0 rounded-none' : ''
          }`}
          id="main-screen-cabinet"
        >
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-[999] px-4 py-2 bg-slate-950/90 hover:bg-slate-900 text-pink-400 rounded-lg border border-slate-800 text-xs font-mono select-none"
              id="exit-fullscreen-overlay-btn"
            >
              EXIT THEATER MODE
            </button>
          )}

          {isBuiltIn ? (
            <div className="py-6 px-4 w-full flex items-center justify-center animate-fade-in">
              {isMinesweeper ? <CyberMinesweeper /> : <RetroClicker />}
            </div>
          ) : (
            <>
              {/* Iframe Loading screen overlay */}
              {!iframeLoaded && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-4 text-center p-6 z-10 transition-all">
                  <Play className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <div>
                    <h3 className="font-display font-black tracking-wide text-white">BUFFERING ARCADE LINK...</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                      Launching unblocked link directly inside secure frame environment.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-yellow-550 bg-slate-900 px-3 py-1 rounded border border-slate-800">
                    <Wifi className="w-3.5 h-3.5 text-yellow-400" />
                    <span>VERIFYING LOCAL FIREWALL BYPASS</span>
                  </div>
                </div>
              )}

              {/* Game Iframe */}
              <iframe
                key={key}
                src={game.iframeUrl}
                title={game.title}
                className="w-full h-[480px] lg:h-[560px] bg-black"
                style={{ border: 'none' }}
                allow="autoplay; fullscreen; keyboard"
                referrerPolicy="no-referrer"
                onLoad={() => setIframeLoaded(true)}
                id="active-game-iframe"
              />
            </>
          )}
        </div>

        {/* Gameplay Control Center Information Panel */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <h2 className="font-display font-extrabold text-white text-lg">HOW TO PLAY & CONTROLS</h2>
              </div>
              <p className="text-sm text-yellow-400 font-mono tracking-wide leading-relaxed bg-slate-950 border border-slate-800/80 rounded-xl p-3 shadow-inner">
                🎮 {game.controls}
              </p>
            </div>

            {/* Voting Score counter */}
            <div className="flex items-center space-x-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 shrink-0">
              <span className="text-xs font-mono text-slate-400 mr-1 block">RATE GAME:</span>
              <button
                onClick={() => handleVote('up')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  playerVote === 'up'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400'
                }`}
                title="Upvote!"
                id="rate-upvote"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleVote('down')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  playerVote === 'down'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400'
                }`}
                title="Downvote!"
                id="rate-downvote"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs text-slate-400 font-mono">
            <div>
              <span className="text-slate-500 block">RATING</span>
              <span className="text-yellow-400 text-sm font-bold">★ {game.rating.toFixed(1)} / 5.0</span>
            </div>
            <div>
              <span className="text-slate-500 block">DEVELOPER</span>
              <span className="text-slate-200 text-sm font-semibold">{game.developer}</span>
            </div>
            <div>
              <span className="text-slate-500 block">SOURCE SOURCE</span>
              <span className="text-slate-200 text-sm font-semibold truncate block">
                {isBuiltIn ? 'Internal Bundle' : 'Iframe Sandbox'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">CATEGORY</span>
              <span className="text-cyan-400 text-sm font-bold uppercase">{game.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Column Review Commentary & Info Box */}
      <div className="w-full lg:w-80 flex flex-col space-y-4 shrink-0">
        
        {/* Play Instruction Advisory Notice */}
        <div className="bg-gradient-to-br from-pink-950/20 to-slate-900 p-4 rounded-xl border border-pink-500/20 text-xs leading-relaxed space-y-3 shadow-inner">
          <div className="flex items-center space-x-1.5 text-pink-400 font-sans font-bold uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>PLAY ADVISORY</span>
          </div>
          <p className="text-slate-400">
            This unblocked portal operates entirely on client browser scripts. No cookies or server analytical trackers are embedded.
          </p>
          <div className="flex items-center space-x-1 text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last audit: May 2026</span>
          </div>
        </div>

        {/* Reviews Guestbook */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col flex-1">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-slate-805">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-bold text-slate-200 text-sm">GUESTBOOK CHAT</h3>
          </div>

          {/* Form */}
          <form onSubmit={handleAddReview} className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Username / Gamer ID..."
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-400/50 outline-none rounded-lg p-2 text-xs font-mono text-white placeholder-slate-500"
              required
              maxLength={25}
              id="chat-username"
            />
            <textarea
              placeholder="Write a comment or post your highscore..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-400/50 outline-none rounded-lg p-2 text-xs font-mono text-white placeholder-slate-500 h-20 resize-none"
              required
              maxLength={150}
              id="chat-comment"
            />
            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-br from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 hover:text-slate-900 rounded-lg text-xs font-mono font-black tracking-wider transition-all select-none active:scale-[0.98] cursor-pointer"
              id="chat-submit"
            >
              POST COMMENT
            </button>
          </form>

          {/* Comment Stream */}
          <div className="overflow-y-auto max-h-[220px] pr-1 space-y-3 divide-y divide-slate-800 bg-slate-950/30 p-2 rounded-xl border border-slate-800">
            {reviews.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-4 font-mono">No comments posted yet.</p>
            ) : (
              reviews.map((rev, index) => (
                <div key={index} className={`pt-2.5 first:pt-0 ${index === 0 ? '' : 'border-t border-slate-800/60'}`}>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-cyan-400 flex items-center space-x-1">
                      <span>👾</span>
                      <span>{rev.username}</span>
                    </span>
                    <span className="text-slate-600">{rev.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed break-words">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
