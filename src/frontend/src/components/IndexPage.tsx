import { motion } from "motion/react";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  useGameStore,
} from "./GameStore";

const RARITY_EMOJIS: Record<string, string> = {
  common: "🪨",
  rare: "💎",
  epic: "🔮",
  legendary: "🌟",
  mythic: "🔥",
  god: "👑",
  secret: "🌸",
  celestial: "❄️",
  divine: "✨",
  crazy: "🌈",
  googleplex: "🌌",
};

export default function IndexPage({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const { totalFound, rebirthCount, credits, multiplier } = useGameStore();

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center py-12 px-6 text-center overflow-hidden">
        {/* Animated meteor */}
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="text-8xl mb-4"
        >
          ☄️
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-display font-black mb-2"
          style={{
            background: "linear-gradient(135deg, #c4b5fd, #818cf8, #38bdf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Meteorite Digger
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm sm:text-base max-w-md"
        >
          Excavate the cosmos. Collect meteorites across 11 rarity tiers. Fuse
          them for greater power. Rebirth for eternal upgrades.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate("dig")}
          className="mt-6 px-8 py-4 rounded-full font-display font-black text-lg tracking-wide text-white"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)",
            boxShadow: "0 0 30px 8px rgba(139,92,246,0.4)",
          }}
        >
          ⚡ START DIGGING
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 mb-6">
        {[
          {
            label: "Total Found",
            value: formatNum(totalFound),
            icon: "🪨",
            color: "#8b5cf6",
          },
          {
            label: "Credits",
            value: `${formatNum(credits)} ✦`,
            icon: "💰",
            color: "#eab308",
          },
          {
            label: "Rebirths",
            value: rebirthCount,
            icon: "🔄",
            color: "#f97316",
          },
          {
            label: "Multiplier",
            value: `×${multiplier}`,
            icon: "⚡",
            color: "#06b6d4",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="rounded-xl p-4 text-center border"
            style={{
              backgroundColor: `${stat.color}0d`,
              borderColor: `${stat.color}33`,
            }}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div
              className="text-lg font-bold font-mono"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rarity tiers */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-display font-bold mb-3">Rarity Tiers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {RARITIES.map((rarity, i) => {
            const color = RARITY_COLORS[rarity];
            return (
              <motion.div
                key={rarity}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-2 p-2.5 rounded-lg border"
                style={{
                  backgroundColor: `${color}0d`,
                  borderColor: `${color}33`,
                }}
              >
                <span className="text-xl">{RARITY_EMOJIS[rarity]}</span>
                <div>
                  <div
                    className="text-xs font-bold font-mono"
                    style={{ color, textShadow: `0 0 6px ${color}` }}
                  >
                    {RARITY_LABELS[rarity]}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    #{i + 1} rarity
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-display font-bold mb-3">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: "⛏️",
              title: "3D Excavation",
              desc: "Dig in a fully 3D earth terrain with particle effects",
              tab: "dig",
            },
            {
              icon: "⚗️",
              title: "Fuse Machine",
              desc: "Combine 3 meteorites to upgrade to the next rarity",
              tab: "fuse",
            },
            {
              icon: "💳",
              title: "Credits Machine",
              desc: "Exchange meteorites for Caffeine Credits at premium rates",
              tab: "credits",
            },
            {
              icon: "🔄",
              title: "Rebirth System",
              desc: "Reset for permanent multiplier and base size upgrades",
              tab: "rebirth",
            },
          ].map((feat, i) => (
            <motion.button
              key={feat.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(feat.tab)}
              className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all"
              style={{
                backgroundColor: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
              }}
            >
              <span className="text-2xl">{feat.icon}</span>
              <div>
                <div className="font-bold text-sm text-foreground">
                  {feat.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {feat.desc}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
