import { ComputedLoadoutStats, CombatContext } from '../calc/types';

export interface ArchetypeFloors {
  minArmor?: number;
  minSkillTier?: number;
  minSkillHaste?: number;
  minHazardProtection?: number;
}

export interface ArchetypeDefinition {
  id: string;
  name: string;
  description: string;
  isGroupOnly?: boolean;
  defaultFloors: ArchetypeFloors;
  score: (stats: ComputedLoadoutStats, context: CombatContext) => number;
  validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors, context: CombatContext) => { satisfied: boolean; shortfall?: string };
}

/**
 * Exact Status Immunity Cliff Thresholds (Reference §7)
 * Pulse: 100.0%, Disrupt: 95.8%, Bleed/Disorient/Ensnare: 93.8%, Burn: 91.4%, Blind/Deaf: 91.0%, Poison: 89.2%, Shock: 86.0%
 */
export const STATUS_IMMUNITY_CLIFFS = {
  pulse: 1.00,
  disrupt: 0.958,
  bleed: 0.938,
  burn: 0.914,
  blind: 0.910,
  poison: 0.892,
  shock: 0.860
};

export const DEFAULT_STATUS_IMMUNITY_CLIFF = STATUS_IMMUNITY_CLIFFS.burn; // 91.4% Burn Immunity

