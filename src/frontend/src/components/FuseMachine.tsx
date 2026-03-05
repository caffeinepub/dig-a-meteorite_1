import { ChevronRight, FlaskConical, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  useGameStore,
} from "./GameStore";

function MeteoriteSlot({
  rarity,
  index,
  isFusing,
}: {
  rarity: Rarity | null;
  index: number;
  isFusing: boolean;
}) {
  const color = rarity ? RARITY_COLORS[rarity] : null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: isFusing ? [1, 1.2, 0.8, 1.3, 0] : 1,
        opacity: isFusing ? [1, 1, 1, 1, 0] : 1,
        rotate: isFusing ? [0, 10, -10, 5, 0] : 0,
      }}
      transition={{
        delay: index * 0.08,
        duration: isFusing ? 0.6 : 0.3,
      }}
      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2"
      style={{
        background: color
          ? `radial-gradient(circle at 35% 35%, ${color}44, ${color}18)`
          : "oklch(var(--muted) / 0.3)",
        borderColor: color ? `${color}88` : "oklch(var(--border))",
        boxShadow: color ? `0 0 15px 4px ${color}44` : "none",
      }}
    >
      {rarity ? (
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${rarity === "crazy" ? "rarity-crazy" : rarity === "googleplex" ? "rarity-googleplex" : ""}`}
          style={{
            background:
              rarity === "crazy"
                ? "conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #ff6bff, #ff6b6b)"
                : rarity === "googleplex"
                  ? "radial-gradient(circle, #ff00ff, #cc00cc)"
                  : `radial-gradient(circle at 35% 35%, ${color}dd, ${color}55)`,
            boxShadow: `0 0 8px 2px ${color}66`,
          }}
        />
      ) : (
        <span className="text-muted-foreground text-2xl">?</span>
      )}
    </motion.div>
  );
}

export default function FuseMachine() {
  const { inventory, fuseMeteors } = useGameStore();
  const [selectedRarity, setSelectedRarity] = useState<Rarity | null>(null);
  const [isFusing, setIsFusing] = useState(false);
  const [lastResult, setLastResult] = useState<Rarity | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Only show rarities where count >= 3 and not the last rarity
  const fusableRarities = RARITIES.filter(
    (r, i) => (inventory[r] || 0) >= 3 && i < RARITIES.length - 1,
  );

  const selectedIndex = selectedRarity ? RARITIES.indexOf(selectedRarity) : -1;
  const nextRarity =
    selectedIndex >= 0 && selectedIndex < RARITIES.length - 1
      ? RARITIES[selectedIndex + 1]
      : null;

  const handleFuse = () => {
    if (!selectedRarity || isFusing) return;
    setIsFusing(true);
    setShowResult(false);

    setTimeout(() => {
      const result = fuseMeteors(selectedRarity);
      setIsFusing(false);

      if (result.success) {
        setLastResult(result.result as Rarity);
        setShowResult(true);
        toast.success(
          `Fusion success! Got 1× ${RARITY_LABELS[result.result as Rarity]}!`,
          { duration: 3000 },
        );

        // Check if we still have 3 of this rarity
        const newCount = (inventory[selectedRarity] || 0) - 3;
        if (newCount < 3) {
          setSelectedRarity(null);
        }
      } else {
        toast.error("Fusion failed!");
      }
    }, 900);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #7c3aed44, #4f46e544)",
            border: "1px solid #7c3aed66",
          }}
        >
          <FlaskConical className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Fuse Machine</h2>
          <p className="text-sm text-muted-foreground">
            Combine 3 of any rarity → 1 of the next tier
          </p>
        </div>
      </div>

      {/* Upgrade path */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 flex-nowrap">
        {RARITIES.map((r, i) => (
          <div key={r} className="flex items-center gap-1 flex-shrink-0">
            <span
              className="text-xs font-bold font-mono px-2 py-0.5 rounded"
              style={{
                color: RARITY_COLORS[r],
                backgroundColor: `${RARITY_COLORS[r]}18`,
              }}
            >
              {RARITY_LABELS[r]}
            </span>
            {i < RARITIES.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Rarity selector */}
      {fusableRarities.length === 0 ? (
        <div
          data-ocid="fuse.empty_state"
          className="flex-1 flex flex-col items-center justify-center gap-3 text-center"
        >
          <FlaskConical className="w-12 h-12 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No meteorites ready to fuse.</p>
          <p className="text-sm text-muted-foreground">
            You need at least 3 of any type to fuse.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RARITIES.map((rarity, i) => {
              const count = inventory[rarity] || 0;
              const canFuse = count >= 3 && i < RARITIES.length - 1;
              const isSelected = selectedRarity === rarity;
              const color = RARITY_COLORS[rarity];

              return (
                <button
                  type="button"
                  key={rarity}
                  onClick={() => canFuse && setSelectedRarity(rarity)}
                  disabled={!canFuse}
                  data-ocid={`fuse.item.${i + 1}`}
                  className="p-3 rounded-xl border text-left transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isSelected
                      ? `${color}22`
                      : canFuse
                        ? `${color}0d`
                        : "transparent",
                    borderColor: isSelected
                      ? color
                      : canFuse
                        ? `${color}44`
                        : "oklch(var(--border))",
                    boxShadow: isSelected ? `0 0 12px 3px ${color}44` : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-xs font-bold font-mono"
                      style={{ color }}
                    >
                      {RARITY_LABELS[rarity]}
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono mt-1 text-foreground">
                    ×{count}
                    {canFuse && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.floor(count / 3)} fuses)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fusion UI */}
          {selectedRarity && nextRarity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 flex flex-col items-center gap-6"
              style={{
                background: `radial-gradient(ellipse at top, ${RARITY_COLORS[selectedRarity]}12 0%, transparent 70%)`,
                border: `1px solid ${RARITY_COLORS[selectedRarity]}33`,
              }}
            >
              {/* Slots */}
              <div className="flex items-center gap-3">
                {[0, 1, 2].map((i) => (
                  <MeteoriteSlot
                    key={i}
                    rarity={selectedRarity}
                    index={i}
                    isFusing={isFusing}
                  />
                ))}

                <motion.div
                  animate={
                    isFusing ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}
                  }
                  transition={{ duration: 0.6, repeat: 1 }}
                  className="text-2xl text-purple-400"
                >
                  ⚡
                </motion.div>

                {/* Result slot */}
                <AnimatePresence>
                  {showResult && lastResult ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${RARITY_COLORS[lastResult]}44, ${RARITY_COLORS[lastResult]}18)`,
                        borderColor: RARITY_COLORS[lastResult],
                        boxShadow: `0 0 20px 6px ${RARITY_COLORS[lastResult]}66`,
                      }}
                    >
                      <div
                        className={`w-10 h-10 rounded-full ${lastResult === "crazy" ? "rarity-crazy" : lastResult === "googleplex" ? "rarity-googleplex" : ""}`}
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${RARITY_COLORS[lastResult]}dd, ${RARITY_COLORS[lastResult]}55)`,
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2"
                      style={{
                        borderColor: `${RARITY_COLORS[nextRarity]}44`,
                        borderStyle: "dashed",
                        background: `${RARITY_COLORS[nextRarity]}08`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full opacity-40"
                        style={{ backgroundColor: RARITY_COLORS[nextRarity] }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Labels */}
              <div className="flex items-center gap-3 text-sm font-mono">
                <span
                  style={{ color: RARITY_COLORS[selectedRarity] }}
                  className="font-bold"
                >
                  3× {RARITY_LABELS[selectedRarity]}
                </span>
                <span className="text-muted-foreground">→</span>
                <span
                  style={{ color: RARITY_COLORS[nextRarity] }}
                  className="font-bold"
                >
                  1× {RARITY_LABELS[nextRarity]}
                </span>
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                You have {inventory[selectedRarity] || 0}{" "}
                {RARITY_LABELS[selectedRarity]} meteorites
              </div>

              {/* Fuse button */}
              <motion.button
                data-ocid="fuse.primary_button"
                onClick={handleFuse}
                disabled={isFusing || (inventory[selectedRarity] || 0) < 3}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full max-w-xs py-3 rounded-xl font-display font-black text-lg tracking-wide uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${RARITY_COLORS[selectedRarity]}, ${RARITY_COLORS[nextRarity]})`,
                  boxShadow: `0 0 20px 5px ${RARITY_COLORS[selectedRarity]}55`,
                  color: "white",
                }}
              >
                {isFusing ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    Fusing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    FUSE
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
