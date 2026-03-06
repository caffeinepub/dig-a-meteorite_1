import { Plus, Trash2, X } from "lucide-react";
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

function EmptySlot({
  index,
  onPlace,
}: {
  index: number;
  onPlace: (slotIndex: number, rarity: Rarity) => void;
}) {
  const { inventory } = useGameStore();
  const [showPicker, setShowPicker] = useState(false);

  const available = RARITIES.filter((r) => (inventory[r] || 0) > 0);

  return (
    <div className="relative">
      <motion.button
        type="button"
        data-ocid={`museum.slot.${index + 1}`}
        onClick={() => setShowPicker(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all"
        style={{
          borderColor: "rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <Plus className="w-6 h-6 opacity-40" style={{ color: "#a8b3cf" }} />
        <span
          className="text-xs font-mono opacity-40"
          style={{ color: "#a8b3cf" }}
        >
          Empty
        </span>
      </motion.button>

      <AnimatePresence>
        {showPicker && (
          <>
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-xl overflow-hidden"
              style={{
                background: "oklch(0.1 0.02 260)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                minWidth: 180,
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              <div
                className="px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider"
                style={{
                  color: "#a8b3cf",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Choose Rarity
              </div>
              {available.length === 0 ? (
                <div className="px-3 py-4 text-xs font-mono text-center opacity-50">
                  No meteorites available
                </div>
              ) : (
                available.map((r) => {
                  const color = RARITY_COLORS[r];
                  const count = inventory[r] || 0;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        onPlace(index, r);
                        setShowPicker(false);
                        toast.success(`Placed ${RARITY_LABELS[r]} in museum!`);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 5px ${color}`,
                        }}
                      />
                      <span
                        className="text-xs font-bold font-mono flex-1"
                        style={{ color }}
                      >
                        {RARITY_LABELS[r]}
                      </span>
                      <span className="text-xs font-mono opacity-50">
                        ×{count}
                      </span>
                    </button>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilledSlot({
  rarity,
  index,
  onRemove,
}: {
  rarity: Rarity;
  index: number;
  onRemove: (slotIndex: number) => void;
}) {
  const color = RARITY_COLORS[rarity];
  const label = RARITY_LABELS[rarity];

  return (
    <motion.div
      data-ocid={`museum.slot.${index + 1}`}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden border-2"
      style={{
        borderColor: `${color}66`,
        background: `radial-gradient(ellipse at 50% 30%, ${color}18 0%, rgba(0,0,0,0.4) 70%)`,
        boxShadow: `0 0 18px 4px ${color}22, inset 0 0 20px ${color}0a`,
      }}
    >
      {/* Glowing orb */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 2.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="w-10 h-10 rounded-full flex-shrink-0"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 20px 8px ${color}66, 0 0 40px 16px ${color}22`,
        }}
      />

      <span
        className="text-[10px] font-bold font-mono uppercase tracking-wider text-center px-1 leading-tight"
        style={{ color, textShadow: `0 0 8px ${color}` }}
      >
        {label}
      </span>

      {/* Remove button */}
      <button
        type="button"
        data-ocid={`museum.slot.delete_button.${index + 1}`}
        onClick={() => {
          onRemove(index);
          toast.success("Removed from museum");
        }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        style={{
          background: "rgba(239,68,68,0.8)",
          border: "1px solid rgba(239,68,68,0.5)",
        }}
      >
        <Trash2 className="w-3 h-3 text-white" />
      </button>
    </motion.div>
  );
}

export default function MuseumInterior({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { museumSlots, securityGuards, placeInMuseum, removeFromMuseum } =
    useGameStore();

  const filledCount = museumSlots.filter((s) => s.rarity !== null).length;
  const totalSlots = museumSlots.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="museum-interior"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          data-ocid="museum.modal"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.08 0.02 240) 0%, oklch(0.12 0.03 260) 50%, oklch(0.09 0.025 250) 100%)",
          }}
        >
          {/* Grand hall atmosphere — column accents */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Marble floor gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/3"
              style={{
                background:
                  "linear-gradient(to top, rgba(200,190,170,0.05) 0%, transparent 100%)",
              }}
            />
            {/* Vertical column lines */}
            {[15, 30, 70, 85].map((pct) => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${pct}%`,
                  background:
                    "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)",
                }}
              />
            ))}
            {/* Ceiling arch hint */}
            <div
              className="absolute top-0 left-0 right-0 h-24"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(150,130,255,0.08) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Top bar */}
          <div
            className="relative flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="text-2xl"
              >
                ☄️
              </motion.span>
              <div>
                <h1
                  className="font-display font-black text-lg leading-tight"
                  style={{
                    background:
                      "linear-gradient(135deg, #e8dcc8, #c4b08a, #e8dcc8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Meteorite Museum
                </h1>
                <p className="text-xs font-mono opacity-50">
                  Grand Hall of Celestial Artifacts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Slot count */}
              <div className="text-xs font-mono text-center">
                <div
                  className="font-bold text-base"
                  style={{
                    color: filledCount === totalSlots ? "#f59e0b" : "#a8b3cf",
                  }}
                >
                  {filledCount}/{totalSlots}
                </div>
                <div className="opacity-50">slots used</div>
              </div>

              {/* Close */}
              <motion.button
                type="button"
                data-ocid="museum.close_button"
                onClick={onClose}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <X className="w-4 h-4" style={{ color: "#a8b3cf" }} />
              </motion.button>
            </div>
          </div>

          {/* Museum content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 pb-8">
            {/* Grand title plaque */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <div
                className="inline-block px-6 py-2 rounded-full text-xs font-mono uppercase tracking-[0.25em]"
                style={{
                  background: "rgba(200,180,120,0.1)",
                  border: "1px solid rgba(200,180,120,0.25)",
                  color: "#c4b08a",
                }}
              >
                ✦ Display Collection ✦
              </div>
            </motion.div>

            {/* Slots grid */}
            {museumSlots.length === 0 ? (
              <div
                data-ocid="museum.empty_state"
                className="text-center py-12 opacity-50 font-mono text-sm"
              >
                No display slots available yet. Rebirth to unlock slots!
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8"
              >
                {museumSlots.map((slot, i) => {
                  const slotKey = `museum-slot-${i}`;
                  return slot.rarity ? (
                    <FilledSlot
                      key={slotKey}
                      rarity={slot.rarity}
                      index={i}
                      onRemove={removeFromMuseum}
                    />
                  ) : (
                    <EmptySlot
                      key={slotKey}
                      index={i}
                      onPlace={placeInMuseum}
                    />
                  );
                })}
              </motion.div>
            )}

            {/* Security Guards section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-4"
              style={{
                background: "rgba(15,30,60,0.6)",
                border: "1px solid rgba(14,165,233,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💂</span>
                <span
                  className="font-display font-bold text-sm"
                  style={{ color: "#7dd3fc" }}
                >
                  Security
                </span>
                <span className="font-mono text-xs opacity-60 ml-auto">
                  {securityGuards.length} guard
                  {securityGuards.length !== 1 ? "s" : ""} on duty
                </span>
              </div>

              {securityGuards.length === 0 ? (
                <p className="text-xs font-mono opacity-40 text-center py-2">
                  No guards deployed. Spawn guards from the Code Panel.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {securityGuards.map((guard) => (
                    <div
                      key={guard.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{
                        background: "rgba(14,165,233,0.1)",
                        border: "1px solid rgba(14,165,233,0.2)",
                      }}
                    >
                      <span className="text-sm">💂</span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "#7dd3fc" }}
                      >
                        {guard.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Hint */}
            <p className="text-center text-xs font-mono opacity-30 mt-4">
              Place meteorites on pedestals — rebirth to unlock more slots
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
