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
  "impossible",
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
  impossible: "#ffffff",
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
  impossible: "Impossible",
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
  impossible: 1,
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
  impossible: 99999999,
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
  impossible: 150000000,
};

export const SECRET_ROOM_RARITIES: Rarity[] = [
  "celestial",
  "divine",
  "crazy",
  "googleplex",
];

// Museum display slot: which meteorite rarity is placed there (null = empty)
export type MuseumSlot = { rarity: Rarity | null };

// Security guard definition
export interface SecurityGuard {
  id: string;
  name: string;
  position: number; // 0-based index in the museum
}

type Inventory = Record<string, number>;

// Base museum slots per rebirth level
const BASE_MUSEUM_SLOTS = 3;
const SLOTS_PER_REBIRTH = 2;

interface GameState {
  inventory: Inventory;
  credits: number;
  rebirthCount: number;
  multiplier: number;
  totalFound: number;
  baseSize: number;
  lastDigResult: Rarity | null;
  lastDigTime: number;

  // Museum
  museumSlots: MuseumSlot[];
  securityGuards: SecurityGuard[];

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
  clearLastDig: () => void;

  // Museum actions
  placeInMuseum: (slotIndex: number, rarity: Rarity) => boolean;
  removeFromMuseum: (slotIndex: number) => void;

  // Security guard actions
  spawnGuard: (name: string) => void;
  removeGuard: (id: string) => void;
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

function makeMuseumSlots(count: number): MuseumSlot[] {
  return Array.from({ length: count }, () => ({ rarity: null }));
}

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
      museumSlots: makeMuseumSlots(BASE_MUSEUM_SLOTS),
      securityGuards: [],

      digMeteor: () => {
        const { multiplier, inventory, totalFound } = get();
        const rarity = weightedRandom();
        const newInventory = { ...inventory };

        for (let i = 0; i < multiplier; i++) {
          const r = i === 0 ? rarity : weightedRandom();
          newInventory[r] = (newInventory[r] || 0) + 1;
        }

        set({
          inventory: newInventory,
          totalFound: totalFound + multiplier,
          lastDigResult: rarity,
          lastDigTime: Date.now(),
        });

        return rarity;
      },

      sellMeteor: (rarity: string, qty: number) => {
        const { inventory, credits } = get();
        const available = inventory[rarity] || 0;
        if (available < qty) return false;

        const price = SELL_PRICES[rarity as Rarity] || 0;
        const earned = price * qty;

        set({
          inventory: { ...inventory, [rarity]: available - qty },
          credits: credits + earned,
        });
        return true;
      },

      fuseMeteors: (rarity: string) => {
        const { inventory } = get();
        const rarityIndex = RARITIES.indexOf(rarity as Rarity);

        if (rarityIndex === -1 || rarityIndex >= RARITIES.length - 1) {
          return { success: false, result: "" };
        }

        const available = inventory[rarity] || 0;
        if (available < 3) return { success: false, result: "" };

        const nextRarity = RARITIES[rarityIndex + 1];
        const newInventory = {
          ...inventory,
          [rarity]: available - 3,
          [nextRarity]: (inventory[nextRarity] || 0) + 1,
        };

        set({ inventory: newInventory });
        return { success: true, result: nextRarity };
      },

      exchangeForCredits: (rarity: string, qty: number) => {
        const { inventory, credits } = get();
        const available = inventory[rarity] || 0;
        if (available < qty) return 0;

        const rate = EXCHANGE_RATES[rarity as Rarity] || 0;
        const earned = rate * qty;

        set({
          inventory: { ...inventory, [rarity]: available - qty },
          credits: credits + earned,
        });
        return earned;
      },

      rebirth: () => {
        const {
          totalFound,
          rebirthCount,
          multiplier,
          baseSize,
          museumSlots,
          securityGuards,
        } = get();
        const required = 50 * (rebirthCount + 1);
        if (totalFound < required) return false;

        const newRebirthCount = rebirthCount + 1;
        const newSlotCount =
          BASE_MUSEUM_SLOTS + newRebirthCount * SLOTS_PER_REBIRTH;

        // Expand museum slots, preserving existing placed meteorites
        const expandedSlots: MuseumSlot[] = [...museumSlots];
        while (expandedSlots.length < newSlotCount) {
          expandedSlots.push({ rarity: null });
        }

        set({
          inventory: { ...defaultInventory },
          credits: 0,
          rebirthCount: newRebirthCount,
          multiplier: multiplier + 1,
          baseSize: baseSize + 1,
          totalFound: 0,
          lastDigResult: null,
          museumSlots: expandedSlots,
          securityGuards,
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
          museumSlots: makeMuseumSlots(BASE_MUSEUM_SLOTS),
          securityGuards: [],
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

      clearLastDig: () => {
        set({ lastDigResult: null });
      },

      placeInMuseum: (slotIndex: number, rarity: Rarity) => {
        const { museumSlots, inventory } = get();
        const available = inventory[rarity] || 0;
        if (available < 1) return false;
        if (slotIndex < 0 || slotIndex >= museumSlots.length) return false;

        const newSlots = [...museumSlots];
        // If slot already has something, return it to inventory
        const existing = newSlots[slotIndex].rarity;
        const newInventory = { ...inventory };
        if (existing) {
          newInventory[existing] = (newInventory[existing] || 0) + 1;
        }
        newSlots[slotIndex] = { rarity };
        newInventory[rarity] = (newInventory[rarity] || 0) - 1;

        set({ museumSlots: newSlots, inventory: newInventory });
        return true;
      },

      removeFromMuseum: (slotIndex: number) => {
        const { museumSlots, inventory } = get();
        if (slotIndex < 0 || slotIndex >= museumSlots.length) return;
        const slot = museumSlots[slotIndex];
        if (!slot.rarity) return;

        const newSlots = [...museumSlots];
        const newInventory = { ...inventory };
        newInventory[slot.rarity] = (newInventory[slot.rarity] || 0) + 1;
        newSlots[slotIndex] = { rarity: null };

        set({ museumSlots: newSlots, inventory: newInventory });
      },

      spawnGuard: (name: string) => {
        const { securityGuards } = get();
        const id = `guard-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set({
          securityGuards: [
            ...securityGuards,
            { id, name, position: securityGuards.length },
          ],
        });
      },

      removeGuard: (id: string) => {
        const { securityGuards } = get();
        set({
          securityGuards: securityGuards.filter((g) => g.id !== id),
        });
      },
    }),
    {
      name: "meteorite-digger-save",
    },
  ),
);
