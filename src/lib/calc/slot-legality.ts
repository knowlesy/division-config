import { GearSlot } from './types';

export interface MinorAttributeInfo {
  name: string;
  category: 'offensive' | 'defensive' | 'skill';
  maxRoll: number; // Tier 2 God Roll
  typicalRoll: number; // Tier 1 Realistic Drop (~70-80% roll)
  unit: string;
  validSlots: GearSlot[];
  hardCap?: number;
}

export interface ModAttributeInfo {
  name: string;
  category: 'offensive' | 'defensive' | 'skill';
  maxRoll: number;
  typicalRoll: number;
  unit: string;
  validSlots: GearSlot[];
}

export const ALL_GEAR_SLOTS: GearSlot[] = ['mask', 'backpack', 'chest', 'gloves', 'holster', 'kneepads'];
export const MOD_GEAR_SLOTS: GearSlot[] = ['mask', 'backpack', 'chest'];

/**
 * Standard 12 Minor Attributes rollable on gear pieces.
 * In Division 2 (Gear 2.0+), all 12 standard minors can roll on any gear slot.
 */
export const STANDARD_GEAR_MINORS: MinorAttributeInfo[] = [
  // Offensive
  { name: 'Critical Hit Chance', category: 'offensive', maxRoll: 0.06, typicalRoll: 0.045, unit: '%', validSlots: ALL_GEAR_SLOTS, hardCap: 0.60 },
  { name: 'Critical Hit Damage', category: 'offensive', maxRoll: 0.12, typicalRoll: 0.09, unit: '%', validSlots: ALL_GEAR_SLOTS },
  { name: 'Headshot Damage', category: 'offensive', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: ALL_GEAR_SLOTS },
  { name: 'Weapon Handling', category: 'offensive', maxRoll: 0.08, typicalRoll: 0.06, unit: '%', validSlots: ALL_GEAR_SLOTS },

  // Defensive
  { name: 'Armor Regeneration', category: 'defensive', maxRoll: 4925, typicalRoll: 3700, unit: '/s', validSlots: ALL_GEAR_SLOTS },
  { name: 'Hazard Protection', category: 'defensive', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: ALL_GEAR_SLOTS, hardCap: 1.00 },
  { name: 'Health', category: 'defensive', maxRoll: 18935, typicalRoll: 14200, unit: '', validSlots: ALL_GEAR_SLOTS },
  { name: 'Explosive Resistance', category: 'defensive', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: ALL_GEAR_SLOTS },

  // Skill
  { name: 'Skill Haste', category: 'skill', maxRoll: 0.12, typicalRoll: 0.09, unit: '%', validSlots: ALL_GEAR_SLOTS },
  { name: 'Skill Damage', category: 'skill', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: ALL_GEAR_SLOTS },
  { name: 'Repair Skills', category: 'skill', maxRoll: 0.20, typicalRoll: 0.15, unit: '%', validSlots: ALL_GEAR_SLOTS },
  { name: 'Status Effects', category: 'skill', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: ALL_GEAR_SLOTS }
];

/**
 * Standard Gear Mods (Mask, Backpack, Chest, and Improvised pieces)
 */
export const STANDARD_GEAR_MODS: ModAttributeInfo[] = [
  // Offensive
  { name: 'Critical Hit Chance', category: 'offensive', maxRoll: 0.06, typicalRoll: 0.045, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Critical Hit Damage', category: 'offensive', maxRoll: 0.12, typicalRoll: 0.09, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Headshot Damage', category: 'offensive', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: MOD_GEAR_SLOTS },

  // Defensive
  { name: 'Protection from Elites', category: 'defensive', maxRoll: 0.13, typicalRoll: 0.10, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Armor on Kill', category: 'defensive', maxRoll: 18935, typicalRoll: 14200, unit: '', validSlots: MOD_GEAR_SLOTS },
  { name: 'Status Effect Resistance', category: 'defensive', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Pulse Resistance', category: 'defensive', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Incoming Repairs', category: 'defensive', maxRoll: 0.20, typicalRoll: 0.15, unit: '%', validSlots: MOD_GEAR_SLOTS },

  // Skill
  { name: 'Skill Haste', category: 'skill', maxRoll: 0.12, typicalRoll: 0.09, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Skill Duration', category: 'skill', maxRoll: 0.10, typicalRoll: 0.075, unit: '%', validSlots: MOD_GEAR_SLOTS },
  { name: 'Repair Skills', category: 'skill', maxRoll: 0.20, typicalRoll: 0.15, unit: '%', validSlots: MOD_GEAR_SLOTS }
];

export function getMinorAttributeByName(name: string): MinorAttributeInfo | undefined {
  const lower = name.toLowerCase().trim();
  return STANDARD_GEAR_MINORS.find(m => m.name.toLowerCase() === lower);
}

export function getModAttributeByName(name: string): ModAttributeInfo | undefined {
  const lower = name.toLowerCase().trim();
  return STANDARD_GEAR_MODS.find(m => m.name.toLowerCase() === lower);
}