export const ARCHETYPES: Record<string, ArchetypeDefinition> = {
  sustained_dps: {
    id: 'sustained_dps',
    name: 'Sustained DPS',
    description: 'Damage over a long engagement, at steady state — stack build-up, decay, reload and magazine costs included.',
    defaultFloors: {},
    score: (stats: ComputedLoadoutStats) => {
      // Steady-state sustained bullet rate (dmg/s) plus damage-over-time tick rate (dmg/s) at 1:1 rate parity
      return stats.sustainedDps + (stats.dotTickDamage || 0);
    },
    validateFloors: () => ({ satisfied: true })
  },

  precision_dps: {
    id: 'precision_dps',
    name: 'Precision DPS',
    description: 'Burst damage within an engagement window, heavily weighted to headshots.',
    defaultFloors: {},
    score: (stats: ComputedLoadoutStats) => {
      const headshotWeight = 0.75;
      const bodyWeight = 0.25;
      const weightedHit = stats.effectiveHeadshotDamage * headshotWeight + stats.effectiveBulletDamage * bodyWeight;
      const rofMultiplier = stats.groupBreakdown.rateOfFireMultiplier || 1.0;
      return weightedHit * rofMultiplier;
    },
    validateFloors: () => ({ satisfied: true })
  },

  skill_damage: {
    id: 'skill_damage',
    name: 'Skill Damage',
    description: 'Maximises pure destructive output from deployed skills and explosive devices.',
    defaultFloors: {
      minSkillTier: 6
    },
    score: (stats: ComputedLoadoutStats) => {
      const tierBonus = 1 + stats.skillTier * 0.20;
      const directSkillDamage = 1 + stats.groupBreakdown.skillDamageSum;
      const totalSkillDamage = 1 + stats.groupBreakdown.totalSkillDamageSum;
      return directSkillDamage * totalSkillDamage * tierBonus * 10000;
    },
    validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors) => {
      const required = floors.minSkillTier !== undefined ? floors.minSkillTier : 6;
      if (stats.skillTier < required) {
        return { satisfied: false, shortfall: `Skill Tier ${stats.skillTier}/${required}` };
      }
      return { satisfied: true };
    }
  },

  glass_medic: {
    id: 'glass_medic',
    name: 'Glass Medic',
    description: 'You keep three other people alive and die if anything looks at you.',
    defaultFloors: {},
    score: (stats: ComputedLoadoutStats) => {
      const repairScore = stats.groupBreakdown.skillRepairSum * 10000;
      const hasteScore = (stats.skillHasteSum || 0) * 2000;
      const tierScore = stats.skillTier * 1500;
      return repairScore + hasteScore + tierScore;
    },
    validateFloors: () => ({ satisfied: true })
  },

  field_medic: {
    id: 'field_medic',
    name: 'Field Medic',
    description: 'High burst and sustained healing with enough personal armour to survive incoming fire.',
    defaultFloors: {
      minArmor: 1100000,
      minSkillHaste: 0.20
    },
    score: (stats: ComputedLoadoutStats) => {
      const repairScore = stats.groupBreakdown.skillRepairSum * 8000;
      const armorScore = (stats.totalArmor / 1000) * 2;
      const tierScore = stats.skillTier * 1000;
      return repairScore + armorScore + tierScore;
    },
    validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors) => {
      if (floors.minArmor && stats.totalArmor < floors.minArmor) {
        return { satisfied: false, shortfall: `Armour ${Math.round(stats.totalArmor / 1000)}k / ${Math.round(floors.minArmor / 1000)}k` };
      }
      if (floors.minSkillHaste && (stats.skillHasteSum || 0) < floors.minSkillHaste) {
        return { satisfied: false, shortfall: `Skill Haste ${Math.round((stats.skillHasteSum || 0) * 100)}% / ${Math.round(floors.minSkillHaste * 100)}%` };
      }
      return { satisfied: true };
    }
  },

  force_multiplier: {
    id: 'force_multiplier',
    name: 'Force Multiplier',
    description: 'Maximises team damage amplifiers and ally mitigation; your personal damage does not count.',
    isGroupOnly: true,
    defaultFloors: {},
    score: (stats: ComputedLoadoutStats) => {
      const allyDamage = stats.groupBreakdown.allyDamageBonusSum * 10000;
      const debuffAmp = (stats.groupBreakdown.enemyDebuffMultiplier - 1.0) * 15000;
      const allyMitigation = stats.groupBreakdown.allyMitigationBonusSum * 5000;
      return allyDamage + debuffAmp + allyMitigation;
    },
    validateFloors: (_stats: ComputedLoadoutStats, _floors: ArchetypeFloors, context: CombatContext) => {
      if (context.isSolo) {
        return { satisfied: false, shortfall: 'Group mode required' };
      }
      return { satisfied: true };
    }
  },

  bulwark: {
    id: 'bulwark',
    name: 'Bulwark',
    description: 'Immense total armour, health, and mitigation to absorb sustained incoming punishment.',
    defaultFloors: {
      minSkillTier: 0
    },
    score: (stats: ComputedLoadoutStats) => {
      const ehp = stats.effectiveHealth;
      const hazardBonus = 1 + (stats.hazardProtection || 0) * 0.25;
      return (ehp / 1000) * hazardBonus;
    },
    validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors) => {
      if (floors.minSkillTier && stats.skillTier < floors.minSkillTier) {
        return { satisfied: false, shortfall: `Skill Tier ${stats.skillTier}/${floors.minSkillTier}` };
      }
      return { satisfied: true };
    }
  },

  lightning_rod: {
    id: 'lightning_rod',
    name: 'Lightning Rod',
    description: 'Draws maximum enemy aggro through high threat, backed by a massive armour pool.',
    isGroupOnly: true,
    defaultFloors: {
      minArmor: 1400000
    },
    score: (stats: ComputedLoadoutStats) => {
      const threatScore = stats.threatMultiplier * 10000;
      const ehpScore = stats.effectiveHealth / 1000;
      return threatScore + ehpScore;
    },
    validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors, context: CombatContext) => {
      if (context.isSolo) {
        return { satisfied: false, shortfall: 'Group mode required' };
      }
      if (floors.minArmor && stats.totalArmor < floors.minArmor) {
        return { satisfied: false, shortfall: `Armour ${Math.round(stats.totalArmor / 1000)}k / ${Math.round(floors.minArmor / 1000)}k` };
      }
      return { satisfied: true };
    }
  },

  lockdown: {
    id: 'lockdown',
    name: 'Lockdown',
    description: 'Total crowd control through maximized Status Effects magnitude, spread breadth, and uptime.',
    defaultFloors: {},
    score: (stats: ComputedLoadoutStats) => {
      const statusScore = stats.groupBreakdown.statusEffectsSum * 10000;
      const tierScore = stats.skillTier * 1500;
      const hasteScore = (stats.skillHasteSum || 0) * 1000;
      return statusScore + tierScore + hasteScore;
    },
    validateFloors: () => ({ satisfied: true })
  },

  hardened: {
    id: 'hardened',
    name: 'Hardened',
    description: 'Achieves discrete status immunity cliff thresholds (Reference §7) with zero value for surplus beyond the cliff.',
    defaultFloors: {
      minHazardProtection: DEFAULT_STATUS_IMMUNITY_CLIFF
    },
    score: (stats: ComputedLoadoutStats) => {
      const haz = stats.hazardProtection || 0;
      let immunityScore = 0;
      // Discrete cliff evaluation (Reference §7): points directly derived from threshold difficulty (threshold * 1,000)
      if (haz >= STATUS_IMMUNITY_CLIFFS.shock) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.shock * 1000); // +860 pts
      if (haz >= STATUS_IMMUNITY_CLIFFS.poison) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.poison * 1000); // +892 pts
      if (haz >= STATUS_IMMUNITY_CLIFFS.blind) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.blind * 1000); // +910 pts
      if (haz >= STATUS_IMMUNITY_CLIFFS.burn) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.burn * 1000); // +914 pts
      if (haz >= STATUS_IMMUNITY_CLIFFS.bleed) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.bleed * 1000); // +938 pts (Bleed, Disorient, Ensnare)
      if (haz >= STATUS_IMMUNITY_CLIFFS.disrupt) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.disrupt * 1000); // +958 pts
      if (haz >= STATUS_IMMUNITY_CLIFFS.pulse) immunityScore += Math.round(STATUS_IMMUNITY_CLIFFS.pulse * 1000); // +1000 pts

      // Effective Health differentiator; surplus beyond cleared cliffs awards 0 additional immunity points
      const ehpScore = stats.effectiveHealth / 1000;
      return immunityScore + ehpScore;
    },
    validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors) => {
      const required = floors.minHazardProtection !== undefined ? floors.minHazardProtection : DEFAULT_STATUS_IMMUNITY_CLIFF;
      if ((stats.hazardProtection || 0) < required) {
        return {
          satisfied: false,
          shortfall: `Hazard Protection ${((stats.hazardProtection || 0) * 100).toFixed(1)}% / ${(required * 100).toFixed(1)}% (Immunity Cliff Unmet)`
        };
      }
      return { satisfied: true };
    }
  }
};
