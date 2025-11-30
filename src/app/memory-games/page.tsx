"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameSession } from '@/types/memory-games';
import { saveGameSession, getRecentSessions } from '@/utils/memory-games-tracking';
import { GameStatsChart } from '@/app/components/memory-games/GameStatsChart';

function Tabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tabs = [
    { id: "memory", label: "Memory Cards" },
    { id: "jigsaw", label: "Jigsaw" },
  ];
  return (
    <div className="mb-4 flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-md border px-3 py-1 text-sm ${
            value === t.id
              ? "border-white/20 bg-white/20"
              : "border-white/15 bg-white/10 hover:bg-white/15"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Simple memory matching game (4x3 = 12 cards, 6 pairs)
function MemoryCards() {
  const baseIcons = ["🍎", "⭐", "🐶", "🌙", "🎵", "🌸"]; // simple emoji set
  const [shuffleKey, setShuffleKey] = useState(0);
  const deck = useMemo(() => {
    const arr = [...baseIcons, ...baseIcons].map((v, i) => ({ id: i + 1, val: v }));
    // shuffle
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [shuffleKey]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState(false);
  const [burst, setBurst] = useState(false);
  const wasCompleteRef = useRef(false);
  const [showAward, setShowAward] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("games:memory:completed");
      if (raw) setCompletedCount(Number(raw) || 0);
    } catch {}
  }, []);

  function getMinuteBucket(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
  }

  function logIncorrectAttempt() {
    try {
      const now = new Date();
      const iso = now.toISOString();
      // Append to detailed log
      const logRaw = localStorage.getItem("games:memory:incorrectLog");
      const log: string[] = logRaw ? JSON.parse(logRaw) : [];
      log.push(iso);
      localStorage.setItem("games:memory:incorrectLog", JSON.stringify(log));
      // Increment minute bucket
      const bucketKey = getMinuteBucket(now);
      const bucketsRaw = localStorage.getItem("games:memory:incorrectBuckets");
      const buckets: Record<string, number> = bucketsRaw ? JSON.parse(bucketsRaw) : {};
      buckets[bucketKey] = (buckets[bucketKey] || 0) + 1;
      localStorage.setItem("games:memory:incorrectBuckets", JSON.stringify(buckets));
    } catch {}
  }

  function handleFlip(idx: number) {
    if (lock) return;
    if (flipped.includes(idx)) return;
    
    // Start timing on first flip
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setLock(true);
      const a = deck[next[0]];
      const b = deck[next[1]];
      window.setTimeout(() => {
        if (a.val === b.val) {
          setMatched((prev) => new Set(prev).add(a.val));
        } else {
          setIncorrectCount((prev) => prev + 1);
          try {
            const raw = localStorage.getItem("games:memory:incorrectTotal");
            const nextTotal = (Number(raw) || 0) + 1;
            localStorage.setItem("games:memory:incorrectTotal", String(nextTotal));
          } catch {}
          logIncorrectAttempt();
        }
        setFlipped([]);
        setLock(false);
      }, 700);
    }
  }

  const allMatched = matched.size === baseIcons.length;

  useEffect(() => {
    if (allMatched && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      setBurst(true);
      window.setTimeout(() => setBurst(false), 1800);
      setShowAward(true);
      
      // Save session data
      if (startTime) {
        const endTime = Date.now();
        saveGameSession('memory', {
          gameType: 'memory',
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          durationMs: endTime - startTime,
          incorrectAttempts: incorrectCount,
          completed: true
        });
      }
      
      setCompletedCount((prev) => {
        const next = prev + 1;
        try { localStorage.setItem("games:memory:completed", String(next)); } catch {}
        return next;
      });
    } else if (!allMatched && wasCompleteRef.current) {
      wasCompleteRef.current = false;
    }
  }, [allMatched, startTime, incorrectCount]);

  function playAgain() {
    setShowAward(false);
    setMatched(new Set());
    setFlipped([]);
    setIncorrectCount(0);
    setStartTime(null);
    setShuffleKey((k) => k + 1);
  }

  return (
    <div>
      <ConfettiBurst show={burst} />
      <div className="grid grid-cols-4 gap-2">
        {deck.map((card, idx) => {
          const isUp = flipped.includes(idx) || matched.has(card.val);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleFlip(idx)}
              className={`aspect-square rounded-md border border-white/15 flex items-center justify-center text-2xl select-none ${
                isUp ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
              aria-label={isUp ? card.val : "Hidden card"}
            >
              <span>{isUp ? card.val : ""}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-red-300">Incorrect attempts: {incorrectCount}</div>
      {allMatched && <p aria-live="polite" className="sr-only">Congratulations! You matched all pairs.</p>}

      {showAward && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="relative w-[92%] max-w-sm rounded-xl border border-white/15 bg-white/10 backdrop-blur p-4 text-white">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-purple-500/20 via-fuchsia-500/15 to-cyan-500/20 opacity-30" />
            <div className="relative">
              <h3 className="text-xl font-semibold mb-1">Congratulations! 🎉</h3>
              <p className="text-sm opacity-90">You matched all pairs.</p>
              <p className="text-xs opacity-80 mt-1">Incorrect attempts: {incorrectCount}</p>
              <p className="text-xs opacity-80">Total completions: {completedCount}</p>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAward(false)}
                  className="rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={playAgain}
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-sm hover:bg-emerald-500/30"
                >
                  Play again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfettiBurst({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 80 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 1.2 + Math.random() * 0.8;
        const size = 6 + Math.random() * 6;
        const colors = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const rotate = Math.floor(Math.random() * 360);
        return (
          <span
            key={i}
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.4,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotate}deg)`
            }}
            className="absolute top-[-10px] inline-block animate-[confetti_1.5s_ease-in_forwards]"
          />
        );
      })}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// 3x3 jigsaw with user-changeable image and award on completion
