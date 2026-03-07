import { Coins, Landmark, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  SELL_PRICES,
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

// ---------------------------------------------------------------------------
// Picker modal — choose which rarity to place on a plot
// ---------------------------------------------------------------------------
function RarityPickerModal({
  plotIndex,
  onClose,
}: {
  plotIndex: number;
  onClose: () => void;
}) {
  const { inventory, placeInMuseum } = useGameStore();

  const available = RARITIES.filter((r) => (inventory[r] || 0) > 0);

  return (
    <motion.div
      data-ocid="museum.picker.modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative rounded-2xl p-5 w-full max-w-sm overflow-y-auto max-h-[80vh]"
        style={{
          background: "linear-gradient(180deg, #1a1525 0%, #14101e 100%)",
          border: "2px solid #c9a84c66",
          boxShadow: "0 0 40px #c9a84c22",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "#e8d5a0" }}
          >
            Place on Plot {plotIndex + 1}
          </p>
          <button
            type="button"
            data-ocid="museum.picker.close_button"
            onClick={onClose}
            className="p-1 rounded-lg transition-all hover:bg-white/10"
          >
            <X className="w-4 h-4" style={{ color: "#c9a84c" }} />
          </button>
        </div>

        {available.length === 0 ? (
          <div
            data-ocid="museum.picker.empty_state"
            className="text-center py-8"
          >
            <p className="text-sm" style={{ color: "#c9a84c88" }}>
              No meteorites in inventory. Go dig some first!
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
                  data-ocid={`museum.picker.${rarity}.button`}
                  onClick={() => {
                    placeInMuseum(plotIndex, rarity);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(180deg, ${color}18 0%, ${color}08 100%)`,
                    border: `1px solid ${color}55`,
                  }}
                >
                  <MeteoriteOrb rarity={rarity} size={40} />
                  <RarityBadge rarity={rarity} />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#c9a84c88" }}
                  >
                    ×{count.toLocaleString()}
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

// ---------------------------------------------------------------------------
// A single museum plot
// ---------------------------------------------------------------------------
function MuseumPlot({
  index,
  rarity,
  onPlace,
  onRemove,
}: {
  index: number;
  rarity: Rarity | null;
  onPlace: (plotIndex: number) => void;
  onRemove: (plotIndex: number) => void;
}) {
  const color = rarity ? RARITY_COLORS[rarity] : "#c9a84c";
  const hasItem = !!rarity;

  return (
    <motion.div
      data-ocid={`museum.plot.item.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
      className="relative flex flex-col rounded-xl overflow-hidden"
      style={{
        border: hasItem ? `2px solid ${color}66` : "2px solid #2a2535",
        background: hasItem
          ? `linear-gradient(180deg, ${color}0a 0%, #0d0b1488 100%)`
          : "linear-gradient(180deg, #0f0c1a 0%, #0a0812 100%)",
        boxShadow: hasItem
          ? `0 0 20px 2px ${color}22, inset 0 0 20px ${color}08`
          : "none",
      }}
    >
      {/* Plot number badge */}
      <div
        className="absolute top-2 left-2 text-[9px] font-mono rounded px-1"
        style={{
          color: "#c9a84c88",
          background: "#0a081288",
        }}
      >
        #{index + 1}
      </div>

      {/* Remove button */}
      {hasItem && (
        <button
          type="button"
          data-ocid={`museum.plot.delete_button.${index + 1}`}
          onClick={() => onRemove(index)}
          title="Remove from plot"
          className="absolute top-2 right-2 p-1 rounded-lg transition-all hover:bg-red-500/20 z-10"
        >
          <Trash2 className="w-3 h-3" style={{ color: "#ef444488" }} />
        </button>
      )}

      {/* Display area */}
      <div
        className="flex items-center justify-center py-5 relative min-h-[100px]"
        style={{
          background: hasItem
            ? `radial-gradient(ellipse at 50% 80%, ${color}15 0%, transparent 70%)`
            : "transparent",
          borderBottom: hasItem ? `1px solid ${color}33` : "1px solid #2a2535",
        }}
      >
        {hasItem && (
          <div
            className="absolute inset-x-0 top-0 h-6 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${color}30 0%, transparent 70%)`,
            }}
          />
        )}

        {hasItem ? (
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: index * 0.3,
            }}
          >
            <MeteoriteOrb rarity={rarity} size={64} />
          </motion.div>
        ) : (
          <button
            type="button"
            data-ocid={`museum.plot.open_modal_button.${index + 1}`}
            onClick={() => onPlace(index)}
            className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all hover:border-yellow-600/60 hover:bg-yellow-500/5 group"
            style={{ borderColor: "#3a3550" }}
            title="Place a meteorite here"
          >
            <Plus
              className="w-6 h-6 opacity-30 group-hover:opacity-70 transition-all"
              style={{ color: "#c9a84c" }}
            />
          </button>
        )}
      </div>

      {/* Plaque */}
      <div
        className="px-3 py-3 flex flex-col items-center gap-1.5"
        style={{
          background: "linear-gradient(180deg, #1a1525 0%, #140f1e 100%)",
          borderTop: hasItem ? "1px solid #c9a84c44" : "1px solid #2a2535",
        }}
      >
        {hasItem && (
          <div
            className="w-8 h-0.5 rounded-full mb-0.5"
            style={{
              background:
                "linear-gradient(90deg, transparent, #c9a84c, transparent)",
            }}
          />
        )}

        {hasItem ? (
          <>
            <RarityBadge rarity={rarity} />
            <button
              type="button"
              data-ocid={`museum.plot.edit_button.${index + 1}`}
              onClick={() => onPlace(index)}
              className="text-[9px] uppercase tracking-widest opacity-40 hover:opacity-80 transition-all mt-0.5"
              style={{
                color: "#c9a84c",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              swap
            </button>
          </>
        ) : (
          <p
            className="text-[9px] uppercase tracking-widest opacity-25"
            style={{
              color: "#c9a84c",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            empty plot
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main InventoryPanel
// ---------------------------------------------------------------------------
export default function InventoryPanel() {
  const {
    inventory,
    totalFound,
    museumPlots,
    maxMuseumPlots,
    removeFromMuseum,
    collectMuseumIncome,
    museumLastCollect,
    multiplier,
  } = useGameStore();
  const [pickerPlot, setPickerPlot] = useState<number | null>(null);
  const [pendingIncome, setPendingIncome] = useState(0);

  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);
  const placedCount = Object.values(museumPlots).filter(Boolean).length;

  // Calculate pending income every second
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const secondsElapsed = (now - museumLastCollect) / 1000;
      let total = 0;
      for (const rarity of Object.values(museumPlots)) {
        if (rarity) {
          const rate = (SELL_PRICES[rarity] || 1) * 0.1;
          total += rate * secondsElapsed;
        }
      }
      setPendingIncome(Math.floor(total * multiplier));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [museumPlots, museumLastCollect, multiplier]);

  const handleCollect = () => {
    const earned = collectMuseumIncome();
    if (earned > 0) {
      toast.success(`Collected ${earned.toLocaleString()} ✦ from your museum!`);
    } else {
      toast("Nothing to collect yet — place meteorites to start earning!");
    }
  };

  // Build array of plots
  const plots: Array<Rarity | null> = Array.from(
    { length: maxMuseumPlots },
    (_, i) => museumPlots[i] ?? null,
  );

  return (
    <div
      className="h-full flex flex-col overflow-y-auto"
      style={{
        background:
          "linear-gradient(180deg, #0d0b14 0%, #100d1c 40%, #14101e 70%, #1a1525 100%)",
      }}
    >
      {/* Museum ceiling */}
      <div
        className="relative flex-shrink-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0812 0%, #140f20 60%, transparent 100%)",
          paddingBottom: "2px",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c44 30%, #c9a84c88 50%, #c9a84c44 70%, transparent 100%)",
          }}
        />

        <div className="flex flex-col items-center pt-8 pb-4 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3 mb-2"
          >
            <Landmark
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "#c9a84c" }}
            />
            <h1
              className="text-3xl md:text-4xl font-bold tracking-wider uppercase"
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                color: "#e8d5a0",
                textShadow: "0 0 30px #c9a84c66, 0 2px 4px rgba(0,0,0,0.8)",
                letterSpacing: "0.12em",
              }}
            >
              Meteorite Museum
            </h1>
            <Landmark
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "#c9a84c" }}
            />
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full max-w-lg h-px mb-4"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #c9a84c 20%, #f0d080 50%, #c9a84c 80%, transparent 100%)",
            }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-6 text-xs font-mono uppercase tracking-widest"
          >
            <div
              className="flex flex-col items-center gap-0.5"
              style={{ color: "#c9a84c" }}
            >
              <span className="opacity-60 text-[10px]">In Inventory</span>
              <span
                className="text-base font-bold"
                style={{ color: "#f0d080", textShadow: "0 0 10px #c9a84c" }}
              >
                {totalItems.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-8" style={{ background: "#c9a84c44" }} />
            <div
              className="flex flex-col items-center gap-0.5"
              style={{ color: "#c9a84c" }}
            >
              <span className="opacity-60 text-[10px]">On Display</span>
              <span
                className="text-base font-bold"
                style={{ color: "#f0d080", textShadow: "0 0 10px #c9a84c" }}
              >
                {placedCount}/{maxMuseumPlots}
              </span>
            </div>
            <div className="w-px h-8" style={{ background: "#c9a84c44" }} />
            <div
              className="flex flex-col items-center gap-0.5"
              style={{ color: "#c9a84c" }}
            >
              <span className="opacity-60 text-[10px]">Total Found</span>
              <span
                className="text-base font-bold"
                style={{ color: "#f0d080", textShadow: "0 0 10px #c9a84c" }}
              >
                {totalFound.toLocaleString()}
              </span>
            </div>
          </motion.div>

          {/* Museum Income Collector */}
          {placedCount > 0 && (
            <motion.button
              type="button"
              data-ocid="museum.collect.primary_button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleCollect}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-3 mt-2 px-6 py-3 rounded-2xl font-mono font-black text-sm uppercase tracking-widest transition-all"
              style={{
                background:
                  pendingIncome > 0
                    ? "linear-gradient(135deg, rgba(201,168,76,0.35) 0%, rgba(240,208,128,0.25) 100%)"
                    : "rgba(201,168,76,0.08)",
                border: `2px solid ${pendingIncome > 0 ? "#c9a84c" : "#c9a84c44"}`,
                color: pendingIncome > 0 ? "#f0d080" : "#c9a84c66",
                boxShadow:
                  pendingIncome > 0 ? "0 0 24px rgba(201,168,76,0.3)" : "none",
              }}
            >
              <Coins className="w-4 h-4" />
              Collect{" "}
              {pendingIncome > 0
                ? `+${pendingIncome.toLocaleString()} ✦`
                : "Income"}
              {pendingIncome > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className="text-lg"
                >
                  💰
                </motion.span>
              )}
            </motion.button>
          )}
        </div>

        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c55 25%, #c9a84c99 50%, #c9a84c55 75%, transparent 100%)",
          }}
        />
      </div>

      {/* Museum floor */}
      <div className="flex-1 p-4 md:p-6">
        {/* Section label */}
        <p
          className="text-center text-[10px] uppercase tracking-[0.3em] mb-5 opacity-40"
          style={{
            color: "#c9a84c",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          — Display Plots — click + to place a meteorite —
        </p>

        {/* Plot grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {plots.map((rarity, i) => {
            const stableKey = `museum-plot-${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)}`;
            return (
              <MuseumPlot
                key={stableKey}
                index={i}
                rarity={rarity}
                onPlace={(idx) => setPickerPlot(idx)}
                onRemove={(idx) => removeFromMuseum(idx)}
              />
            );
          })}
        </div>

        {/* Inventory collection below (reference only) */}
        {totalItems > 0 && (
          <>
            <div
              className="mt-10 h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #c9a84c33 25%, #c9a84c55 50%, #c9a84c33 75%, transparent 100%)",
              }}
            />
            <p
              className="text-center text-[10px] uppercase tracking-[0.3em] mt-5 mb-4 opacity-40"
              style={{
                color: "#c9a84c",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              — Inventory Reference —
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {RARITIES.filter((r) => (inventory[r] || 0) > 0).map((rarity) => {
                const color = RARITY_COLORS[rarity];
                return (
                  <div
                    key={rarity}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}44`,
                      color: color,
                    }}
                  >
                    <MeteoriteOrb rarity={rarity} size={16} />
                    {RARITY_LABELS[rarity]}
                    <span className="opacity-60">
                      ×{(inventory[rarity] || 0).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div
          className="mt-8 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c33 25%, #c9a84c55 50%, #c9a84c33 75%, transparent 100%)",
          }}
        />
        <p
          className="text-center text-[9px] mt-3 uppercase tracking-[0.4em] opacity-20"
          style={{
            color: "#c9a84c",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Meteorite Museum · Est. 2026
        </p>
      </div>

      {/* Rarity Picker Modal */}
      <AnimatePresence>
        {pickerPlot !== null && (
          <RarityPickerModal
            plotIndex={pickerPlot}
            onClose={() => setPickerPlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
