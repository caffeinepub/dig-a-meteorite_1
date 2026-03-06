import { create } from "zustand";
import { persist } from "zustand/middleware";

export const RARITIES = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "god",
  "secret",
  "celestial",
  "divine",
  "crazy",
  "googleplex",
] as const;

export type Rarity = (typeof RARITIES)[number];

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9ca3af",
  rare: "#3b82f6",
  epic: "#8b5cf6",
  legendary: "#f97316",
  mythic: "#ef4444",
  god: "#eab308",
  secret: "#ec4899",
  celestial: "#06b6d4",
  divine: "#f8fafc",
  crazy: "#ff6bff",
  googleplex: "#ff00ff",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
  god: "God",
  secret: "Secret",
  celestial: "Celestial",
  divine: "Divine",
  crazy: "Crazy",
  googleplex: "Googleplex",
};

export const DIG_WEIGHTS: Record<Rarity, number> = {
  common: 50000,
  rare: 25000,
  epic: 12000,
  legendary: 6000,
  mythic: 3500,
  god: 2000,
  secret: 800,
  celestial: 400,
  divine: 200,
  crazy: 90,
  googleplex: 10,
};

export const SELL_PRICES: Record<Rarity, number> = {
  common: 1,
  rare: 5,
  epic: 20,
  legendary: 80,
  mythic: 300,
  god: 1000,
  secret: 5000,
  celestial: 20000,
  divine: 80000,
  crazy: 300000,
  googleplex: 9999999,
};

export const EXCHANGE_RATES: Record<Rarity, number> = {
  common: 2,
  rare: 8,
  epic: 35,
  legendary: 120,
  mythic: 450,
  god: 1500,
  secret: 7500,
  celestial: 30000,
  divine: 120000,
  crazy: 450000,
  googleplex: 15000000,
};

export const SECRET_ROOM_RARITIES: Rarity[] = [
  "celestial",
  "divine",
  "crazy",
  "googleplex",
];

type Inventory = Record<string, number>;

interface GameState {
  inventory: Inventory;
  credits: number;
  rebirthCount: number;
  multiplier: number;
  totalFound: number;
  baseSize: number;
  lastDigResult: Rarity | null;
  lastDigTime: number;
  godMode: boolean;
  flyMode: boolean;
  playerFrozen: boolean; // admin freeze player movement
  meteorShowerActive: boolean; // admin meteorite shower visual/effect
  moveSpeed: number; // multiplier on MOVE_SPEED constant
  nextDigRarity: Rarity | null; // admin forced next dig rarity
  teleportTarget: string | null; // building id to teleport to
  securityGuards: number; // count of spawned guards
  isPublic: boolean; // public or private profile/museum visibility

  // Actions
  digMeteor: () => Rarity;
  sellMeteor: (rarity: string, qty: number) => boolean;
  fuseMeteors: (rarity: string) => { success: boolean; result: string };
  exchangeForCredits: (rarity: string, qty: number) => number;
  rebirth: () => boolean;
  adminReset: () => void;
  adminSetCredits: (amount: number) => void;
  adminSetMultiplier: (amount: number) => void;
  adminAddMeteors: (rarity: string, qty: number) => void;
  adminSetRebirth: (count: number) => void;
  adminSetBaseSize: (size: number) => void;
  adminSetMoveSpeed: (speed: number) => void;
  adminToggleGodMode: () => void;
  adminToggleFlyMode: () => void;
  adminToggleFreezePlayer: () => void;
  adminTriggerMeteorShower: () => void;
  adminSetNextDig: (rarity: Rarity | null) => void;
  adminTeleportTo: (buildingId: string | null) => void;
  adminSpawnGuards: (count: number) => void;
  adminSellAll: () => void;
  adminFuseAll: () => void;
  clearLastDig: () => void;
  setPublic: (value: boolean) => void;
}

