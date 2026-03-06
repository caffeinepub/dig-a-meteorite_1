import { Landmark, Lock } from "lucide-react";
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
    <div
      className="h-full flex flex-col overflow-y-auto"
      style={{
        background:
          "linear-gradient(180deg, #0d0b14 0%, #100d1c 40%, #14101e 70%, #1a1525 100%)",
      }}
    >
      {/* Museum ceiling / top atmosphere */}
      <div
        className="relative flex-shrink-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0812 0%, #140f20 60%, transparent 100%)",
          paddingBottom: "2px",
        }}
      >
        {/* Decorative ceiling lights */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #c9a84c44 30%, #c9a84c88 50%, #c9a84c44 70%, transparent 100%)",
          }}
        />

        {/* Grand museum header */}
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
              🏛️ Meteorite Museum
            </h1>
            <Landmark
              className="w-8 h-8 flex-shrink-0"
              style={{ color: "#c9a84c" }}
            />
          </motion.div>

          {/* Gold divider */}
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

          {/* Stats bar */}
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
              <span className="opacity-60 text-[10px]">In Collection</span>
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
              <span className="opacity-60 text-[10px]">Total Found</span>
              <span
                className="text-base font-bold"
                style={{ color: "#f0d080", textShadow: "0 0 10px #c9a84c" }}
              >
                {totalFound.toLocaleString()}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom divider of header */}
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
        {!hasAny ? (
          <motion.div
            data-ocid="inventory.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-20"
          >
            {/* Empty pedestals silhouette */}
            <div className="flex gap-6 opacity-20">
              {[
                { sz: 40, id: "sm-left" },
                { sz: 56, id: "lg-center" },
                { sz: 40, id: "sm-right" },
              ].map(({ sz, id }) => (
                <div
                  key={id}
                  className="rounded-full border-2 border-dashed"
                  style={{
                    width: sz,
                    height: sz,
                    borderColor: "#c9a84c",
                  }}
                />
              ))}
            </div>
            <div>
              <p
                className="text-lg font-bold uppercase tracking-widest mb-1"
                style={{
                  color: "#c9a84c99",
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                }}
              >
                Hall is Empty
              </p>
              <p className="text-sm" style={{ color: "#c9a84c55" }}>
                Visit the Dig tab to begin your collection
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Museum floor grid label */}
            <p
              className="text-center text-[10px] uppercase tracking-[0.3em] mb-6 opacity-40"
              style={{
                color: "#c9a84c",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              — Permanent Exhibition —
            </p>

            {/* Pedestal grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {RARITIES.map((rarity, i) => {
                const count = inventory[rarity] || 0;
                const color = RARITY_COLORS[rarity];
                const hasItem = count > 0;

                return (
                  <motion.div
                    key={rarity}
                    data-ocid={`inventory.item.${i + 1}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.05,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className="relative flex flex-col rounded-xl overflow-hidden"
                    style={{
                      border: hasItem
                        ? `2px solid ${color}66`
                        : "2px solid #2a2535",
                      background: hasItem
                        ? `linear-gradient(180deg, ${color}0a 0%, #0d0b1488 100%)`
                        : "linear-gradient(180deg, #0f0c1a 0%, #0a0812 100%)",
                      boxShadow: hasItem
                        ? `0 0 20px 2px ${color}22, inset 0 0 20px ${color}08`
                        : "none",
                    }}
                  >
                    {/* Glass case top — display area */}
                    <div
                      className="flex items-center justify-center py-5 relative"
                      style={{
                        background: hasItem
                          ? `radial-gradient(ellipse at 50% 80%, ${color}15 0%, transparent 70%)`
                          : "transparent",
                        borderBottom: hasItem
                          ? `1px solid ${color}33`
                          : "1px solid #2a2535",
                      }}
                    >
                      {/* Spotlight from above */}
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
                          animate={{
                            y: [0, -4, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        >
                          <MeteoriteOrb rarity={rarity} size={64} />
                        </motion.div>
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center"
                          style={{ borderColor: "#2a2535" }}
                        >
                          <Lock
                            className="w-5 h-5 opacity-20"
                            style={{ color: "#6b6080" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Gold plaque section */}
                    <div
                      className="px-3 py-3 flex flex-col items-center gap-1.5"
                      style={{
                        background:
                          "linear-gradient(180deg, #1a1525 0%, #140f1e 100%)",
                        borderTop: hasItem
                          ? "1px solid #c9a84c44"
                          : "1px solid #2a2535",
                      }}
                    >
                      {/* Plaque border top accent */}
                      {hasItem && (
                        <div
                          className="w-8 h-0.5 rounded-full mb-0.5"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, #c9a84c, transparent)",
                          }}
                        />
                      )}

                      <RarityBadge rarity={rarity} />

                      {/* Count display */}
                      <div
                        className="text-2xl font-bold font-mono leading-none"
                        style={{
                          color: hasItem ? color : "#3a3450",
                          textShadow: hasItem ? `0 0 12px ${color}88` : "none",
                        }}
                      >
                        {hasItem ? count.toLocaleString() : "—"}
                      </div>

                      {hasItem && (
                        <p
                          className="text-[9px] uppercase tracking-widest opacity-40"
                          style={{
                            color: "#c9a84c",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          specimens
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Museum floor texture strip */}
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
          </>
        )}
      </div>
    </div>
  );
}
