import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  FlaskConical,
  Maximize2,
  RotateCcw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useGameStore } from "./GameStore";

export default function RebirthPanel() {
  const {
    totalFound,
    rebirthCount,
    multiplier,
    baseSize,
    rebirth,
    inventory,
    credits,
    fuseSlots,
  } = useGameStore();
  const [confirming, setConfirming] = useState(false);
  const [justRebirthed, setJustRebirthed] = useState(false);

  const required = 50 * (rebirthCount + 1);
  const progress = Math.min(100, (totalFound / required) * 100);
  const canRebirth = totalFound >= required;
  const remaining = Math.max(0, required - totalFound);

  const handleRebirth = () => {
    if (!canRebirth) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }

    const success = rebirth();
    if (success) {
      setConfirming(false);
      setJustRebirthed(true);
      toast.success("REBIRTH SUCCESSFUL! Welcome back, legend! ✦", {
        description: `Multiplier: ×${multiplier + 1} | Base Size: ${baseSize + 1}`,
        duration: 5000,
      });
      setTimeout(() => setJustRebirthed(false), 3000);
    }
  };

  const totalInventory = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #ef444444, #f9731644)",
            border: "1px solid #ef444466",
          }}
        >
          <RotateCcw className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold">Rebirth</h2>
          <p className="text-sm text-muted-foreground">
            Reset everything for permanent upgrades
          </p>
        </div>
      </div>

      {/* Warning */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl border"
        style={{
          backgroundColor: "rgba(239,68,68,0.08)",
          borderColor: "rgba(239,68,68,0.3)",
        }}
      >
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-400">
            Warning: Irreversible
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rebirthing will reset ALL meteorites (
            {totalInventory.toLocaleString()}) and credits (
            {credits.toLocaleString()} ✦) to zero. You keep your bonuses
            permanently.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
            label: "Multiplier",
            value: `×${multiplier}`,
            sub: "per dig",
            color: "#8b5cf6",
          },
          {
            icon: <Maximize2 className="w-5 h-5 text-cyan-400" />,
            label: "Base Size",
            value: `${baseSize}`,
            sub: "dig area level",
            color: "#06b6d4",
          },
          {
            icon: <RotateCcw className="w-5 h-5 text-orange-400" />,
            label: "Rebirths",
            value: rebirthCount,
            sub: "completed",
            color: "#f97316",
          },
          {
            icon: <Zap className="w-5 h-5 text-yellow-400" />,
            label: "Total Found",
            value: totalFound.toLocaleString(),
            sub: "this run",
            color: "#eab308",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: `${stat.color}0d`,
              borderColor: `${stat.color}33`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {stat.icon}
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-foreground">
            Rebirth Progress
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            {totalFound.toLocaleString()} / {required.toLocaleString()} found
          </span>
        </div>
        <Progress
          value={progress}
          className="h-3"
          style={
            {
              "--progress-background": canRebirth
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : "linear-gradient(90deg, #7c3aed, #4f46e5)",
            } as React.CSSProperties
          }
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">
            {canRebirth
              ? "✦ READY TO REBIRTH!"
              : `${remaining.toLocaleString()} more needed`}
          </span>
          <span
            className="text-xs font-bold font-mono"
            style={{ color: canRebirth ? "#f97316" : "#8b5cf6" }}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Rewards preview */}
      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">
          Next Rebirth Rewards
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-foreground">
              Multiplier: ×{multiplier} → ×{multiplier + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-foreground">
              Base: {baseSize} → {baseSize + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-foreground">
              Fuse Slots: {fuseSlots} → {fuseSlots + 1}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Higher multiplier = more meteorites per dig. Bigger base = wider
          excavation area. More fuse slots = fuse more at once.
        </p>
      </div>

      {/* Rebirth Button Area */}
      <AnimatePresence mode="wait">
        {justRebirthed ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center p-6 rounded-2xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(249,115,22,0.2) 0%, transparent 70%)",
              border: "1px solid rgba(249,115,22,0.4)",
            }}
          >
            <div className="text-5xl mb-2">🌟</div>
            <div className="text-2xl font-display font-black text-orange-400">
              REBIRTH COMPLETE!
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              You are now ×{multiplier} stronger
            </div>
          </motion.div>
        ) : confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <p className="text-center text-sm font-bold text-red-400">
              Are you absolutely sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 rounded-xl font-bold font-mono border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <motion.button
                data-ocid="rebirth.primary_button"
                onClick={handleRebirth}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-display font-black text-white uppercase tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #f97316)",
                  boxShadow: "0 0 20px 5px rgba(239,68,68,0.4)",
                }}
              >
                YES, REBIRTH!
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="rebirth"
            data-ocid="rebirth.primary_button"
            onClick={handleRebirth}
            disabled={!canRebirth}
            whileHover={canRebirth ? { scale: 1.02 } : {}}
            whileTap={canRebirth ? { scale: 0.98 } : {}}
            animate={
              canRebirth
                ? {
                    boxShadow: [
                      "0 0 20px 5px rgba(239,68,68,0.3)",
                      "0 0 40px 10px rgba(249,115,22,0.5)",
                      "0 0 20px 5px rgba(239,68,68,0.3)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="w-full py-4 rounded-2xl font-display font-black text-xl uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={
              canRebirth
                ? {
                    background:
                      "linear-gradient(135deg, #ef4444, #f97316, #eab308)",
                    color: "white",
                  }
                : {
                    backgroundColor: "oklch(var(--muted))",
                    color: "oklch(var(--muted-foreground))",
                  }
            }
          >
            <RotateCcw className="w-6 h-6" />
            {canRebirth
              ? "REBIRTH NOW"
              : `Need ${remaining.toLocaleString()} more`}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
