import { Coins, Lock, Plus, RotateCcw, Terminal, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  RARITIES,
  RARITY_LABELS,
  type Rarity,
  useGameStore,
} from "./GameStore";

const ADMIN_CODE = "9999";
const CELESTIAL_CODE = "3752";

export default function AdminPanel() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [creditsInput, setCreditsInput] = useState("");
  const [multiplierInput, setMultiplierInput] = useState("");
  const [meteorRarity, setMeteorRarity] = useState<Rarity>("legendary");
  const [meteorQty, setMeteorQty] = useState("10");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    credits,
    multiplier,
    rebirthCount,
    totalFound,
    baseSize,
    inventory,
    adminReset,
    adminSetCredits,
    adminSetMultiplier,
    adminAddMeteors,
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

  const handleAddMeteors = () => {
    const qty = Number.parseInt(meteorQty);
    if (Number.isNaN(qty) || qty < 1) return;
    adminAddMeteors(meteorRarity, qty);
    toast.success(`Added ${qty}× ${RARITY_LABELS[meteorRarity]}`);
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
              admin_access.exe
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
                ENTER ACCESS CODE
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
                  ACCESS DENIED
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
              AUTHENTICATE
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
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-mono font-bold text-green-400">
            ADMIN DASHBOARD
          </h2>
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
          { label: "Total Found", value: totalFound.toLocaleString() },
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
            <div key={r} className="flex justify-between">
              <span className="text-muted-foreground">{RARITY_LABELS[r]}:</span>
              <span className="text-green-300">
                {(inventory[r] || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Reset */}
        <button
          type="button"
          data-ocid="admin.reset_button"
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
              type="number"
              value={creditsInput}
              onChange={(e) => setCreditsInput(e.target.value)}
              placeholder="Amount..."
              className="flex-1 bg-transparent border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-yellow-400/50"
              onKeyDown={(e) => e.key === "Enter" && handleSetCredits()}
            />
            <button
              type="button"
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
          <div className="flex gap-2 mt-2">
            {[1000, 100000, 1000000, 99999999].map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => {
                  adminSetCredits(v);
                  toast.success(`Credits set to ${v.toLocaleString()}`);
                }}
                className="flex-1 py-1 rounded text-xs font-mono text-yellow-600 hover:text-yellow-400 transition-colors"
                style={{ backgroundColor: "rgba(234,179,8,0.08)" }}
              >
                {v >= 1_000_000
                  ? `${v / 1_000_000}M`
                  : v >= 1_000
                    ? `${v / 1_000}K`
                    : v}
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
        </div>

        {/* Add Meteorites */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "rgba(6,182,212,0.05)",
            border: "1px solid rgba(6,182,212,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
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
          <div className="flex gap-2">
            {[1, 10, 100, 1000].map((v) => (
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
        </div>
      </div>
    </div>
  );
}