function weightedRandom(): Rarity {
  const totalWeight = Object.values(DIG_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const rarity of RARITIES) {
    random -= DIG_WEIGHTS[rarity];
    if (random <= 0) return rarity;
  }
  return "common";
}

const defaultInventory: Inventory = Object.fromEntries(
  RARITIES.map((r) => [r, 0]),
);

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      inventory: { ...defaultInventory },
      credits: 0,
      rebirthCount: 0,
      multiplier: 1,
      totalFound: 0,
      baseSize: 1,
      lastDigResult: null,
      lastDigTime: 0,
      godMode: false,
      flyMode: false,
      playerFrozen: false,
      meteorShowerActive: false,
      moveSpeed: 1,
      nextDigRarity: null,
      teleportTarget: null,
      securityGuards: 0,
      isPublic: true,

      digMeteor: () => {
        const { multiplier, inventory, totalFound, godMode, nextDigRarity } =
          get();
        const rarity = nextDigRarity ?? weightedRandom();
        const newInventory = { ...inventory };

        for (let i = 0; i < multiplier; i++) {
          const r = i === 0 ? rarity : (nextDigRarity ?? weightedRandom());
          newInventory[r] = (newInventory[r] || 0) + 1;
        }

        // God mode: also add bonus credits on every dig
        const bonusCredits = godMode
          ? (SELL_PRICES[rarity] || 1) * multiplier * 10
          : 0;

        set({
          inventory: newInventory,
          totalFound: totalFound + multiplier,
          lastDigResult: rarity,
          lastDigTime: Date.now(),
          credits: get().credits + bonusCredits,
          nextDigRarity: null, // consume forced rarity
        });

        return rarity;
      },

      sellMeteor: (rarity: string, qty: number) => {
        const { inventory, credits, godMode } = get();
        const available = inventory[rarity] || 0;
        if (!godMode && available < qty) return false;

        const price = SELL_PRICES[rarity as Rarity] || 0;
        const earned = price * qty;

        set({
          inventory: {
            ...inventory,
            [rarity]: godMode ? available : available - qty,
          },
          credits: credits + earned,
        });
        return true;
      },

      fuseMeteors: (rarity: string) => {
        const { inventory, godMode } = get();
        const rarityIndex = RARITIES.indexOf(rarity as Rarity);

        if (rarityIndex === -1 || rarityIndex >= RARITIES.length - 1) {
          return { success: false, result: "" };
        }

        const available = inventory[rarity] || 0;
        if (!godMode && available < 3) return { success: false, result: "" };

        const nextRarity = RARITIES[rarityIndex + 1];
        const newInventory = {
          ...inventory,
          [rarity]: godMode ? available : available - 3,
          [nextRarity]: (inventory[nextRarity] || 0) + 1,
        };

        set({ inventory: newInventory });
        return { success: true, result: nextRarity };
      },

      exchangeForCredits: (rarity: string, qty: number) => {
        const { inventory, credits, godMode } = get();
        const available = inventory[rarity] || 0;
        if (!godMode && available < qty) return 0;

        const rate = EXCHANGE_RATES[rarity as Rarity] || 0;
        const earned = rate * qty;

        set({
          inventory: {
            ...inventory,
            [rarity]: godMode ? available : available - qty,
          },
          credits: credits + earned,
        });
        return earned;
      },

      rebirth: () => {
        const { totalFound, rebirthCount, multiplier, baseSize } = get();
        const required = 50 * (rebirthCount + 1);
        if (totalFound < required) return false;

        set({
          inventory: { ...defaultInventory },
          credits: 0,
          rebirthCount: rebirthCount + 1,
          multiplier: multiplier + 1,
          baseSize: baseSize + 1,
          totalFound: 0,
          lastDigResult: null,
        });
        return true;
      },

      adminReset: () => {
        set({
          inventory: { ...defaultInventory },
          credits: 0,
          rebirthCount: 0,
          multiplier: 1,
          totalFound: 0,
          baseSize: 1,
          lastDigResult: null,
          godMode: false,
          flyMode: false,
          playerFrozen: false,
          meteorShowerActive: false,
          moveSpeed: 1,
          nextDigRarity: null,
          securityGuards: 0,
        });
      },

      adminSetCredits: (amount: number) => {
        set({ credits: amount });
      },

      adminSetMultiplier: (amount: number) => {
        set({ multiplier: Math.max(1, amount) });
      },

      adminAddMeteors: (rarity: string, qty: number) => {
        const { inventory, totalFound } = get();
        set({
          inventory: {
            ...inventory,
            [rarity]: (inventory[rarity] || 0) + qty,
          },
          totalFound: totalFound + qty,
        });
      },

      adminSetRebirth: (count: number) => {
        const safeCount = Math.max(0, count);
        set({
          rebirthCount: safeCount,
          baseSize: safeCount + 1,
          multiplier: safeCount + 1,
        });
      },

      adminSetBaseSize: (size: number) => {
        set({ baseSize: Math.max(1, size) });
      },

      adminSetMoveSpeed: (speed: number) => {
        set({ moveSpeed: Math.max(0.1, Math.min(50, speed)) });
      },

      adminToggleGodMode: () => {
        set((state) => ({ godMode: !state.godMode }));
      },

      adminToggleFlyMode: () => {
        set((state) => ({ flyMode: !state.flyMode }));
      },

      adminToggleFreezePlayer: () => {
        set((state) => ({ playerFrozen: !state.playerFrozen }));
      },

      adminTriggerMeteorShower: () => {
        // Add a random haul of meteorites across all rarities
        const { inventory, totalFound } = get();
        const newInventory = { ...inventory };
        let added = 0;
        for (const rarity of RARITIES) {
          // Higher rarities get fewer, lower rarities get more
          const rarityIndex = RARITIES.indexOf(rarity);
          const qty = Math.max(1, Math.floor(50 / (rarityIndex + 1)));
          newInventory[rarity] = (newInventory[rarity] || 0) + qty;
          added += qty;
        }
        set({
          inventory: newInventory,
          totalFound: totalFound + added,
          meteorShowerActive: true,
        });
        // Auto-turn off shower visual after 4 seconds
        setTimeout(() => {
          set({ meteorShowerActive: false });
        }, 4000);
      },

      adminSetNextDig: (rarity: Rarity | null) => {
        set({ nextDigRarity: rarity });
      },

      adminTeleportTo: (buildingId: string | null) => {
        set({ teleportTarget: buildingId });
      },

      adminSpawnGuards: (count: number) => {
        set((state) => ({
          securityGuards: Math.max(0, state.securityGuards + count),
        }));
      },

      adminSellAll: () => {
        const { inventory, credits } = get();
        let earned = 0;
        const newInventory = { ...defaultInventory };
        for (const rarity of RARITIES) {
          const qty = inventory[rarity] || 0;
          if (qty > 0) {
            earned += (SELL_PRICES[rarity] || 0) * qty;
          }
        }
        set({ inventory: newInventory, credits: credits + earned });
      },

      adminFuseAll: () => {
        // Repeatedly fuse from lowest rarity upward until nothing can be fused
        const { inventory } = get();
        const newInv = { ...inventory };
        for (let i = 0; i < RARITIES.length - 1; i++) {
          const rarity = RARITIES[i];
          const available = newInv[rarity] || 0;
          const fuseCount = Math.floor(available / 3);
          if (fuseCount > 0) {
            newInv[rarity] = available - fuseCount * 3;
            const next = RARITIES[i + 1];
            newInv[next] = (newInv[next] || 0) + fuseCount;
          }
        }
        set({ inventory: newInv });
      },

      clearLastDig: () => {
        set({ lastDigResult: null });
      },

      setPublic: (value: boolean) => {
        set({ isPublic: value });
      },
    }),
    {
      name: "meteorite-digger-save",
    },
  ),
);
