import { Package } from "lucide-react";
import { motion } from "motion/react";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  useGameStore,
} from "./GameStore";

function MeteoriteOrb({
  rarity,
  size = 40,
}: { rarity: Rarity; size?: number }) {
  const color = RARITY_COLORS[rarity];
  const isGoogleplex = rarity === "googleplex";
  const isCrazy = rarity === "crazy";
  const isDivine = rarity === "divine";

  return (
    <div
      className={`relative flex-shrink-0 rounded-full ${isGoogleplex ? "rarity-googleplex" : ""} ${isCrazy ? "rarity-crazy" : ""}`}
      style={{
        width: size,
        height: size,
        background: isCrazy
          ? "conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #ff6bff, #ff6b6b)"
          : isGoogleplex
            ? "radial-gradient(circle at 35% 35%, #ff00ff, #cc00cc)"
            : isDivine
              ? "radial-gradient(circle at 35% 35%, #ffffff, #c0c0c0)"
              : `radial-gradient(circle at 35% 35%, ${color}dd, ${color}66)`,
        boxShadow: isGoogleplex
          ? "0 0 20px 6px #ff00ff"
          : `0 0 12px 3px ${color}88`,
      }}
    >
      {/* Inner highlight */}
      <div
        className="absolute top-1 left-1 rounded-full opacity-60"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.8), transparent)",
        }}
      />
    </div>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const color = RARITY_COLORS[rarity];
  const label = RARITY_LABELS[rarity];
  const isCrazy = rarity === "crazy";
  const isGoogleplex = rarity === "googleplex";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${isGoogleplex ? "rarity-googleplex" : isCrazy ? "rarity-crazy" : ""}`}
      style={{
        color: color,
        border: `1px solid ${color}66`,
        backgroundColor: `${color}18`,
        textShadow: `0 0 8px ${color}`,
      }}
    >
      {label}
    </span>
  );
}

export default function InventoryPanel() {
  const { inventory, totalFound } = useGameStore();

  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);
  const hasAny = totalItems > 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">
          🪨 Collection
        </h2>
        <div className="text-sm text-muted-foreground font-mono">
          {totalItems.toLocaleString()} meteorites ·{" "}
          {totalFound.toLocaleString()} total found
        </div>
      </div>

      {!hasAny ? (
        <motion.div
          data-ocid="inventory.empty_state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
        >
          <Package className="w-16 h-16 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No meteorites yet.</p>
          <p className="text-sm text-muted-foreground">
            Head to the Dig tab and start excavating!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RARITIES.map((rarity, i) => {
            const count = inventory[rarity] || 0;
            const color = RARITY_COLORS[rarity];

            return (
              <motion.div
                key={rarity}
                data-ocid={`inventory.item.${i + 1}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: count > 0 ? 1 : 0.4, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: count > 0 ? `${color}0d` : "transparent",
                  borderColor:
                    count > 0 ? `${color}44` : "oklch(var(--border))",
                }}
              >
                <MeteoriteOrb rarity={rarity} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RarityBadge rarity={rarity} />
                  </div>
                  <div
                    className="text-2xl font-bold font-mono mt-0.5"
                    style={{
                      color:
                        count > 0 ? color : "oklch(var(--muted-foreground))",
                    }}
                  >
                    {count.toLocaleString()}
                  </div>
                </div>
                {count > 0 && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 6px 2px ${color}`,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
