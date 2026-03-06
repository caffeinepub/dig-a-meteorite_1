import {
  Coins,
  Crown,
  FlaskConical,
  Lock,
  MapPin,
  Plus,
  Radio,
  RotateCcw,
  Shield,
  ShoppingBag,
  Skull,
  Snowflake,
  Sparkles,
  Swords,
  Terminal,
  Wind,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  RARITIES,
  RARITY_COLORS,
  RARITY_LABELS,
  type Rarity,
  useGameStore,
} from "./GameStore";

const ADMIN_CODE = "9999";
const CELESTIAL_CODE = "3752";
const IMPOSSIBLE_CODE = "4637";

const BUILDINGS = [
  { id: "fuse", label: "Fuse Machine", emoji: "⚗️", color: "#7c3aed" },
  { id: "inventory", label: "Museum", emoji: "🏛️", color: "#eab308" },
  { id: "shop", label: "Sell Shop", emoji: "🛒", color: "#22c55e" },
  { id: "rebirth", label: "Rebirth Altar", emoji: "🔄", color: "#f97316" },
  { id: "credits", label: "Credits Machine", emoji: "💰", color: "#eab308" },
];

export default function AdminPanel() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [creditsInput, setCreditsInput] = useState("");
  const [multiplierInput, setMultiplierInput] = useState("");
  const [rebirthInput, setRebirthInput] = useState("");
  const [baseSizeInput, setBaseSizeInput] = useState("");
  const [speedInput, setSpeedInput] = useState("");
  const [guardInput, setGuardInput] = useState("1");
  const [meteorRarity, setMeteorRarity] = useState<Rarity>("legendary");
  const [meteorQty, setMeteorQty] = useState("10");
  const [nextDigRarity, setNextDigRarity] = useState<Rarity>("googleplex");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const deleteConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    credits,
    multiplier,
    rebirthCount,
    totalFound,
    baseSize,
    inventory,
    godMode,
    flyMode,
    playerFrozen,
    meteorShowerActive,
    moveSpeed,
    securityGuards,
    nextDigRarity: forcedRarity,
    adminReset,
    adminSetCredits,
    adminSetMultiplier,
    adminAddMeteors,
    adminSetRebirth,
    adminSetBaseSize,
    adminSetMoveSpeed,
    adminToggleGodMode,
    adminToggleFlyMode,
    adminToggleFreezePlayer,
    adminTriggerMeteorShower,
    adminSetNextDig,
    adminTeleportTo,
    adminSpawnGuards,
    adminSellAll,
    adminFuseAll,
  } = useGameStore();

  const handleCodeSubmit = () => {
    if (code === ADMIN_CODE) {
      setUnlocked(true);
      setError(false);
      toast.success("Admin access granted.", { duration: 2000 });
    } else if (code === CELESTIAL_CODE) {
      adminAddMeteors("celestial", 1);
      setCode("");
      toast.success("✨ You received 1 FREE Celestial meteorite!", {
        duration: 3500,
      });
    } else if (code === IMPOSSIBLE_CODE) {
      adminAddMeteors("googleplex", 1);
      setCode("");
      toast.success(
        "🌌 You received 1 FREE Impossible (Googleplex) meteorite!",
        {
          duration: 3500,
        },
      );
    } else {
      setError(true);
      setCode("");
      setTimeout(() => setError(false), 1500);
    }
  };

  const handleReset = () => {
    adminReset();
    toast.success("All data reset.", { duration: 2000 });
  };

  const handleSetCredits = () => {
    const val = Number.parseInt(creditsInput);
    if (Number.isNaN(val) || val < 0) return;
    adminSetCredits(val);
    setCreditsInput("");
    toast.success(`Credits set to ${val.toLocaleString()}`);
  };

  const handleSetMultiplier = () => {
    const val = Number.parseInt(multiplierInput);
    if (Number.isNaN(val) || val < 1) return;
    adminSetMultiplier(val);
    setMultiplierInput("");
    toast.success(`Multiplier set to ×${val}`);
  };

  const handleSetRebirth = () => {
    const val = Number.parseInt(rebirthInput);
    if (Number.isNaN(val) || val < 0) return;
    adminSetRebirth(val);
    setRebirthInput("");
    toast.success(
      `Rebirth set to ${val} — Multiplier ×${val + 1}, Base Size ${val + 1}`,
    );
  };

  const handleSetBaseSize = () => {
    const val = Number.parseInt(baseSizeInput);
    if (Number.isNaN(val) || val < 1) return;
    adminSetBaseSize(val);
    setBaseSizeInput("");
    toast.success(`Base size set to ${val}`);
  };

  const handleSetSpeed = () => {
    const val = Number.parseFloat(speedInput);
    if (Number.isNaN(val) || val <= 0) return;
    adminSetMoveSpeed(val);
    setSpeedInput("");
    toast.success(`Move speed set to ×${val}`);
  };

  const handleAddMeteors = () => {
    const qty = Number.parseInt(meteorQty);
    if (Number.isNaN(qty) || qty < 1) return;
    adminAddMeteors(meteorRarity, qty);
    toast.success(`Added ${qty}× ${RARITY_LABELS[meteorRarity]}`);
  };

  const handleAddAllRarities = () => {
    const qty = Number.parseInt(meteorQty);
    if (Number.isNaN(qty) || qty < 1) return;
    for (const r of RARITIES) {
      adminAddMeteors(r, qty);
    }
    toast.success(`Added ${qty}× of EVERY rarity!`);
  };

  const handleMaxEverything = () => {
    adminSetCredits(999_999_999);
    adminSetMultiplier(999);
    for (const r of RARITIES) {
      adminAddMeteors(r, 9999);
    }
    adminSetRebirth(50);
    adminSetMoveSpeed(5);
    if (!godMode) adminToggleGodMode();
    toast.success("🔥 MAX EVERYTHING activated!", { duration: 3000 });
  };

  const handle9999All = () => {
    for (const r of RARITIES) {
      adminAddMeteors(r, 9999);
    }
    toast.success("💥 Added 9999 of EVERY rarity!");
  };

  const handleForceNextDig = () => {
    adminSetNextDig(nextDigRarity);
    toast.success(`✅ Next dig guaranteed: ${RARITY_LABELS[nextDigRarity]}`, {
      duration: 3000,
    });
  };

  const handleClearNextDig = () => {
    adminSetNextDig(null);
    toast.success("Forced dig cleared — back to random.");
  };

  const handleTeleport = (buildingId: string) => {
    adminTeleportTo(buildingId);
    const b = BUILDINGS.find((x) => x.id === buildingId);
    toast.success(`${b?.emoji} Teleporting to ${b?.label}…`, {
      duration: 1800,
    });
    // Auto-clear after a moment
    setTimeout(() => adminTeleportTo(null), 500);
  };

  const handleSpawnGuards = () => {
    const n = Number.parseInt(guardInput);
    if (Number.isNaN(n) || n < 1) return;
    adminSpawnGuards(n);
    toast.success(`Spawned ${n} Security Guard${n > 1 ? "s" : ""}! 🛡️`);
  };

  const handleRemoveGuards = () => {
    adminSpawnGuards(-securityGuards);
    toast.success("All security guards removed.");
  };

  const handleSellAll = () => {
    adminSellAll();
    toast.success("💰 All meteorites sold!");
  };

  const handleFuseAll = () => {
    adminFuseAll();
    toast.success("⚗️ Fused all meteorites upward!");
  };

  if (!unlocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 w-full max-w-sm"
        >
          {/* Terminal header */}
          <div
            className="w-full rounded-t-xl px-4 py-2 flex items-center gap-2"
            style={{ backgroundColor: "oklch(var(--muted))" }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground font-mono ml-2">
              code_panel.exe
            </span>
          </div>

          <div
            className="w-full rounded-b-xl p-6 flex flex-col gap-5"
            style={{
              backgroundColor: "oklch(0.08 0.015 260)",
              border: "1px solid oklch(var(--border))",
              borderTop: "none",
            }}
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="font-mono text-green-400 text-sm terminal-cursor">
                ENTER CODE
              </span>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                data-ocid="admin.input"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 4))}
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                maxLength={4}
                className="w-full bg-transparent border-b-2 text-green-400 font-mono text-3xl tracking-[1rem] text-center outline-none py-2 transition-colors"
                style={{
                  borderColor: error
                    ? "#ef4444"
                    : code.length > 0
                      ? "#22c55e"
                      : "oklch(var(--border))",
                }}
                placeholder="____"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 font-mono text-xs text-center mt-2"
                >
                  INVALID CODE
                </motion.p>
              )}
            </div>

            {/* Digit display */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded border-2 flex items-center justify-center font-mono text-lg font-bold text-green-400"
                  style={{
                    borderColor:
                      i < code.length ? "#22c55e" : "oklch(var(--border))",
                    backgroundColor:
                      i < code.length ? "rgba(34,197,94,0.1)" : "transparent",
                  }}
                >
                  {i < code.length ? "●" : "○"}
                </div>
              ))}
            </div>

            <button
              type="button"
              data-ocid="admin.submit_button"
              onClick={handleCodeSubmit}
              disabled={code.length !== 4}
              className="w-full py-3 rounded-lg font-mono font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-40"
              style={{
                backgroundColor:
                  code.length === 4 ? "rgba(34,197,94,0.2)" : "transparent",
                color:
                  code.length === 4
                    ? "#22c55e"
                    : "oklch(var(--muted-foreground))",
                border: "1px solid",
                borderColor:
                  code.length === 4 ? "#22c55e66" : "oklch(var(--border))",
              }}
            >
              SUBMIT
            </button>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((key) => (
                <button
                  type="button"
                  key={key === null ? "empty" : String(key)}
                  onClick={() => {
                    if (key === null) return;
                    if (key === "⌫") {
                      setCode((c) => c.slice(0, -1));
                    } else if (code.length < 4) {
                      setCode((c) => c + key);
                    }
                  }}
                  disabled={key === null}
                  className="h-10 rounded-lg font-mono font-bold text-sm transition-all disabled:invisible"
                  style={{
                    backgroundColor: "oklch(var(--muted) / 0.4)",
                    color: "oklch(var(--foreground))",
                    border: "1px solid oklch(var(--border))",
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-mono font-bold text-green-400">
            ADMIN DASHBOARD
          </h2>
          {godMode && (
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{
                background: "rgba(255,107,255,0.2)",
                border: "1px solid #ff6bff",
                color: "#ff6bff",
              }}
            >
              GOD MODE
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setUnlocked(false)}
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Lock className="w-3 h-3" />
          Lock
        </button>
      </div>

      {/* ★ MAX EVERYTHING button */}
      <motion.button
        type="button"
        data-ocid="admin.primary_button"
        onClick={handleMaxEverything}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-4 rounded-xl font-mono font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
        style={{
          background:
            "linear-gradient(135deg, rgba(234,179,8,0.35) 0%, rgba(251,146,60,0.35) 50%, rgba(239,68,68,0.35) 100%)",
          border: "2px solid rgba(234,179,8,0.6)",
          color: "#fbbf24",
          textShadow: "0 0 20px rgba(234,179,8,0.8)",
          boxShadow: "0 0 30px rgba(234,179,8,0.2)",
        }}
      >
        <Crown className="w-6 h-6" />
        MAX EVERYTHING
        <Crown className="w-6 h-6" />
      </motion.button>

      {/* Stats */}
      <div
        className="rounded-xl p-4 font-mono text-sm space-y-1"
        style={{
          backgroundColor: "oklch(0.08 0.015 260)",
          border: "1px solid #22c55e33",
        }}
      >
        <div className="text-green-400 mb-2 text-xs uppercase tracking-wider">
          ── System Status ──
        </div>
        {[
          { label: "Credits", value: credits.toLocaleString() },
          { label: "Multiplier", value: `×${multiplier}` },
          { label: "Base Size", value: baseSize },
          { label: "Rebirths", value: rebirthCount },
          { label: "Move Speed", value: `×${moveSpeed.toFixed(1)}` },
          { label: "Total Found", value: totalFound.toLocaleString() },
          { label: "Guards", value: securityGuards },
          { label: "God Mode", value: godMode ? "ON 🔥" : "OFF" },
          { label: "Fly Mode", value: flyMode ? "ON ✈️" : "OFF" },
          { label: "Freeze Player", value: playerFrozen ? "ON ❄️" : "OFF" },
          {
            label: "Forced Next Dig",
            value: forcedRarity ? RARITY_LABELS[forcedRarity] : "Random",
          },
          {
            label: "Inventory",
            value: `${Object.values(inventory)
              .reduce((a, b) => a + b, 0)
              .toLocaleString()} items`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-green-600">{">"}</span>
            <span className="text-muted-foreground">{label}:</span>
            <span className="text-green-300 ml-auto">{value}</span>
          </div>
        ))}
      </div>

      {/* Inventory breakdown */}
      <div
        className="rounded-xl p-4 font-mono text-xs"
        style={{
          backgroundColor: "oklch(0.08 0.015 260)",
          border: "1px solid #22c55e22",
        }}
      >
        <div className="text-green-400 mb-2 uppercase tracking-wider">
          ── Inventory Breakdown ──
        </div>
        <div className="grid grid-cols-2 gap-1">
          {RARITIES.map((r) => (
            <div key={r} className="flex justify-between items-center gap-1">
              <span
                className="text-xs font-bold"
                style={{ color: RARITY_COLORS[r] }}
              >
                {RARITY_LABELS[r]}:
              </span>
              <span className="text-green-300">
                {(inventory[r] || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GOD MODE toggle */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: godMode
            ? "rgba(255,107,255,0.1)"
            : "rgba(255,107,255,0.04)",
          border: `1px solid ${godMode ? "rgba(255,107,255,0.5)" : "rgba(255,107,255,0.2)"}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-mono text-pink-400 font-bold">
              God Mode
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              (infinite sell/fuse/exchange)
            </span>
          </div>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={() => {
              adminToggleGodMode();
              toast.success(
                godMode
                  ? "God Mode OFF"
                  : "🔥 GOD MODE ON — infinite everything!",
                { duration: 2500 },
              );
            }}
            className="px-4 py-1.5 rounded-lg font-mono font-bold text-sm transition-all"
            style={{
              backgroundColor: godMode
                ? "rgba(255,107,255,0.4)"
                : "rgba(255,107,255,0.12)",
              border: "1px solid rgba(255,107,255,0.5)",
              color: "#ff6bff",
            }}
          >
            {godMode ? "ACTIVE ✓" : "ENABLE"}
          </button>
        </div>
      </div>

      {/* FLY MODE toggle */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: flyMode
            ? "rgba(14,165,233,0.1)"
            : "rgba(14,165,233,0.04)",
          border: `1px solid ${flyMode ? "rgba(14,165,233,0.5)" : "rgba(14,165,233,0.2)"}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-mono text-sky-400 font-bold">
              Fly Mode
            </span>
            {flyMode && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
                style={{
                  background: "rgba(14,165,233,0.2)",
                  border: "1px solid rgba(14,165,233,0.5)",
                  color: "#38bdf8",
                }}
              >
                FLY ON ✈️
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              (double-tap Space to fly, Shift = down)
            </span>
          </div>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={() => {
              adminToggleFlyMode();
              toast.success(flyMode ? "Fly Mode OFF" : "✈️ FLY MODE ON!", {
                duration: 2000,
              });
            }}
            className="px-4 py-1.5 rounded-lg font-mono font-bold text-sm transition-all"
            style={{
              backgroundColor: flyMode
                ? "rgba(14,165,233,0.4)"
                : "rgba(14,165,233,0.12)",
              border: "1px solid rgba(14,165,233,0.5)",
              color: "#38bdf8",
            }}
          >
            {flyMode ? "ACTIVE ✓" : "ENABLE"}
          </button>
        </div>
      </div>

      {/* FREEZE PLAYER toggle */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: playerFrozen
            ? "rgba(147,197,253,0.1)"
            : "rgba(147,197,253,0.04)",
          border: `1px solid ${playerFrozen ? "rgba(147,197,253,0.5)" : "rgba(147,197,253,0.2)"}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-blue-300" />
            <span className="text-sm font-mono text-blue-300 font-bold">
              Freeze Player
            </span>
            {playerFrozen && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
                style={{
                  background: "rgba(147,197,253,0.2)",
                  border: "1px solid rgba(147,197,253,0.5)",
                  color: "#bfdbfe",
                }}
              >
                FROZEN ❄️
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              (locks WASD movement)
            </span>
          </div>
          <button
            type="button"
            data-ocid="admin.toggle"
            onClick={() => {
              adminToggleFreezePlayer();
              toast.success(
                playerFrozen ? "Player unfrozen." : "❄️ Player FROZEN!",
                { duration: 2000 },
              );
            }}
            className="px-4 py-1.5 rounded-lg font-mono font-bold text-sm transition-all"
            style={{
              backgroundColor: playerFrozen
                ? "rgba(147,197,253,0.4)"
                : "rgba(147,197,253,0.12)",
              border: "1px solid rgba(147,197,253,0.5)",
              color: "#bfdbfe",
            }}
          >
            {playerFrozen ? "ACTIVE ✓" : "ENABLE"}
          </button>
        </div>
      </div>

      {/* METEORITE SHOWER */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-4"
        style={{
          backgroundColor: meteorShowerActive
            ? "rgba(139,92,246,0.18)"
            : "rgba(139,92,246,0.05)",
          border: `2px solid ${meteorShowerActive ? "rgba(167,139,250,0.8)" : "rgba(139,92,246,0.3)"}`,
          boxShadow: meteorShowerActive
            ? "0 0 24px rgba(139,92,246,0.3)"
            : "none",
          transition: "all 0.4s ease",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles
            className={`w-4 h-4 text-violet-400 ${meteorShowerActive ? "animate-spin" : ""}`}
          />
          <span className="text-sm font-mono text-violet-400 font-bold">
            Meteorite Shower
          </span>
          {meteorShowerActive && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse ml-auto"
              style={{
                background: "rgba(139,92,246,0.3)",
                border: "1px solid rgba(167,139,250,0.6)",
                color: "#c4b5fd",
              }}
            >
              RAINING ☄️
            </span>
          )}
        </div>
        <motion.button
          type="button"
          data-ocid="admin.secondary_button"
          onClick={() => {
            adminTriggerMeteorShower();
            toast.success(
              "☄️ METEORITE SHOWER! Meteorites raining for everyone!",
              { duration: 4000 },
            );
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          disabled={meteorShowerActive}
          className="w-full py-3 rounded-xl font-mono font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: meteorShowerActive
              ? "linear-gradient(135deg, rgba(139,92,246,0.5) 0%, rgba(167,139,250,0.4) 100%)"
              : "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(109,40,217,0.3) 100%)",
            border: "1px solid rgba(139,92,246,0.5)",
            color: "#c4b5fd",
            textShadow: "0 0 12px rgba(167,139,250,0.6)",
          }}
        >
          <Sparkles className="w-4 h-4" />
          {meteorShowerActive
            ? "SHOWER IN PROGRESS..."
            : "TRIGGER METEOR SHOWER"}
        </motion.button>
        <p className="text-xs text-violet-600 font-mono text-center mt-2">
          Rains meteorites of all rarities instantly
        </p>
      </motion.div>

      {/* FORCE NEXT DIG */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "rgba(6,182,212,0.05)",
          border: `1px solid ${forcedRarity ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.2)"}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-mono text-cyan-400 font-bold">
            Force Next Dig
          </span>
          {forcedRarity && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
              style={{
                background: `${RARITY_COLORS[forcedRarity]}22`,
                color: RARITY_COLORS[forcedRarity],
                border: `1px solid ${RARITY_COLORS[forcedRarity]}66`,
              }}
            >
              → {RARITY_LABELS[forcedRarity]}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={nextDigRarity}
            onChange={(e) => setNextDigRarity(e.target.value as Rarity)}
            className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-cyan-400/50"
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {RARITY_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="button"
            data-ocid="admin.secondary_button"
            onClick={handleForceNextDig}
            className="px-3 py-2 rounded-lg font-mono font-bold text-sm text-cyan-400 transition-all"
            style={{
              backgroundColor: "rgba(6,182,212,0.2)",
              border: "1px solid rgba(6,182,212,0.4)",
            }}
          >
            SET
          </button>
          {forcedRarity && (
            <button
              type="button"
              onClick={handleClearNextDig}
              className="px-3 py-2 rounded-lg font-mono text-sm text-muted-foreground transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid oklch(var(--border))",
              }}
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Your next DIG will always give the selected rarity.
        </p>
      </div>

      {/* TELEPORT */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "rgba(251,146,60,0.05)",
          border: "1px solid rgba(251,146,60,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-mono text-orange-400 font-bold">
            Teleport
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BUILDINGS.map((b) => (
            <button
              type="button"
              key={b.id}
              data-ocid="admin.button"
              onClick={() => handleTeleport(b.id)}
              className="py-2 rounded-lg font-mono text-xs font-bold transition-all text-center"
              style={{
                backgroundColor: `${b.color}18`,
                border: `1px solid ${b.color}44`,
                color: b.color,
              }}
            >
              {b.emoji}
              <br />
              <span className="text-[10px]">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECURITY GUARDS */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "rgba(148,163,184,0.05)",
          border: "1px solid rgba(148,163,184,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-mono text-slate-400 font-bold">
            Security Guards
          </span>
          <span className="ml-auto text-xs font-mono text-slate-500">
            active: {securityGuards}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={guardInput}
            onChange={(e) => setGuardInput(e.target.value)}
            min={1}
            className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-slate-400/50"
            placeholder="Count..."
          />
          <button
            type="button"
            data-ocid="admin.save_button"
            onClick={handleSpawnGuards}
            className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-slate-300 transition-all"
            style={{
              backgroundColor: "rgba(148,163,184,0.2)",
              border: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            SPAWN
          </button>
          <button
            type="button"
            onClick={handleRemoveGuards}
            className="px-3 py-2 rounded-lg font-mono text-xs text-red-400 transition-all"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            REMOVE ALL
          </button>
        </div>
        <div className="flex gap-1 mt-2">
          {[1, 5, 10, 50].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => {
                adminSpawnGuards(n);
                toast.success(`Spawned ${n} guard${n > 1 ? "s" : ""}! 🛡️`);
              }}
              className="flex-1 py-1 rounded text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
              style={{ backgroundColor: "rgba(148,163,184,0.06)" }}
            >
              +{n}
            </button>
          ))}
        </div>
      </div>

      {/* Move Speed */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "rgba(52,211,153,0.05)",
          border: "1px solid rgba(52,211,153,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-mono text-emerald-400 font-bold">
            Move Speed
          </span>
          <span className="ml-auto text-xs font-mono text-emerald-600">
            current: ×{moveSpeed.toFixed(1)}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={speedInput}
            onChange={(e) => setSpeedInput(e.target.value)}
            placeholder="×..."
            className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-emerald-400/50"
            min={0.1}
            step={0.5}
            onKeyDown={(e) => e.key === "Enter" && handleSetSpeed()}
          />
          <button
            type="button"
            onClick={handleSetSpeed}
            className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-emerald-400 transition-all"
            style={{
              backgroundColor: "rgba(52,211,153,0.2)",
              border: "1px solid rgba(52,211,153,0.4)",
            }}
          >
            SET
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {[
            { label: "Normal", val: 1 },
            { label: "×3", val: 3 },
            { label: "×10", val: 10 },
            { label: "×50", val: 50 },
          ].map(({ label, val }) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                adminSetMoveSpeed(val);
                toast.success(`Speed set to ×${val}`);
              }}
              className="flex-1 py-1 rounded text-xs font-mono text-emerald-600 hover:text-emerald-400 transition-colors"
              style={{ backgroundColor: "rgba(52,211,153,0.08)" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* One-click Actions */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(139,92,246,0.05)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-mono text-purple-400 font-bold">
              One-Click Abuses
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-ocid="admin.button"
              onClick={handle9999All}
              className="py-2 rounded-lg font-mono font-black text-xs transition-all flex items-center justify-center gap-1"
              style={{
                backgroundColor: "rgba(255,107,255,0.2)",
                border: "1px solid rgba(255,107,255,0.4)",
                color: "#ff6bff",
              }}
            >
              <Zap className="w-3 h-3" />
              9999 ALL
            </button>
            <button
              type="button"
              onClick={handleSellAll}
              className="py-2 rounded-lg font-mono font-black text-xs transition-all flex items-center justify-center gap-1 text-yellow-400"
              style={{
                backgroundColor: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.4)",
              }}
            >
              <ShoppingBag className="w-3 h-3" />
              SELL ALL
            </button>
            <button
              type="button"
              onClick={handleFuseAll}
              className="py-2 rounded-lg font-mono font-black text-xs transition-all flex items-center justify-center gap-1 text-purple-400"
              style={{
                backgroundColor: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.4)",
              }}
            >
              <FlaskConical className="w-3 h-3" />
              FUSE ALL
            </button>
            <button
              type="button"
              onClick={() => {
                adminSetCredits(999_999_999);
                toast.success("Credits maxed!");
              }}
              className="py-2 rounded-lg font-mono font-black text-xs transition-all flex items-center justify-center gap-1 text-yellow-400"
              style={{
                backgroundColor: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.4)",
              }}
            >
              <Coins className="w-3 h-3" />
              MAX CREDITS
            </button>
          </div>
        </div>

        {/* BROADCAST SPAWN */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(255,80,0,0.08)",
            border: "2px solid rgba(255,100,0,0.7)",
            boxShadow:
              "0 0 18px rgba(255,80,0,0.18), inset 0 0 24px rgba(255,60,0,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-sm font-mono text-orange-400 font-bold uppercase tracking-wider">
              Broadcast Spawn
            </span>
          </div>
          <motion.button
            type="button"
            data-ocid="admin.primary_button"
            onClick={handle9999All}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 32px rgba(255,100,0,0.45)",
            }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-xl font-mono font-black text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                "linear-gradient(135deg, rgba(220,38,38,0.45) 0%, rgba(249,115,22,0.45) 50%, rgba(234,179,8,0.35) 100%)",
              border: "2px solid rgba(255,100,0,0.75)",
              color: "#fb923c",
              textShadow: "0 0 18px rgba(255,120,0,0.9)",
              boxShadow: "0 0 24px rgba(255,80,0,0.25)",
            }}
          >
            <Radio className="w-5 h-5" />
            SPAWN FOR EVERYONE 🌍
          </motion.button>
          <p className="text-xs text-orange-600 font-mono text-center mt-2">
            Gives 9999 of every rarity instantly
          </p>
        </motion.div>

        {/* Reset */}
        <button
          type="button"
          data-ocid="admin.delete_button"
          onClick={handleReset}
          className="flex items-center gap-2 w-full py-3 px-4 rounded-xl font-mono font-bold text-red-400 transition-all"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <RotateCcw className="w-4 h-4" />
          RESET ALL DATA
        </button>

        {/* Set Credits */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(234,179,8,0.05)",
            border: "1px solid rgba(234,179,8,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-mono text-yellow-400">
              Set Credits
            </span>
          </div>
          <div className="flex gap-2">
            <input
              data-ocid="admin.input"
              type="number"
              value={creditsInput}
              onChange={(e) => setCreditsInput(e.target.value)}
              placeholder="Amount..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-yellow-400/50"
              onKeyDown={(e) => e.key === "Enter" && handleSetCredits()}
            />
            <button
              type="button"
              data-ocid="admin.save_button"
              onClick={handleSetCredits}
              className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-yellow-400 transition-all"
              style={{
                backgroundColor: "rgba(234,179,8,0.2)",
                border: "1px solid rgba(234,179,8,0.4)",
              }}
            >
              SET
            </button>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {[
              { label: "1K", val: 1_000 },
              { label: "100K", val: 100_000 },
              { label: "1M", val: 1_000_000 },
              { label: "999M", val: 999_000_000 },
              { label: "MAX", val: 999_999_999 },
            ].map(({ label, val }) => (
              <button
                type="button"
                key={label}
                onClick={() => {
                  adminSetCredits(val);
                  toast.success(`Credits set to ${val.toLocaleString()}`);
                }}
                className="flex-1 py-1 rounded text-xs font-mono text-yellow-600 hover:text-yellow-400 transition-colors"
                style={{ backgroundColor: "rgba(234,179,8,0.08)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Set Multiplier */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(139,92,246,0.05)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-mono text-purple-400">
              Set Multiplier
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={multiplierInput}
              onChange={(e) => setMultiplierInput(e.target.value)}
              placeholder="×..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-purple-400/50"
              min={1}
              onKeyDown={(e) => e.key === "Enter" && handleSetMultiplier()}
            />
            <button
              type="button"
              onClick={handleSetMultiplier}
              className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-purple-400 transition-all"
              style={{
                backgroundColor: "rgba(139,92,246,0.2)",
                border: "1px solid rgba(139,92,246,0.4)",
              }}
            >
              SET
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: "×10", val: 10 },
              { label: "×100", val: 100 },
              { label: "×999", val: 999 },
              { label: "×9999", val: 9999 },
            ].map(({ label, val }) => (
              <button
                type="button"
                key={label}
                onClick={() => {
                  adminSetMultiplier(val);
                  toast.success(`Multiplier set to ${label}`);
                }}
                className="flex-1 py-1 rounded text-xs font-mono text-purple-600 hover:text-purple-400 transition-colors"
                style={{ backgroundColor: "rgba(139,92,246,0.08)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Set Base Size */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(34,197,94,0.05)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-sm font-mono text-green-400">
              Set Base Size
            </span>
            <span className="ml-auto text-xs font-mono text-green-600">
              current: {baseSize}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={baseSizeInput}
              onChange={(e) => setBaseSizeInput(e.target.value)}
              placeholder="Size..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-green-400/50"
              min={1}
              onKeyDown={(e) => e.key === "Enter" && handleSetBaseSize()}
            />
            <button
              type="button"
              onClick={handleSetBaseSize}
              className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-green-400 transition-all"
              style={{
                backgroundColor: "rgba(34,197,94,0.2)",
                border: "1px solid rgba(34,197,94,0.4)",
              }}
            >
              SET
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[1, 5, 10, 50].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => {
                  adminSetBaseSize(v);
                  toast.success(`Base size set to ${v}`);
                }}
                className="flex-1 py-1 rounded text-xs font-mono text-green-600 hover:text-green-400 transition-colors"
                style={{ backgroundColor: "rgba(34,197,94,0.08)" }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Set Rebirth */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(20,184,166,0.05)",
            border: "1px solid rgba(20,184,166,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-mono text-teal-400">
              Set Rebirth Count
            </span>
            <span className="ml-auto text-xs font-mono text-teal-600">
              current: {rebirthCount}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={rebirthInput}
              onChange={(e) => setRebirthInput(e.target.value)}
              placeholder="Count..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-teal-400/50"
              min={0}
              onKeyDown={(e) => e.key === "Enter" && handleSetRebirth()}
            />
            <button
              type="button"
              onClick={handleSetRebirth}
              className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-teal-400 transition-all"
              style={{
                backgroundColor: "rgba(20,184,166,0.2)",
                border: "1px solid rgba(20,184,166,0.4)",
              }}
            >
              SET
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: "×5", val: 5 },
              { label: "×10", val: 10 },
              { label: "×50", val: 50 },
              { label: "×100", val: 100 },
            ].map(({ label, val }) => (
              <button
                type="button"
                key={label}
                onClick={() => {
                  adminSetRebirth(val);
                  toast.success(
                    `Rebirth set to ${val} — Multiplier ×${val + 1}`,
                  );
                }}
                className="flex-1 py-1 rounded text-xs font-mono text-teal-600 hover:text-teal-400 transition-colors"
                style={{ backgroundColor: "rgba(20,184,166,0.08)" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Meteorites */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(6,182,212,0.05)",
            border: "1px solid rgba(6,182,212,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-cyan-400">
              Add Meteorites
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <select
              value={meteorRarity}
              onChange={(e) => setMeteorRarity(e.target.value as Rarity)}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-cyan-400/50"
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {RARITY_LABELS[r]}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={meteorQty}
              onChange={(e) => setMeteorQty(e.target.value)}
              placeholder="Qty"
              className="w-20 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-cyan-400/50"
              min={1}
            />
            <button
              type="button"
              onClick={handleAddMeteors}
              className="px-4 py-2 rounded-lg font-mono font-bold text-sm text-cyan-400 transition-all"
              style={{
                backgroundColor: "rgba(6,182,212,0.2)",
                border: "1px solid rgba(6,182,212,0.4)",
              }}
            >
              ADD
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            {[1, 10, 100, 1000, 9999].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setMeteorQty(v.toString())}
                className="flex-1 py-1 rounded text-xs font-mono text-cyan-600 hover:text-cyan-400 transition-colors"
                style={{ backgroundColor: "rgba(6,182,212,0.08)" }}
              >
                ×{v}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="admin.secondary_button"
              onClick={handleAddAllRarities}
              className="flex-1 py-2 rounded-lg font-mono font-bold text-xs text-cyan-300 transition-all flex items-center justify-center gap-1"
              style={{
                backgroundColor: "rgba(6,182,212,0.15)",
                border: "1px solid rgba(6,182,212,0.35)",
              }}
            >
              <FlaskConical className="w-3 h-3" />
              ADD ALL RARITIES
            </button>
          </div>
        </div>

        {/* DELETE PLAYER DATA — two-step destructive */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: deleteConfirm
              ? "rgba(220,38,38,0.15)"
              : "rgba(127,0,0,0.08)",
            border: deleteConfirm
              ? "2px solid #dc2626"
              : "1px solid rgba(200,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Skull className="w-4 h-4 text-red-500" />
            <span className="text-sm font-mono text-red-400 font-bold uppercase tracking-wider">
              Danger Zone
            </span>
          </div>
          {deleteConfirm ? (
            <motion.button
              type="button"
              data-ocid="admin.confirm_button"
              onClick={() => {
                if (deleteConfirmTimeout.current) {
                  clearTimeout(deleteConfirmTimeout.current);
                  deleteConfirmTimeout.current = null;
                }
                adminReset();
                setDeleteConfirm(false);
                toast.error("💀 ALL PLAYER DATA DELETED", { duration: 3000 });
              }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{
                duration: 0.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-full py-4 rounded-xl font-mono font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: "rgba(220,38,38,0.4)",
                border: "2px solid #dc2626",
                color: "#fca5a5",
                textShadow: "0 0 16px rgba(239,68,68,0.8)",
                boxShadow: "0 0 24px rgba(220,38,38,0.3)",
              }}
            >
              <Skull className="w-5 h-5" />
              ⚠️ CONFIRM DELETE — CANNOT UNDO
            </motion.button>
          ) : (
            <button
              type="button"
              data-ocid="admin.delete_button"
              onClick={() => {
                setDeleteConfirm(true);
                if (deleteConfirmTimeout.current) {
                  clearTimeout(deleteConfirmTimeout.current);
                }
                deleteConfirmTimeout.current = setTimeout(() => {
                  setDeleteConfirm(false);
                }, 3000);
              }}
              className="w-full py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: "rgba(127,0,0,0.2)",
                border: "1px solid rgba(200,0,0,0.4)",
                color: "#ff4444",
              }}
            >
              <Skull className="w-4 h-4" />
              DELETE PLAYER DATA
            </button>
          )}
          {deleteConfirm && (
            <p className="text-xs text-red-400 font-mono text-center mt-2 animate-pulse">
              Click again to confirm — auto-cancels in 3 seconds
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
