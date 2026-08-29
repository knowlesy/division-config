/**
 * Attribute caps and status immunity thresholds from Reference §7.
 */

export const HARD_CAPS = {
  critChance: 0.60, // 60% hard cap in game
  gearCore: {
    armor: 170000,
    armorPrototype: 255001,
    weaponDamage: 0.15,
    weaponDamagePrototype: 0.225,
    skillTier: 1,
    skillTierPrototype: 1.5
  },
  gearMinors: {
    offensive: {
      weaponHandling: 0.08,
      critChance: 0.06,
      critDamage: 0.12,
      headshotDamage: 0.10
    },
    defensive: {
      armorRegen: 4925,
      hazardProtection: 0.10,
      health: 18935,
      explosiveResistance: 0.10
    },
    skill: {
      skillHaste: 0.12,
      skillDamage: 0.10,
      repairSkills: 0.20,
      statusEffects: 0.10
    }
  },
  gearMods: {
    offensive: {
      critChance: 0.06,
      critDamage: 0.12,
      headshotDamage: 0.10
    },
    defensive: {
      protectionFromElites: 0.13,
      armorOnKill: 18935,
      statusEffectResistance: 0.10,
      pulseResistance: 0.10,
      incomingRepairs: 0.20
    },
    skill: {
      skillHaste: 0.12,
      skillDuration: 0.10,
      repairSkills: 0.20
    }
  },
  watchMaxima: {
    weaponDamage: 0.10,
    headshotDamage: 0.20,
    critChance: 0.10,
    critDamage: 0.20,
    armor: 0.10,
    health: 0.10,
    hazardProtection: 0.10,
    explosiveResistance: 0.10,
    skillDamage: 0.10,
    skillRepair: 0.10,
    skillHaste: 0.10,
    skillDuration: 0.20,
    reloadSpeed: 0.10,
    accuracy: 0.10,
    ammo: 0.20,
    stability: 0.10
  }
};

export const STATUS_IMMUNITY_THRESHOLDS: Record<string, number> = {
  'Pulse': 100.0,
  'Disrupt': 95.8,
  'Bleed': 93.8,
  'Disorient': 93.8,
  'Ensnare': 93.8,
  'Burn': 91.4,
  'Blind/Deaf': 91.0,
  'Poison': 89.2,
  'Napalm (Cleaners)': 88.9,
  'Shock': 86.0
};

/**
 * Check whether a Hazard Protection / Specific Resistance value reaches the threshold.
 */
export function isStatusImmune(statusName: string, totalResistancePct: number): boolean {
  const threshold = STATUS_IMMUNITY_THRESHOLDS[statusName];
  if (threshold === undefined) return false;
  return totalResistancePct >= threshold;
}
