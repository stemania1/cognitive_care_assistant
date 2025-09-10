"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const deck = useMemo(() => {
    const arr = [...baseIcons, ...baseIcons].map((v, i) => ({ id: i + 1, val: v }));
    // shuffle
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState(false);

  function handleFlip(idx: number) {
    if (lock) return;
    if (flipped.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setLock(true);
      const a = deck[next[0]];
      const b = deck[next[1]];
      window.setTimeout(() => {
        if (a.val === b.val) {
          setMatched((prev) => new Set(prev).add(a.val));
        }
        setFlipped([]);
        setLock(false);
      }, 700);
    }
  }

  const allMatched = matched.size === baseIcons.length;

  return (
    <div>
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
      {allMatched && (
        <p className="mt-3 text-sm text-emerald-300">Great job! All pairs matched.</p>
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
    setOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(dragging);
      const toIdx = targetIndex;
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
      setCompletedCount((prev) => {
        const next = prev + 1;
        try { localStorage.setItem("games:jigsaw:completed", String(next)); } catch {}
        return next;
      });
    } else if (!solved && wasSolvedRef.current) {
      wasSolvedRef.current = false;
    }
  }, [solved]);

  function shuffle() {
    setOrder((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
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

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            {tab === "memory" ? <MemoryCards /> : <Jigsaw3x3 />}
          </div>
        </div>
      </main>

      <Link href="/" className="group fixed bottom-6 left-6 sm:bottom-8 sm:left-8">
        <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-fuchsia-500/25 to-cyan-500/30 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur shadow-lg transition-transform duration-200 group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90" aria-hidden="true">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.25 8.25a.75.75 0 1 1-1.06 1.06l-.97-.97v8.07a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5h-3v4.5a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-8.07l-.97.97a.75.75 0 1 1-1.06-1.06Z" />
          </svg>
          <span className="sr-only">Home</span>
        </span>
      </Link>
    </div>
  );
}


