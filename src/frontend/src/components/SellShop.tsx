import { Button } from "@/components/ui/button";
import { Coins, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  SELL_PRICES,
  useGameStore,
} from "./GameStore";
import { RarityBadge } from "./InventoryPanel";
import SecretRoom from "./SecretRoom";

function SellRow({ rarity }: { rarity: Rarity }) {
  const { inventory, sellMeteor, credits } = useGameStore();
  const count = inventory[rarity] || 0;
  const price = SELL_PRICES[rarity];
  const color = RARITY_COLORS[rarity];

  const [justSold, setJustSold] = useState<number | null>(null);

  const handleSell = (qty: number) => {
    const actualQty = qty === -1 ? count : qty;
    if (actualQty <= 0) return;
    const before = credits;
    const success = sellMeteor(rarity, actualQty);
    if (success) {
      const after = useGameStore.getState().credits;
      const earned = after - before;
      setJustSold(earned);
      toast.success(
        `Sold ${actualQty}× ${RARITY_LABELS[rarity]} for ${earned.toLocaleString()} ✦`,
      );
      setTimeout(() => setJustSold(null), 1500);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border transition-all"
      style={{
        opacity: count > 0 ? 1 : 0.4,
        backgroundColor: count > 0 ? `${color}0d` : "transparent",
        borderColor: count > 0 ? `${color}33` : "oklch(var(--border))",
      }}
    >
      {/* Rarity info */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 6px 2px ${color}` }}
        />
        <RarityBadge rarity={rarity} />
        <span className="text-sm text-muted-foreground font-mono ml-1">
          ×{count.toLocaleString()}
        </span>
      </div>

      {/* Price */}
      <div className="text-xs text-yellow-400 font-mono whitespace-nowrap">
        {price.toLocaleString()} ✦ each
      </div>

      {/* Buttons */}
      <div className="flex gap-1">
        {[1, 10].map((qty) => (
          <button
            type="button"
            key={qty}
            data-ocid="sell.primary_button"
            onClick={() => handleSell(qty)}
            disabled={count < qty}
            className="px-2 py-1 text-xs rounded font-mono font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: `${color}22`,
              color: color,
              border: `1px solid ${color}44`,
            }}
          >
            ×{qty}
          </button>
        ))}
        <button
          type="button"
          data-ocid="sell.primary_button"
          onClick={() => handleSell(-1)}
          disabled={count === 0}
          className="px-2 py-1 text-xs rounded font-mono font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: `${color}33`,
            color: color,
            border: `1px solid ${color}66`,
          }}
        >
          ALL
        </button>
      </div>

      {/* Sold animation */}
      <AnimatePresence>
        {justSold !== null && (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -20, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute right-4 text-yellow-400 font-bold font-mono text-sm pointer-events-none"
          >
            +{justSold.toLocaleString()} ✦
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SellShop() {
  const { credits } = useGameStore();
  const [secretOpen, setSecretOpen] = useState(false);

  const formatCredits = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div
      className="h-full flex flex-col gap-4 p-4 overflow-y-auto relative"
      style={{ backgroundColor: "oklch(var(--card))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-yellow-400" />
          Sell Shop
        </h2>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-lg font-bold font-mono text-yellow-400">
            {formatCredits(credits)} ✦
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Sell meteorites for credits. Better rates available at the Credits
        Machine.
      </p>

      {/* Sell rows */}
      <div className="flex flex-col gap-2 relative">
        {RARITIES.map((rarity, i) => (
          <div
            key={rarity}
            data-ocid={`shop.item.${i + 1}`}
            className="relative"
          >
            <SellRow rarity={rarity} />
          </div>
        ))}
      </div>

      {/* SECRET ROOM BUTTON - blends into card background */}
      <button
        type="button"
        data-ocid="secret.open_modal_button"
        onClick={() => setSecretOpen(true)}
        className="absolute bottom-3 right-3 w-8 h-8 rounded-sm transition-all duration-300 opacity-0 hover:opacity-100"
        style={{
          backgroundColor: "oklch(var(--card))",
          border: "1px solid transparent",
          color: "oklch(var(--card))",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.border =
            "1px solid oklch(var(--border))";
          (e.target as HTMLButtonElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.border =
            "1px solid transparent";
          (e.target as HTMLButtonElement).style.opacity = "0";
        }}
        aria-label="Hidden entrance"
        title=""
      >
        ·
      </button>

      <SecretRoom open={secretOpen} onClose={() => setSecretOpen(false)} />
    </div>
  );
}
