import {
  Eye,
  EyeOff,
  FlaskConical,
  Lock,
  Package,
  Pickaxe,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
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

const FEATURES = [
  {
    icon: "⛏️",
    lucide: <Pickaxe className="w-5 h-5" />,
    title: "3D Excavation",
    desc: "Dig in a fully 3D earth terrain with particle effects",
    tab: "dig",
    accent: "#7c3aed",
    glow: "rgba(124,58,237,0.35)",
  },
  {
    icon: "🏠",
    lucide: <Package className="w-5 h-5" />,
    title: "Your Base",
    desc: "View and manage your meteorite collection at home base",
    tab: "inventory",
    accent: "#0ea5e9",
    glow: "rgba(14,165,233,0.35)",
  },
  {
    icon: "🛒",
    lucide: <ShoppingBag className="w-5 h-5" />,
    title: "Sell Shop",
    desc: "Sell your meteorites for credits",
    tab: "shop",
    accent: "#eab308",
    glow: "rgba(234,179,8,0.35)",
  },
  {
    icon: "⚗️",
    lucide: <FlaskConical className="w-5 h-5" />,
    title: "Fuse Machine",
    desc: "Combine 3 meteorites to upgrade to the next rarity",
    tab: "fuse",
    accent: "#f97316",
    glow: "rgba(249,115,22,0.35)",
  },
  {
    icon: "🔄",
    lucide: <RotateCcw className="w-5 h-5" />,
    title: "Rebirth System",
    desc: "Reset for permanent multiplier and base size upgrades",
    tab: "rebirth",
    accent: "#ec4899",
    glow: "rgba(236,72,153,0.35)",
  },
  {
    icon: "🔐",
    lucide: <Lock className="w-5 h-5" />,
    title: "Admin Panel",
    desc: "Secret admin access — enter code 9999 to unlock",
    tab: "admin",
    accent: "#64748b",
    glow: "rgba(100,116,139,0.35)",
  },
] as const;

const QUICK_ACTIONS = [
  {
    icon: <Pickaxe className="w-5 h-5" />,
    label: "Dig",
    tab: "dig",
    emoji: "⛏️",
    color: "#7c3aed",
  },
  {
    icon: <Package className="w-5 h-5" />,
    label: "Base",
    tab: "inventory",
    emoji: "🏠",
    color: "#0ea5e9",
  },
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    label: "Shop",
    tab: "shop",
    emoji: "🛒",
    color: "#eab308",
  },
  {
    icon: <FlaskConical className="w-5 h-5" />,
    label: "Fuse",
    tab: "fuse",
    emoji: "⚗️",
    color: "#f97316",
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    label: "Rebirth",
    tab: "rebirth",
    emoji: "🔄",
    color: "#ec4899",
  },
] as const;

export default function IndexPage({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const { totalFound, rebirthCount, credits, multiplier, isPublic, setPublic } =
    useGameStore();

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
          Dig a Meteorite
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
          data-ocid="index.dig.primary_button"
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

      {/* Public / Private Toggle */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border p-4 flex items-center justify-between gap-4"
          style={{
            backgroundColor: isPublic
              ? "rgba(16,185,129,0.08)"
              : "rgba(100,116,139,0.08)",
            borderColor: isPublic
              ? "rgba(16,185,129,0.35)"
              : "rgba(100,116,139,0.35)",
            transition: "background-color 0.3s, border-color 0.3s",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: isPublic
                  ? "rgba(16,185,129,0.2)"
                  : "rgba(100,116,139,0.2)",
                color: isPublic ? "#10b981" : "#94a3b8",
                transition: "all 0.3s",
              }}
            >
              {isPublic ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div
                className="font-bold text-sm font-display"
                style={{
                  color: isPublic ? "#10b981" : "#94a3b8",
                  transition: "color 0.3s",
                }}
              >
                {isPublic ? "Public Profile" : "Private Profile"}
              </div>
              <div className="text-xs text-muted-foreground">
                {isPublic
                  ? "Your museum and stats are visible to others"
                  : "Your museum and stats are hidden from others"}
              </div>
            </div>
          </div>

          {/* Toggle buttons */}
          <div
            className="flex rounded-lg overflow-hidden border flex-shrink-0"
            style={{
              borderColor: isPublic
                ? "rgba(16,185,129,0.4)"
                : "rgba(100,116,139,0.4)",
            }}
          >
            <button
              type="button"
              data-ocid="profile.public.toggle"
              onClick={() => setPublic(true)}
              className="px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wide transition-all flex items-center gap-1"
              style={{
                backgroundColor: isPublic
                  ? "rgba(16,185,129,0.35)"
                  : "transparent",
                color: isPublic ? "#10b981" : "#64748b",
              }}
            >
              <Eye className="w-3 h-3" />
              Public
            </button>
            <button
              type="button"
              data-ocid="profile.private.toggle"
              onClick={() => setPublic(false)}
              className="px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wide transition-all flex items-center gap-1 border-l"
              style={{
                backgroundColor: !isPublic
                  ? "rgba(100,116,139,0.35)"
                  : "transparent",
                color: !isPublic ? "#94a3b8" : "#64748b",
                borderColor: isPublic
                  ? "rgba(16,185,129,0.4)"
                  : "rgba(100,116,139,0.4)",
              }}
            >
              <EyeOff className="w-3 h-3" />
              Private
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-display font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-6 gap-2">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.tab}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(action.tab)}
              data-ocid={`index.${action.tab}.button`}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
              style={{
                backgroundColor: `${action.color}15`,
                borderColor: `${action.color}40`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${action.color}25`,
                  color: action.color,
                  boxShadow: `0 0 10px ${action.color}40`,
                }}
              >
                {action.icon}
              </div>
              <span
                className="text-[10px] font-bold font-mono uppercase tracking-wide"
                style={{ color: action.color }}
              >
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* All Features */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-display font-bold mb-3">All Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((feat, i) => (
            <motion.button
              key={feat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(feat.tab)}
              data-ocid={`index.${feat.tab}.card`}
              className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all group"
              style={{
                backgroundColor: `${feat.accent}0d`,
                borderColor: `${feat.accent}30`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = `${feat.accent}70`;
                el.style.boxShadow = `0 4px 20px ${feat.glow}`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = `${feat.accent}30`;
                el.style.boxShadow = "none";
              }}
            >
              {/* Icon circle */}
              <div
                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{
                  backgroundColor: `${feat.accent}20`,
                  boxShadow: `0 0 12px ${feat.glow}`,
                }}
              >
                {feat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="font-bold text-sm mb-0.5 font-display"
                  style={{ color: feat.accent }}
                >
                  {feat.title}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {feat.desc}
                </div>
              </div>
              {/* Arrow indicator */}
              <div
                className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                style={{ color: feat.accent }}
              >
                →
              </div>
            </motion.button>
          ))}
        </div>
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
