import { useState } from 'react';
import { X, Plus, Sparkles, AlertCircle } from 'lucide-react';

// Random stock gaming-background cover pictures from Unsplash for custom submissions
const BANNER_SAMPLES = [
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80"
];

export default function AddGameModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  const [category, setCategory] = useState('Arcade');
  const [controls, setControls] = useState('Arrow keys / mouse to control');
  const [developer, setDeveloper] = useState('My Custom Loader');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Field Val
    if (!title.trim() || !iframeUrl.trim()) {
      setErrorMsg('Title and Iframe URL are strictly required fields.');
      return;
    }

    // Format secure URL prefix check
    let formattedUrl = iframeUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      setErrorMsg('Please supply a valid secure web URL (e.g., https://example.com/game).');
      return;
    }

    // Select random background thumbnail for custom entry
    const chosenBanner = BANNER_SAMPLES[Math.floor(Math.random() * BANNER_SAMPLES.length)];

    const newlyBuilt = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'A user custom unblocked game loaded via iframe.',
      iframeUrl: formattedUrl,
      category,
      controls: controls.trim() || 'Use keyboard or mouse controls',
      rating: 5.0, // High score start rating
      thumbnailUrl: chosenBanner,
      developer: developer.trim() || 'Custom Dev',
      isFeatured: false,
      isCustom: true
    };

    onAdd(newlyBuilt);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fade-in" id="add-game-modal-backdrop">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Neon Accents decoration header bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500" />

        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display font-extrabold text-white text-lg tracking-tight uppercase">ADD CUSTOM ARCADE CABINET</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            id="close-add-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          
          {errorMsg && (
            <div className="flex items-start space-x-2 bg-rose-950/40 border border-rose-800/60 text-rose-400 p-3.5 rounded-xl text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick info tip */}
          <div className="flex items-start space-x-2.5 bg-pink-950/20 border border-pink-900/30 text-pink-300 p-3.5 rounded-xl text-xs leading-relaxed">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-pink-400" />
            <span>
              <strong>School firewall bypass trick:</strong> Paste iframe URLs of games hosted on free CDN sites (github.io, gitlab.io, replit) or unblocked proxies. We will immediately package it as a launchable cabinet frame on this site!
            </span>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                GAME TITLE *
              </label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="e.g. Retro Space Invaders"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400/50 outline-none rounded-xl p-3 text-sm text-white placeholder-slate-650 font-mono"
                id="add-game-title"
              />
            </div>

            {/* Iframe URL */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-1.5 flex items-center space-x-1">
                <span>IFRAME HOSTING URL *</span>
                <span className="text-slate-600 font-normal lowercase">(must begin with https://)</span>
              </label>
              <input
                type="url"
                required
                placeholder="e.g. https://retrogamebox.github.io/tetris/"
                value={iframeUrl}
                onChange={(e) => setIframeUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400/50 outline-none rounded-xl p-3 text-sm text-white placeholder-slate-650 font-mono"
                id="add-game-url"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                  CATEGORY TYPE
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400/50 outline-none rounded-xl p-3 text-sm text-white font-mono cursor-pointer"
                  id="add-game-category"
                >
                  <option value="Arcade">Arcade</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Retro">Retro</option>
                  <option value="Casual">Casual</option>
                  <option value="Action">Action</option>
                </select>
              </div>

              {/* Developer */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                  DEVELOPER / SOURCE
                </label>
                <input
                  type="text"
                  maxLength={25}
                  placeholder="e.g. Github Repo Community"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400/50 outline-none rounded-xl p-3 text-sm text-white placeholder-slate-650 font-mono"
                  id="add-game-dev"
                />
              </div>
            </div>

            {/* Game Controls */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                CONTROLS GUIDE
              </label>
              <input
                type="text"
                maxLength={80}
                placeholder="e.g. WASD keys block steering, J to shoot"
                value={controls}
                onChange={(e) => setControls(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400/50 outline-none rounded-xl p-3 text-sm text-white placeholder-slate-650 font-mono"
                id="add-game-controls"
              />
            </div>

            {/* Shorts Description */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                SHORT DESCRIPTION
              </label>
              <textarea
                maxLength={180}
                placeholder="Write a tiny blurb on what players must expect in this arcade game..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400/50 outline-none rounded-xl p-3 text-sm text-white placeholder-slate-650 font-mono h-20 resize-none animate-none"
                id="add-game-description"
              />
            </div>
          </div>

          {/* Footer controls action */}
          <div className="flex space-x-3 pt-5 mt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              id="add-game-cancel"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-pink-950/30 active:scale-[0.98]"
              id="add-game-submit"
            >
              ADD TO REPERTOIRE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
