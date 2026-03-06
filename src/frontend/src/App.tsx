import { Toaster } from "@/components/ui/sonner";
import {
  FlaskConical,
  Home,
  Landmark,
  Lock,
  Pickaxe,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AdminPanel from "./components/AdminPanel";
import DiggingScene from "./components/DiggingScene";
import FuseMachine from "./components/FuseMachine";
import { useGameStore } from "./components/GameStore";
import IndexPage from "./components/IndexPage";
import InventoryPanel from "./components/InventoryPanel";
import RebirthPanel from "./components/RebirthPanel";
import SellShop from "./components/SellShop";
import { usePlayerCount } from "./hooks/usePlayerCount";

type Tab = "home" | "dig" | "inventory" | "shop" | "fuse" | "rebirth" | "admin";

const TABS: {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-4 h-4" />,
    ocid: "nav.home.tab",
  },
  {
    id: "dig",
    label: "Dig",
    icon: <Pickaxe className="w-4 h-4" />,
    ocid: "nav.dig.tab",
  },
  {
    id: "inventory",
    label: "Museum",
    icon: <Landmark className="w-4 h-4" />,
    ocid: "nav.inventory.tab",
  },
  {
    id: "shop",
    label: "Shop",
    icon: <ShoppingBag className="w-4 h-4" />,
    ocid: "nav.shop.tab",
  },
  {
    id: "fuse",
    label: "Fuse",
    icon: <FlaskConical className="w-4 h-4" />,
    ocid: "nav.fuse.tab",
  },
  {
    id: "rebirth",
    label: "Rebirth",
    icon: <RotateCcw className="w-4 h-4" />,
    ocid: "nav.rebirth.tab",
  },
  {
    id: "admin",
    label: "Admin",
    icon: <Lock className="w-4 h-4" />,
    ocid: "nav.admin.tab",
  },
];

function renderTab(tab: Tab, onNavigate: (t: string) => void) {
  switch (tab) {
    case "home":
      return <IndexPage onNavigate={onNavigate} />;
    case "dig":
      return <DiggingScene />;
    case "inventory":
      return <InventoryPanel />;
    case "shop":
      return <SellShop />;
    case "fuse":
      return <FuseMachine />;
    case "rebirth":
      return <RebirthPanel />;
    case "admin":
      return <AdminPanel />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { credits, totalFound } = useGameStore();
  const playerCount = usePlayerCount();

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: "oklch(var(--background))" }}
    >
      {/* Stars background */}
      <div className="stars-bg" />

      {/* Desktop top bar */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☄️</span>
          <span className="font-display font-black text-lg text-foreground">
            Meteorite Digger
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={tab.ocid}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor:
                  activeTab === tab.id ? "oklch(var(--accent))" : "transparent",
                color:
                  activeTab === tab.id
                    ? "oklch(var(--accent-foreground))"
                    : "oklch(var(--muted-foreground))",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-yellow-400">{formatNum(credits)} ✦</span>
          <span className="text-cyan-400">{formatNum(totalFound)} found</span>
          <span
            data-ocid="topbar.player_count.section"
            className="flex items-center gap-1.5 text-emerald-400"
            title="Players currently online"
          >
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              aria-hidden="true"
            />
            {playerCount} online
          </span>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xl">☄️</span>
          <span className="font-display font-bold text-sm">
            Meteorite Digger
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-yellow-400">{formatNum(credits)} ✦</span>
          <span className="text-cyan-400">{formatNum(totalFound)}</span>
          <span
            data-ocid="topbar.player_count.section"
            className="flex items-center gap-1 text-emerald-400"
            title="Players currently online"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
              aria-hidden="true"
            />
            {playerCount}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 overflow-hidden"
          >
            {renderTab(activeTab, handleNavigate)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden flex border-t border-border/50 bg-card/80 backdrop-blur-sm flex-shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-ocid={tab.ocid}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
              style={{
                color: isActive
                  ? "oklch(var(--primary))"
                  : "oklch(var(--muted-foreground))",
              }}
            >
              <div
                className="p-1 rounded-lg transition-all"
                style={{
                  backgroundColor: isActive
                    ? "oklch(var(--primary) / 0.15)"
                    : "transparent",
                }}
              >
                {tab.icon}
              </div>
              <span className="text-[9px] font-medium leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
            color: "oklch(var(--foreground))",
            fontFamily: "Sora, sans-serif",
          },
        }}
      />
    </div>
  );
}