function Jigsaw3x3() {
  const [imageUrl, setImageUrl] = useState<string>("/digital_brain.png");
  const [order, setOrder] = useState<number[]>(() => {
    const arr = Array.from({ length: 9 }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [dragging, setDragging] = useState<number | null>(null);
  const [showAward, setShowAward] = useState(false);
  const [burst, setBurst] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const wasSolvedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("games:jigsaw:completed");
      if (raw) setCompletedCount(Number(raw) || 0);
    } catch {}
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }

  function onDragStart(i: number) {
    setDragging(i);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(targetIndex: number) {
    if (dragging == null) return;
    
    // Start timing on first move
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    setOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragging);
      const toIdx = targetIndex;
      
      // Check if this is an incorrect move (not solving the puzzle)
      const isCorrectMove = dragging === toIdx;
      if (!isCorrectMove) {
        setIncorrectAttempts(prev => prev + 1);
      }
      
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next;
    });
    setDragging(null);
  }

  const solved = order.every((val, idx) => val === idx);

  useEffect(() => {
    if (solved && !wasSolvedRef.current) {
      wasSolvedRef.current = true;
      setBurst(true);
      window.setTimeout(() => setBurst(false), 1800);
      setShowAward(true);
      
      // Save session data
      if (startTime) {
        const endTime = Date.now();
        saveGameSession('jigsaw', {
          gameType: 'jigsaw',
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          durationMs: endTime - startTime,
          incorrectAttempts: incorrectAttempts,
          completed: true
        });
      }
      
      setCompletedCount((prev) => {
        const next = prev + 1;
        try { localStorage.setItem("games:jigsaw:completed", String(next)); } catch {}
        return next;
      });
    } else if (!solved && wasSolvedRef.current) {
      wasSolvedRef.current = false;
    }
  }, [solved, startTime, incorrectAttempts]);

  function shuffle() {
    setOrder((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
    setIncorrectAttempts(0);
    setStartTime(null);
  }

  function handleManualCompletion() {
    if (solved) return;
    
    // Ensure start time is set if user clicks immediately
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    // Auto-solve the puzzle by setting pieces in correct order [0, 1, ..., 8]
    setOrder(Array.from({ length: 9 }, (_, i) => i));
  }

  return (
    <div className="relative">
      <ConfettiBurst show={burst} />

      <div className="mb-3 flex items-center gap-2">
        <label className="rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm cursor-pointer hover:bg-white/15">
          <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          Change image
        </label>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
        >
          Shuffle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 w-full max-w-md">
        {order.map((pieceIndex, gridIndex) => {
          const row = Math.floor(pieceIndex / 3);
          const col = pieceIndex % 3;
          const bgPos = `${(-col * 100) / 2}% ${(-row * 100) / 2}%`;
          return (
            <div
              key={`${pieceIndex}-${gridIndex}`}
              draggable
              onDragStart={() => onDragStart(pieceIndex)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(gridIndex)}
              className="relative aspect-square rounded-sm border border-white/15 bg-white/10 overflow-hidden"
              style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "300% 300%", backgroundPosition: bgPos }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleManualCompletion}
          className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          Mark as Completed
        </button>
      </div>

      {solved && <p aria-live="polite" className="sr-only">Congratulations! You solved the puzzle.</p>}

      {showAward && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="relative w-[92%] max-w-sm rounded-xl border border-white/15 bg-white/10 backdrop-blur p-4 text-white">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-purple-500/20 via-fuchsia-500/15 to-cyan-500/20 opacity-30" />
            <div className="relative">
              <h3 className="text-xl font-semibold mb-1">Congratulations! 🎉</h3>
              <p className="text-sm opacity-90">You solved the puzzle.</p>
              <p className="text-xs opacity-80 mt-1">Total completions: {completedCount}</p>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAward(false)}
                  className="rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm hover:bg-white/15"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAward(false); shuffle(); }}
                  className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-sm hover:bg-emerald-500/30"
                >
                  Play again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MemoryGamesPage() {
  const [tab, setTab] = useState<string>("memory");
  const [memorySessions, setMemorySessions] = useState<GameSession[]>([]);
  const [jigsawSessions, setJigsawSessions] = useState<GameSession[]>([]);

  // Load session data
  useEffect(() => {
    setMemorySessions(getRecentSessions('memory', 20));
    setJigsawSessions(getRecentSessions('jigsaw', 20));
  }, []);

  // Refresh data when tab changes (in case new games were completed)
  useEffect(() => {
    setMemorySessions(getRecentSessions('memory', 20));
    setJigsawSessions(getRecentSessions('jigsaw', 20));
  }, [tab]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/40 via-purple-500/35 to-cyan-500/40 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-5xl px-6 sm:px-10 py-12 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-semibold">Memory Games</h1>
            <p className="opacity-80">Practice with memory cards or a small jigsaw puzzle.</p>
          </div>

          <Tabs value={tab} onChange={setTab} />

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
            {tab === "memory" ? <MemoryCards /> : <Jigsaw3x3 />}
          </div>

          {/* Performance Charts */}
          <div className="space-y-6">
            {tab === "memory" && (
              <GameStatsChart 
                sessions={memorySessions} 
                gameType="memory" 
              />
            )}
            {tab === "jigsaw" && (
              <GameStatsChart 
                sessions={jigsawSessions} 
                gameType="jigsaw" 
              />
            )}
          </div>
        </div>
      </main>

      <Link href="/dashboard" className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition">
        <span className="text-sm">← Back to Home</span>
      </Link>
    </div>
  );
}


