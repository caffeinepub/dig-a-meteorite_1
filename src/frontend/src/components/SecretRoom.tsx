import { Button } from "@/components/ui/button";
import { Sparkles, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  EXCHANGE_RATES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  SECRET_ROOM_RARITIES,
  useGameStore,
} from "./GameStore";

const COST_MULTIPLIER = 10;

function StarField() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 2 + star.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function SecretRoom({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { credits, adminAddMeteors } = useGameStore();
  const [acquiring, setAcquiring] = useState<Rarity | null>(null);

  const handleAcquire = (rarity: Rarity) => {
    const cost = EXCHANGE_RATES[rarity] * COST_MULTIPLIER;
    if (credits < cost) {
      toast.error(`Not enough credits! Need ${cost.toLocaleString()} ✦`);
      return;
    }

    setAcquiring(rarity);
    // Deduct credits and add meteorite
    useGameStore.getState().adminSetCredits(credits - cost);
    adminAddMeteors(rarity, 1);

    setTimeout(() => {
      setAcquiring(null);
      toast.success(`Acquired 1× ${RARITY_LABELS[rarity]}! ✨`, {
        description: `Cost: ${cost.toLocaleString()} ✦`,
      });
    }, 800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse at top, #0d0d2e 0%, #050510 100%)",
              border: "1px solid rgba(139,92,246,0.4)",
              boxShadow:
                "0 0 60px 20px rgba(139,92,246,0.2), 0 0 120px 40px rgba(6,182,212,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <StarField />

            {/* Header */}
            <div className="relative p-6 text-center border-b border-purple-900/30">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="text-5xl mb-3"
              >
                🌌
              </motion.div>
              <h2
                className="text-2xl font-display font-black text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #a855f7, #06b6d4, #ec4899)",
                }}
              >
                SECRET VAULT
              </h2>
              <p className="text-sm text-purple-300/70 mt-1 font-mono">
                Ultra-rare meteorites, for a price...
              </p>
              <div className="mt-2 text-xs text-yellow-400/80 font-mono">
                Balance: {credits.toLocaleString()} ✦
              </div>

              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meteorites */}
            <div className="relative p-6 grid grid-cols-2 gap-4">
              {SECRET_ROOM_RARITIES.map((rarity) => {
                const color = RARITY_COLORS[rarity];
                const label = RARITY_LABELS[rarity];
                const cost = EXCHANGE_RATES[rarity] * COST_MULTIPLIER;
                const canAfford = credits >= cost;
                const isAcquiring = acquiring === rarity;

                return (
                  <motion.div
                    key={rarity}
                    whileHover={{ scale: 1.03 }}
                    className="rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color}15, transparent 70%)`,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    {/* Orb */}
                    <motion.div
                      animate={{
                        boxShadow: [
                          `0 0 15px 5px ${color}55`,
                          `0 0 30px 10px ${color}88`,
                          `0 0 15px 5px ${color}55`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${rarity === "crazy" ? "rarity-crazy" : rarity === "googleplex" ? "rarity-googleplex" : ""}`}
                      style={{
                        background:
                          rarity === "crazy"
                            ? "conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #ff6bff, #ff6b6b)"
                            : rarity === "googleplex"
                              ? "radial-gradient(circle, #ff00ff, #cc00cc)"
                              : `radial-gradient(circle at 35% 35%, ${color}dd, ${color}55)`,
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-white opacity-80" />
                    </motion.div>

                    <div className="text-center">
                      <div
                        className="font-display font-bold text-sm"
                        style={{ color, textShadow: `0 0 10px ${color}` }}
                      >
                        {label}
                      </div>
                      <div className="text-xs text-yellow-400/80 font-mono mt-0.5">
                        {cost >= 1_000_000
                          ? `${(cost / 1_000_000).toFixed(1)}M`
                          : cost.toLocaleString()}{" "}
                        ✦
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAcquire(rarity)}
                      disabled={!canAfford || !!acquiring}
                      className="w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: canAfford
                          ? `${color}33`
                          : "transparent",
                        color: canAfford
                          ? color
                          : "oklch(var(--muted-foreground))",
                        border: `1px solid ${canAfford ? `${color}66` : "oklch(var(--border))"}`,
                      }}
                    >
                      {isAcquiring ? (
                        <span className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 animate-spin" />
                          Acquiring...
                        </span>
                      ) : canAfford ? (
                        "✦ ACQUIRE"
                      ) : (
                        "Need more ✦"
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="relative px-6 pb-4 text-center text-xs text-purple-400/50 font-mono">
              You found the secret vault. Tell no one.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
