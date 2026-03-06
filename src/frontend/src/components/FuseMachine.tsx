import { ChevronRight, FlaskConical, X, Zap } from "lucide-react";
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

// ── tiny orb used in slots & picker ─────────────────────────────────────────
function MeteorOrb({
  rarity,
  size = 40,
}: {
  rarity: Rarity;
  size?: number;
}) {
  const color = RARITY_COLORS[rarity];
  const isCrazy = rarity === "crazy";
  const isGoogleplex = rarity === "googleplex";
  const isDivine = rarity === "divine";
  return (
    <div
      className={`rounded-full flex-shrink-0 relative ${isGoogleplex ? "rarity-googleplex" : ""} ${isCrazy ? "rarity-crazy" : ""}`}
      style={{
        width: size,
        height: size,
        background: isCrazy
          ? "conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #ff6bff, #ff6b6b)"
          : isGoogleplex
            ? "radial-gradient(circle at 35% 35%, #ff00ff, #cc00cc)"
            : isDivine
              ? "radial-gradient(circle at 35% 35%, #ffffff, #c0c0c0)"
              : `radial-gradient(circle at 35% 35%, ${color}dd, ${color}55)`,
        boxShadow: isGoogleplex
          ? "0 0 16px 4px #ff00ff"
          : `0 0 10px 2px ${color}77`,
      }}
    >
      <div
        className="absolute top-1 left-1 rounded-full opacity-60"
        style={{
          width: size * 0.28,
          height: size * 0.28,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.8), transparent)",
        }}
      />
    </div>
  );
}

// ── a single fuse slot ───────────────────────────────────────────────────────
function FuseSlot({
  rarity,
  index,
  isFusing,
  onClear,
  onAdd,
}: {
  rarity: Rarity | null;
  index: number;
  isFusing: boolean;
  onClear: () => void;
  onAdd: () => void;
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
      transition={{ delay: index * 0.08, duration: isFusing ? 0.6 : 0.3 }}
      className="relative w-20 h-20 rounded-2xl flex items-center justify-center border-2 cursor-pointer group transition-all"
      style={{
        background: color
          ? `radial-gradient(circle at 35% 35%, ${color}44, ${color}18)`
          : "oklch(var(--muted) / 0.2)",
        borderColor: color ? `${color}88` : "oklch(var(--border))",
        boxShadow: color ? `0 0 15px 4px ${color}44` : "none",
      }}
      onClick={rarity ? onClear : onAdd}
      data-ocid={`fuse.slot.item.${index + 1}`}
      title={rarity ? "Remove (click to clear)" : "Click to add meteorite"}
    >
      {rarity ? (
        <>
          <MeteorOrb rarity={rarity} size={42} />
          {/* remove badge */}
          <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
              style={{ boxShadow: "0 0 6px #ef4444" }}
            >
              <X className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </>
      ) : (
        <span className="text-muted-foreground text-3xl select-none group-hover:opacity-70 transition-opacity">
          +
        </span>
      )}
    </motion.div>
  );
}

