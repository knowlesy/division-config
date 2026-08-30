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
 * Standard Status Immunity Thresholds (Reference §7)
 * Mean threshold is ~91.4% Hazard Protection for general immunity
 */
export const MEAN_STATUS_IMMUNITY_THRESHOLD = 0.914;

export const ARCHETYPES: Record<string, ArchetypeDefinition> = {
  sustained_dps: {
    id: 'sustained_dps',
    name: 'Sustained DPS',
    description: 'Damage over a long engagement, at steady state — stack build-up, decay, reload and magazine costs included.',
    defaultFloors: {},
    score: (stats: ComputedLoadoutStats) => {
      return stats.sustainedDps + (stats.pestilencePlagueTickDamage ? stats.pestilencePlagueTickDamage * 10 : 0);
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
    description: 'Achieves immunity thresholds across status categories to shrug off disrupt, bleed, and fire.',
    defaultFloors: {
      minHazardProtection: 0.80
    },
    score: (stats: ComputedLoadoutStats) => {
      const hazPct = stats.hazardProtection || 0;
      const proximity = Math.min(1.0, hazPct / MEAN_STATUS_IMMUNITY_THRESHOLD);
      const ehpScore = stats.effectiveHealth / 10000;
      return proximity * 10000 + ehpScore;
    },
    validateFloors: (stats: ComputedLoadoutStats, floors: ArchetypeFloors) => {
      const required = floors.minHazardProtection !== undefined ? floors.minHazardProtection : 0.80;
      if ((stats.hazardProtection || 0) < required) {
        return { satisfied: false, shortfall: `Hazard Protection ${Math.round((stats.hazardProtection || 0) * 100)}% / ${Math.round(required * 100)}%` };
      }
      return { satisfied: true };
    }
  }
};
