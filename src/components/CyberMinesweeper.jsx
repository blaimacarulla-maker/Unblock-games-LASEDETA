import { useState, useEffect, useCallback } from 'react';
import { Bomb, Shield, Trophy, RefreshCcw } from 'lucide-react';

// Synthetic sound effects using browser Web Audio API
const playBeep = (freq, duration, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Sound fails silently if audio context is blocked
  }
};

export default function CyberMinesweeper() {
  const [cols] = useState(9);
  const [rows] = useState(9);
  const [mineCount] = useState(10);
  const [grid, setGrid] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize Board
  const initBoard = useCallback(() => {
    // Empty Grid
    const newGrid = [];
    for (let y = 0; y < rows; y++) {
      const rowArr = [];
      for (let x = 0; x < cols; x++) {
        rowArr.push({
          x,
          y,
          hasMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMinesCount: 0,
        });
      }
      newGrid.push(rowArr);
    }

    // Place Mines
    let placedMines = 0;
    while (placedMines < mineCount) {
      const rx = Math.floor(Math.random() * cols);
      const ry = Math.floor(Math.random() * rows);
      if (!newGrid[ry][rx].hasMine) {
        newGrid[ry][rx].hasMine = true;
        placedMines++;
      }
    }

    // Calculate Neighbors
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (newGrid[y][x].hasMine) continue;
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
              if (newGrid[ny][nx].hasMine) neighbors++;
            }
          }
        }
        newGrid[y][x].neighborMinesCount = neighbors;
      }
    }

    setGrid(newGrid);
    setIsGameOver(false);
    setIsGameWon(false);
    setRevealedCount(0);
    setClickCount(0);
  }, [cols, rows, mineCount]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Reveal Cell recursively
  const revealCell = (tempGrid, y, x) => {
    const cell = tempGrid[y][x];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    if (cell.neighborMinesCount === 0 && !cell.hasMine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            revealCell(tempGrid, ny, nx);
          }
        }
      }
    }
  };

  // Count revealed cell count
  const countRevealed = (g) => {
    let count = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (g[y][x].isRevealed) count++;
      }
    }
    return count;
  };

  // Handle cell click
  const handleCellClick = (y, x) => {
    if (isGameOver || isGameWon) return;

    const tempGrid = [...grid.map(row => [...row])];
    const cell = tempGrid[y][x];

    if (cell.isFlagged || cell.isRevealed) return;

    setClickCount(prev => prev + 1);

    // If first click is mine, safely relocate it to guarantee fair start
    if (clickCount === 0 && cell.hasMine) {
      // Relocate
      let relocated = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!tempGrid[r][c].hasMine && (r !== y || c !== x)) {
            tempGrid[r][c].hasMine = true;
            cell.hasMine = false;
            relocated = true;
            break;
          }
        }
        if (relocated) break;
      }

      // Recalculate Neighbors count
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (tempGrid[r][c].hasMine) continue;
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
               const ny = r + dy;
               const nx = c + dx;
               if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
                 if (tempGrid[ny][nx].hasMine) neighbors++;
               }
            }
          }
          tempGrid[r][c].neighborMinesCount = neighbors;
        }
      }
    }

    if (cell.hasMine) {
      // Explode
      if (soundEnabled) playBeep(120, 0.6, 'sawtooth');
      // Reveal all mines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (tempGrid[r][c].hasMine) {
            tempGrid[r][c].isRevealed = true;
          }
        }
      }
      setGrid(tempGrid);
      setIsGameOver(true);
      return;
    }

    // Success click chime
    if (soundEnabled) playBeep(260 + cell.neighborMinesCount * 80, 0.12, 'sine');

    revealCell(tempGrid, y, x);
    const newRevealedCount = countRevealed(tempGrid);
    setRevealedCount(newRevealedCount);
    setGrid(tempGrid);

    // Win check
    if (newRevealedCount === rows * cols - mineCount) {
      setIsGameWon(true);
      if (soundEnabled) {
        // Play victory fan-fare
        setTimeout(() => playBeep(440, 0.15), 0);
        setTimeout(() => playBeep(554, 0.15), 150);
        setTimeout(() => playBeep(659, 0.3), 300);
      }
    }
  };

  // Flag cell
  const handleCellRightClick = (e, y, x) => {
    e.preventDefault();
    if (isGameOver || isGameWon) return;

    const tempGrid = [...grid.map(row => [...row])];
    const cell = tempGrid[y][x];

    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    if (soundEnabled) playBeep(cell.isFlagged ? 520 : 380, 0.08, 'triangle');
    setGrid(tempGrid);
  };

  const flaggedCount = grid.reduce((acc, row) => 
    acc + row.filter(c => c.isFlagged).length, 0
  );

  return (
    <div className="flex flex-col items-center bg-slate-950 p-6 rounded-2xl border border-slate-800 text-white w-full max-w-md mx-auto shadow-2xl relative select-none">
      {/* Header Info */}
      <div className="flex justify-between items-center w-full mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Bomb className="w-5 h-5 text-pink-500 animate-pulse" />
          <span className="font-mono text-sm tracking-widest text-pink-400 font-bold uppercase">
            MINES: {Math.max(0, mineCount - flaggedCount)}
          </span>
        </div>

        <button
          onClick={initBoard}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 hover:text-cyan-400 transition-all text-slate-350 cursor-pointer"
          title="Restart Game"
          id="minesweeper-restart-btn"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-3 py-1 text-xs rounded border transition-all font-mono font-bold cursor-pointer ${
            soundEnabled 
              ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800' 
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          id="sound-opt-toggle"
        >
          SOUND: {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Grid Canvas */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative shadow-inner">
        <div className="grid grid-cols-9 gap-1.5">
          {grid.map((row, y) =>
            row.map((cell, x) => {
              let displayContent = null;
              let cellStyle = "bg-slate-800 hover:bg-slate-700 hover:scale-[1.03] text-transparent";

              if (cell.isRevealed) {
                if (cell.hasMine) {
                  displayContent = <Bomb className="w-4 h-4 text-pink-500" />;
                  cellStyle = "bg-pink-950/40 border border-pink-800/80 text-pink-500";
                } else {
                  displayContent = cell.neighborMinesCount > 0 ? String(cell.neighborMinesCount) : "";
                  cellStyle = "bg-slate-950 border border-slate-800/60 font-bold font-mono text-sm ";
                  
                  // Color numbers like real minesweeper
                  if (cell.neighborMinesCount === 1) cellStyle += " text-cyan-400";
                  else if (cell.neighborMinesCount === 2) cellStyle += " text-emerald-400";
                  else if (cell.neighborMinesCount === 3) cellStyle += " text-pink-400";
                  else if (cell.neighborMinesCount >= 4) cellStyle += " text-yellow-400";
                }
              } else if (cell.isFlagged) {
                displayContent = <Shield className="w-3.5 h-3.5 text-pink-400" />;
                cellStyle = "bg-pink-950/30 border border-pink-800/60 text-pink-400";
              }

              return (
                <button
                  key={`${y}-${x}`}
                  id={`cell-${y}-${x}`}
                  onClick={() => handleCellClick(y, x)}
                  onContextMenu={(e) => handleCellRightClick(e, y, x)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all ${cellStyle}`}
                >
                  {displayContent}
                </button>
              );
            })
          )}
        </div>

        {/* Big Game Status Overlay */}
        {(isGameOver || isGameWon) && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl p-4 transition-all duration-300">
            {isGameWon ? (
              <div className="text-center space-y-3">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto animate-bounce" />
                <h3 className="text-xl font-black font-display tracking-tight text-yellow-400">SPACE ISSUED CLEAN</h3>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed font-mono">
                  Excellent grid clearing! All {mineCount} dark energy cells isolated.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Bomb className="w-12 h-12 text-pink-500 mx-auto" />
                <h3 className="text-xl font-black font-display tracking-tight text-pink-500">DETONATED!</h3>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed font-mono">
                  Radiation containment failure. Re-initialize grid calibration.
                </p>
              </div>
            )}
            <button
              onClick={initBoard}
              className="mt-5 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-mono text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              id="reinit-button-minesweeper"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Grid Legend Instruction details */}
      <div className="mt-5 text-slate-500 text-[10px] uppercase font-mono tracking-widest text-center leading-normal">
        <p>L-Click: Scrape Sensor &bull; R-Click: Deploy Shield</p>
        <p className="mt-1 text-slate-600">First sensor probe is guaranteed safe</p>
      </div>
    </div>
  );
}