// ── inventory picker modal ────────────────────────────────────────────────────
function InventoryPicker({
  onPick,
  onClose,
  slotIndex,
}: {
  onPick: (rarity: Rarity) => void;
  onClose: () => void;
  slotIndex: number;
}) {
  const { inventory } = useGameStore();
  const available = RARITIES.filter(
    (r, i) => (inventory[r] || 0) > 0 && i < RARITIES.length - 1,
  );

  return (
    <motion.div
      data-ocid="fuse.picker.modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 24 }}
        className="relative rounded-2xl p-5 w-full max-w-sm overflow-y-auto max-h-[80vh]"
        style={{
          background: "linear-gradient(180deg, #1a1228 0%, #120e1e 100%)",
          border: "2px solid #7c3aed55",
          boxShadow: "0 0 40px #7c3aed22",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
            Pick for Slot {slotIndex + 1}
          </p>
          <button
            type="button"
            data-ocid="fuse.picker.close_button"
            onClick={onClose}
            className="p-1 rounded-lg transition-all hover:bg-white/10"
          >
            <X className="w-4 h-4 text-purple-400" />
          </button>
        </div>

        {available.length === 0 ? (
          <div data-ocid="fuse.picker.empty_state" className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No meteorites available to fuse. Go dig some first!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {available.map((rarity) => {
              const color = RARITY_COLORS[rarity];
              const count = inventory[rarity] || 0;
              return (
                <button
                  key={rarity}
                  type="button"
                  data-ocid={`fuse.picker.${rarity}.button`}
                  onClick={() => {
                    onPick(rarity);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(180deg, ${color}18 0%, ${color}08 100%)`,
                    border: `1px solid ${color}55`,
                  }}
                >
                  <MeteorOrb rarity={rarity} size={44} />
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color, textShadow: `0 0 6px ${color}` }}
                  >
                    {RARITY_LABELS[rarity]}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    ×{count.toLocaleString()} in bag
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
// Stable slot key names (supports up to 20 slots)
const SLOT_KEYS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
];

export default function FuseMachine() {
  const { inventory, fuseMeteors, fuseSlots, rebirthCount } = useGameStore();

  // Dynamic slots based on rebirths (min 3)
  const slotCount = Math.max(3, fuseSlots);
  const [slots, setSlots] = useState<(Rarity | null)[]>(() =>
    Array(Math.max(3, fuseSlots)).fill(null),
  );
  const [isFusing, setIsFusing] = useState(false);
  const [lastResult, setLastResult] = useState<Rarity | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  // Resize slots array when slotCount changes
  const currentSlots =
    slots.length !== slotCount
      ? [
          ...slots.slice(0, slotCount),
          ...Array(Math.max(0, slotCount - slots.length)).fill(null),
        ]
      : slots;

  // The rarity in the slots (all must be the same non-null rarity)
  // For fusing: need at least 3 matching slots filled
  const filledSlots = currentSlots.filter(Boolean) as Rarity[];
  const allSame =
    filledSlots.length >= 3 && filledSlots.every((r) => r === filledSlots[0]);
  const selectedRarity: Rarity | null = allSame ? filledSlots[0] : null;

  const selectedIndex = selectedRarity ? RARITIES.indexOf(selectedRarity) : -1;
  const nextRarity =
    selectedIndex >= 0 && selectedIndex < RARITIES.length - 1
      ? RARITIES[selectedIndex + 1]
      : null;

  // Count how many of the selected rarity are in the slots vs inventory
  const slotsUsed = currentSlots.filter((s) => s !== null).length;

  // Can fuse: at least 3 slots filled with same rarity, enough in inventory
  const availableForRarity = selectedRarity
    ? inventory[selectedRarity] || 0
    : 0;
  const slotsOfSelected = currentSlots.filter(
    (s) => s === selectedRarity,
  ).length;
  const canFuse =
    selectedRarity !== null &&
    nextRarity !== null &&
    !isFusing &&
    slotsOfSelected >= 3 &&
    availableForRarity >= slotsOfSelected;

  const handlePickForSlot = (slotIndex: number) => {
    setPickerSlot(slotIndex);
  };

  const handleClearSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setShowResult(false);
  };

  const handlePick = (rarity: Rarity) => {
    if (pickerSlot === null) return;
    setSlots((prev) => {
      const synced =
        prev.length !== slotCount
          ? [
              ...prev.slice(0, slotCount),
              ...Array(Math.max(0, slotCount - prev.length)).fill(null),
            ]
          : [...prev];
      synced[pickerSlot] = rarity;
      return synced;
    });
    setShowResult(false);
    setPickerSlot(null);
  };

  const handleFuse = () => {
    if (!selectedRarity || !canFuse) return;
    setIsFusing(true);
    setShowResult(false);

    setTimeout(() => {
      const result = fuseMeteors(selectedRarity);
      setIsFusing(false);

      if (result.success) {
        setLastResult(result.result as Rarity);
        setShowResult(true);
        setSlots(Array(slotCount).fill(null));
        toast.success(
          `Fusion success! Got 1× ${RARITY_LABELS[result.result as Rarity]}!`,
          { duration: 3000 },
        );
      } else {
        toast.error("Not enough meteorites to fuse!");
        setSlots(Array(slotCount).fill(null));
      }
    }, 900);
  };

  const handleFillAll = (rarity: Rarity) => {
    setSlots(Array(slotCount).fill(rarity));
    setShowResult(false);
  };

  // Quick-fill rarities (≥ slotCount in inventory, not the last tier)
  const quickFillRarities = RARITIES.filter(
    (r, i) => (inventory[r] || 0) >= slotCount && i < RARITIES.length - 1,
  );

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
            Place {slotCount} matching meteorites → fuse into the next tier
          </p>
          {rebirthCount > 0 && (
            <p
              className="text-xs font-mono mt-0.5"
              style={{ color: "#f97316" }}
            >
              {slotCount} slots unlocked ({rebirthCount} rebirth
              {rebirthCount !== 1 ? "s" : ""})
            </p>
          )}
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

      {/* ── Fuse slots ── */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-5"
        style={{
          background: selectedRarity
            ? `radial-gradient(ellipse at top, ${RARITY_COLORS[selectedRarity]}12 0%, transparent 70%)`
            : "oklch(var(--card) / 0.4)",
          border: selectedRarity
            ? `1px solid ${RARITY_COLORS[selectedRarity]}33`
            : "1px solid oklch(var(--border))",
          transition: "all 0.3s",
        }}
      >
        <div className="flex items-center gap-4">
          {/* Dynamic input slots */}
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {SLOT_KEYS.slice(0, slotCount).map((key, i) => (
              <FuseSlot
                key={key}
                rarity={currentSlots[i] ?? null}
                index={i}
                isFusing={isFusing}
                onClear={() => handleClearSlot(i)}
                onAdd={() => handlePickForSlot(i)}
              />
            ))}
          </div>

          {/* Arrow + output slot */}
          <motion.div
            animate={
              isFusing ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}
            }
            transition={{ duration: 0.6, repeat: 1 }}
            className="text-2xl text-purple-400 select-none"
          >
            ⚡
          </motion.div>

          <AnimatePresence mode="wait">
            {showResult && lastResult ? (
              <motion.div
                key="result"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.3, 1], opacity: 1 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${RARITY_COLORS[lastResult]}44, ${RARITY_COLORS[lastResult]}18)`,
                  borderColor: RARITY_COLORS[lastResult],
                  boxShadow: `0 0 20px 6px ${RARITY_COLORS[lastResult]}66`,
                }}
              >
                <MeteorOrb rarity={lastResult} size={44} />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
                style={{
                  borderColor: nextRarity
                    ? `${RARITY_COLORS[nextRarity]}44`
                    : "oklch(var(--border))",
                  borderStyle: "dashed",
                  background: nextRarity
                    ? `${RARITY_COLORS[nextRarity]}08`
                    : "transparent",
                }}
              >
                {nextRarity ? (
                  <div
                    className="w-9 h-9 rounded-full opacity-40"
                    style={{ backgroundColor: RARITY_COLORS[nextRarity] }}
                  />
                ) : (
                  <span className="text-muted-foreground text-xl">?</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Labels */}
        {selectedRarity && nextRarity && (
          <div className="flex items-center gap-3 text-sm font-mono">
            <span
              style={{ color: RARITY_COLORS[selectedRarity] }}
              className="font-bold"
            >
              {slotCount}× {RARITY_LABELS[selectedRarity]}
            </span>
            <span className="text-muted-foreground">→</span>
            <span
              style={{ color: RARITY_COLORS[nextRarity] }}
              className="font-bold"
            >
              1× {RARITY_LABELS[nextRarity]}
            </span>
          </div>
        )}

        {/* Slot hint */}
        {slotsUsed > 0 && !allSame && (
          <p className="text-xs text-amber-400 font-mono">
            All {slotCount} slots must hold the same rarity
          </p>
        )}

        {/* Fuse button */}
        <motion.button
          data-ocid="fuse.primary_button"
          onClick={handleFuse}
          disabled={!canFuse}
          whileHover={canFuse ? { scale: 1.03 } : {}}
          whileTap={canFuse ? { scale: 0.97 } : {}}
          className="w-full max-w-xs py-3 rounded-xl font-display font-black text-lg tracking-wide uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={
            canFuse && selectedRarity && nextRarity
              ? {
                  background: `linear-gradient(135deg, ${RARITY_COLORS[selectedRarity]}, ${RARITY_COLORS[nextRarity]})`,
                  boxShadow: `0 0 20px 5px ${RARITY_COLORS[selectedRarity]}55`,
                  color: "white",
                }
              : {
                  background: "oklch(var(--muted))",
                  color: "oklch(var(--muted-foreground))",
                }
          }
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

        {/* Clear all */}
        {slotsUsed > 0 && (
          <button
            type="button"
            data-ocid="fuse.cancel_button"
            onClick={() => {
              setSlots(Array(slotCount).fill(null));
              setShowResult(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Clear all slots
          </button>
        )}
      </div>

      {/* ── Quick-fill row ── */}
      {quickFillRarities.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Quick-fill all {slotCount} slots:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickFillRarities.map((rarity) => {
              const color = RARITY_COLORS[rarity];
              const count = inventory[rarity] || 0;
              return (
                <button
                  key={rarity}
                  type="button"
                  data-ocid={`fuse.quickfill.${rarity}.button`}
                  onClick={() => handleFillAll(rarity)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}55`,
                    color: color,
                  }}
                >
                  <MeteorOrb rarity={rarity} size={16} />
                  {RARITY_LABELS[rarity]}
                  <span className="opacity-60">×{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Full inventory reference ── */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Your inventory:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {RARITIES.map((rarity, i) => {
            const count = inventory[rarity] || 0;
            const canFuseThis = count >= slotCount && i < RARITIES.length - 1;
            const color = RARITY_COLORS[rarity];
            return (
              <div
                key={rarity}
                data-ocid={`fuse.inventory.item.${i + 1}`}
                className="p-3 rounded-xl border text-left"
                style={{
                  backgroundColor: canFuseThis ? `${color}0d` : "transparent",
                  borderColor: canFuseThis
                    ? `${color}44`
                    : "oklch(var(--border))",
                  opacity: count === 0 ? 0.35 : 1,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
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
                  ×{count.toLocaleString()}
                  {canFuseThis && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.floor(count / slotCount)} fuses)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Picker modal */}
      <AnimatePresence>
        {pickerSlot !== null && (
          <InventoryPicker
            slotIndex={pickerSlot}
            onPick={handlePick}
            onClose={() => setPickerSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
