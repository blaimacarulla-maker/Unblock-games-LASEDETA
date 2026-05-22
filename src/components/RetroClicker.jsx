import { useState, useEffect } from 'react';
import { Cpu, Zap, ShoppingBag, Radio, Coins, Database } from 'lucide-react';

// Synthetic sound synthesizer
const playClickSynth = (freq, duration) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Fail silently if context suspended
  }
};

export default function RetroClicker() {
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem('retro_credits');
    return saved ? parseFloat(saved) : 0;
  });

  const [clickPower, setClickPower] = useState(1);
  const [effects, setEffects] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('retro_clicker_upgrades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to defaults
      }
    }
    return [
      { id: 'flux', name: 'Flux Capacitor', cost: 15, multiplier: 1, cps: 0.2, iconName: 'zap', count: 0 },
      { id: 'node', name: 'Crypto Processor', cost: 100, multiplier: 1, cps: 1.5, iconName: 'cpu', count: 0 },
      { id: 'database', name: 'Datacenter Server', cost: 500, multiplier: 1, cps: 8.0, iconName: 'database', count: 0 },
      { id: 'subspace', name: 'Subspace Resonator', cost: 3000, multiplier: 1, cps: 45.0, iconName: 'radio', count: 0 }
    ];
  });

  // Keep state synchronized to localStorage
  useEffect(() => {
    localStorage.setItem('retro_credits', credits.toFixed(1));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('retro_clicker_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  // Recalculate click value and auto-production speed
  const totalCps = upgrades.reduce((sum, item) => sum + (item.cps * item.count), 0);
  const calculatedClickPower = 1 + upgrades.reduce((sum, item) => sum + (item.count * 0.5), 0);

  useEffect(() => {
    setClickPower(calculatedClickPower);
  }, [calculatedClickPower]);

  // Auto click ticks (runs 10 times a second for responsive visuals)
  useEffect(() => {
    if (totalCps === 0) return;
    const interval = setInterval(() => {
      setCredits(prev => prev + (totalCps / 10));
    }, 100);
    return () => clearInterval(interval);
  }, [totalCps]);

  // Handle core click
  const handleMainClick = (e) => {
    e.preventDefault();
    if (soundEnabled) {
      playClickSynth(280 + Math.min(200, credits * 0.5), 0.15);
    }
    
    setCredits(prev => prev + clickPower);

    // Track click client location for floating layout animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newEffect = {
      id: Date.now() + Math.random(),
      x,
      y,
      value: clickPower
    };

    setEffects(prev => [...prev, newEffect]);

    // Cleanup effects
    setTimeout(() => {
      setEffects(prev => prev.filter(eff => eff.id !== newEffect.id));
    }, 1000);
  };

  // Buy upgrade logic
  const buyUpgrade = (id) => {
    const itemIndex = upgrades.findIndex(item => item.id === id);
    if (itemIndex === -1) return;

    const item = upgrades[itemIndex];
    if (credits < item.cost) {
      if (soundEnabled) playClickSynth(150, 0.2); // Reject buzz
      return;
    }

    if (soundEnabled) playClickSynth(440, 0.2); // Purchase chime

    setCredits(prev => prev - item.cost);
    
    setUpgrades(prev => {
      const updated = [...prev];
      const target = updated[itemIndex];
      target.count += 1;
      target.cost = Math.round(target.cost * 1.35); // Exponential inflation
      return updated;
    });
  };

  const resetProgress = () => {
    setCredits(0);
    setUpgrades([
      { id: 'flux', name: 'Flux Capacitor', cost: 15, multiplier: 1, cps: 0.2, iconName: 'zap', count: 0 },
      { id: 'node', name: 'Crypto Processor', cost: 100, multiplier: 1, cps: 1.5, iconName: 'cpu', count: 0 },
      { id: 'database', name: 'Datacenter Server', cost: 500, multiplier: 1, cps: 8.0, iconName: 'database', count: 0 },
      { id: 'subspace', name: 'Subspace Resonator', cost: 3000, multiplier: 1, cps: 45.0, iconName: 'radio', count: 0 }
    ]);
  };

  const renderIcon = (name) => {
    switch (name) {
      case 'zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'cpu': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'database': return <Database className="w-5 h-5 text-pink-400" />;
      case 'radio': return <Radio className="w-5 h-5 text-emerald-400" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 p-6 rounded-2xl border border-slate-800 text-white w-full max-w-lg mx-auto shadow-2xl select-none">
      {/* Sound Options Header */}
      <div className="flex justify-between items-center w-full mb-6 pb-3 border-b border-slate-900">
        <div className="flex items-center space-x-1.5">
          <Coins className="w-5 h-5 text-yellow-400 animate-bounce" />
          <span className="font-display font-black italic tracking-wide text-white uppercase text-base">GLITCH MINER</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1 text-[10px] rounded border transition-all font-mono font-bold cursor-pointer ${
              soundEnabled 
                ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800' 
                : 'bg-slate-900 text-slate-505 border-slate-800'
            }`}
            id="retro-clicker-sound"
          >
            SOUND: {soundEnabled ? 'ON' : 'OFF'}
          </button>
          
          <button
            onClick={resetProgress}
            className="px-2.5 py-1 text-[10px] rounded border border-slate-800 hover:border-pink-500 hover:text-pink-400 transition-all text-slate-500 font-mono font-bold cursor-pointer"
            id="retro-clicker-reset"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Credit Counter */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-yellow-250 to-cyan-400 tracking-tight">
          🪙 {credits.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1 font-semibold tracking-wide">
          AUTO PRODUCTION: <span className="text-emerald-400 font-bold">{totalCps.toFixed(1)}/sec</span> &bull; CLICK POWER: <span className="text-cyan-400 font-bold">+{clickPower}</span>
        </p>
      </div>

      {/* Main Clicking Core */}
      <div className="relative mb-8 w-fit text-center">
        <button
          onClick={handleMainClick}
          className="w-36 h-36 rounded-full bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-cyan-400 hover:border-cyan-300 cursor-pointer flex items-center justify-center p-2 relative shadow-2xl transition-all duration-100 hover:scale-[1.04] active:scale-95 group focus:outline-none ring-offset-4 ring-offset-slate-950 focus:ring-4 focus:ring-cyan-400"
          id="main-glowing-core"
        >
          {/* Inner pulsating core */}
          <div className="absolute inset-2.5 rounded-full bg-gradient-to-tr from-cyan-600/40 to-blue-400/10 group-hover:from-cyan-500/50 group-hover:to-blue-300/20 transition-all duration-300 animate-pulse" />
          <div className="text-center z-10 select-none">
            <Coins className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-all" />
            <span className="font-mono text-xs font-bold text-cyan-200 uppercase tracking-widest mt-1 block">MINE</span>
          </div>
        </button>

        {/* Floating floating effects */}
        {effects.map((eff) => (
          <span
            key={eff.id}
            style={{ left: eff.x, top: eff.y }}
            className="absolute font-mono text-sm font-extrabold text-cyan-450 select-none animate-bounce pointer-events-none text-shadow-glow"
          >
            +{eff.value}
          </span>
        ))}
      </div>

      {/* Upgrades panel */}
      <div className="w-full space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-1 mb-2">
          <ShoppingBag className="w-4 h-4 text-pink-400" />
          <h3 className="font-mono text-xs font-bold uppercase text-slate-350 tracking-wider">UPGRADES MODULES</h3>
        </div>

        {upgrades.map((item) => {
          const canAfford = credits >= item.cost;
          return (
            <button
              key={item.id}
              onClick={() => buyUpgrade(item.id)}
              disabled={!canAfford}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${
                canAfford 
                  ? 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700 cursor-pointer active:scale-[0.99]' 
                  : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60 cursor-not-allowed'
              }`}
              id={`upgrade-panel-${item.id}`}
            >
              <div className="flex items-center space-x-3 z-10">
                <div className={`p-1.5 rounded-md ${canAfford ? 'bg-slate-950/80' : 'bg-slate-950'}`}>
                  {renderIcon(item.iconName)}
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans text-slate-200 group-hover:text-white transition-all">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    +{item.cps.toFixed(1)} CPS &bull; Owned: <span className="text-slate-350 font-bold">{item.count}</span>
                  </p>
                </div>
              </div>

              <div className="text-right z-10">
                <span className={`font-mono text-xs font-bold ${canAfford ? 'text-yellow-400 animate-pulse' : 'text-slate-500'}`}>
                  🪙 {item.cost}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
