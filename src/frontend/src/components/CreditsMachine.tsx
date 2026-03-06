import { ArrowRight, Coins, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  EXCHANGE_RATES,
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  SELL_PRICES,
  useGameStore,
} from "./GameStore";

function ExchangeRow({ rarity }: { rarity: Rarity }) {
  const { inventory, exchangeForCredits } = useGameStore();
  const count = inventory[rarity] || 0;
  const rate = EXCHANGE_RATES[rarity];
  const sellPrice = SELL_PRICES[rarity];
  const bonus = ((rate / sellPrice - 1) * 100).toFixed(0);
  const color = RARITY_COLORS[rarity];
  const [qty, setQty] = useState(1);
  const [justEarned, setJustEarned] = useState<number | null>(null);

  const maxQty = count;
  const preview = rate * Math.min(qty, count);

  const handleExchange = () => {
    const actualQty = Math.min(qty, count);
    if (actualQty <= 0) return;

    const earned = exchangeForCredits(rarity, actualQty);
    if (earned > 0) {
      setJustEarned(earned);
      toast.success(
        `Exchanged ${actualQty}× ${RARITY_LABELS[rarity]} for ${earned.toLocaleString()} Caffeine Credits ✦`,
      );
      setTimeout(() => setJustEarned(null), 2000);
      setQty(1);
    }
  };

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div
      className="p-3 rounded-xl border transition-all"
      style={{
        opacity: count > 0 ? 1 : 0.4,
        backgroundColor: count > 0 ? `${color}0d` : "transparent",
        borderColor: count > 0 ? `${color}33` : "oklch(var(--border))",
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Left: rarity info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 6px 2px ${color}`,
            }}
          />
          <span className="text-xs font-bold font-mono" style={{ color }}>
            {RARITY_LABELS[rarity]}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            ×{count}
          </span>
          <span className="text-xs text-green-400 font-mono font-bold">
            +{bonus}%
          </span>
        </div>

        {/* Rate */}
        <div className="flex items-center gap-1 text-xs font-mono text-yellow-400">
          <span className="text-muted-foreground">each:</span>
          {formatNum(rate)} ✦
        </div>
      </div>

      {count > 0 && (
        <div className="flex items-center gap-2 mt-3">
          {/* Qty selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-6 h-6 rounded text-xs font-bold bg-muted/30 text-foreground hover:bg-muted/60 transition-colors"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <input
              type="number"
              value={qty}
              onChange={(e) =>
                setQty(
                  Math.min(
                    maxQty,
                    Math.max(1, Number.parseInt(e.target.value) || 1),
                  ),
                )
              }
              className="w-14 text-center text-xs font-mono bg-muted/20 border border-border rounded px-1 py-0.5 text-foreground"
              min={1}
              max={maxQty}
            />
            <button
              type="button"
              className="w-6 h-6 rounded text-xs font-bold bg-muted/30 text-foreground hover:bg-muted/60 transition-colors"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            >
              +
            </button>
            <button
              type="button"
              className="px-2 h-6 rounded text-xs font-bold bg-muted/30 text-foreground hover:bg-muted/60 transition-colors"
              onClick={() => setQty(maxQty)}
            >
              MAX
            </button>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-1 text-xs font-mono text-yellow-300 flex-1 justify-center">
            <ArrowRight className="w-3 h-3" />
            <span>{formatNum(preview)} ✦</span>
          </div>

          {/* Exchange button */}
          <div className="relative">
            <button
              type="button"
              data-ocid="credits.primary_button"
              onClick={handleExchange}
              disabled={count === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `${color}33`,
                color: color,
                border: `1px solid ${color}66`,
                boxShadow: `0 0 8px 2px ${color}22`,
              }}
            >
              EXCHANGE
            </button>

            <AnimatePresence>
              {justEarned !== null && (
                <motion.div
                  initial={{ y: 0, opacity: 1, x: "-50%" }}
                  animate={{ y: -24, opacity: 0, x: "-50%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute bottom-full left-1/2 text-yellow-400 font-bold font-mono text-xs pointer-events-none whitespace-nowrap"
                >
                  +{formatNum(justEarned)} ✦
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreditsMachine() {
  const { credits } = useGameStore();

  const formatCredits = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Machine Header */}
      <motion.div
        className="rounded-2xl p-5 text-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 50%, transparent 100%)",
          border: "1px solid rgba(234,179,8,0.3)",
        }}
      >
        {/* Animated lights */}
        <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
          <motion.div
            className="h-full w-1/4 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #eab308, transparent)",
            }}
            animate={{ x: ["-100%", "400%"] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.5 }}>
            <Coins className="w-7 h-7 text-yellow-400" />
          </motion.div>
          <h2 className="text-xl font-display font-black text-yellow-400">
            Caffeine Credits Machine
          </h2>
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </div>

        <p className="text-sm text-muted-foreground">
          Trade your meteorites for{" "}
          <span className="text-yellow-400 font-bold">Caffeine Credits</span>
        </p>
        <p className="text-xs text-green-400 font-mono mt-1">
          ★ Better rates than the Sell Shop ★
        </p>

        <div className="mt-3 bg-card/50 rounded-xl px-4 py-2 inline-flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-lg font-bold font-mono text-yellow-400">
            {formatCredits(credits)} Caffeine Credits
          </span>
        </div>
      </motion.div>

      {/* Exchange rows */}
      <div className="flex flex-col gap-2">
        {RARITIES.map((rarity) => (
          <ExchangeRow key={rarity} rarity={rarity} />
        ))}
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground font-mono text-center pb-2">
        Exchange rates are{" "}
        <span className="text-green-400">50-100% better</span> than selling
      </div>
    </div>
  );
}
