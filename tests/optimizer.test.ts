import { describe, it, expect } from 'vitest';
import { runTwoTierOptimization } from '../src/lib/optimizer/engine';
import { WeaponInstance } from '../src/lib/calc/types';
import { ARCHETYPES } from '../src/lib/optimizer/archetypes';

describe('Two-Tier Optimizer Engine', () => {
  const pestilenceWeapon: WeaponInstance = {
    slot: 'primary',
    name: 'Pestilence',
    category: 'LMG',
    baseDamage: 48300,
    rpm: 935,
    magSize: 100,
    reloadTime: 4.54,
    innateHsd: 0.65,
    coreAttribute: { type: 'Weapon Damage', value: 0.15 },
    secondaryCoreAttribute: { type: 'Damage to Target Out of Cover', value: 0.12 },
    minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
    talent: 'Plague of the Outcasts',
    isExotic: true
  };

  it('optimizes Sustained DPS producing both Practical and Ceiling builds', () => {
    const result = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'sustained_dps',
      watch: { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      specialization: 'Gunner',
      context: { isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true }
    });

    expect(result.floorsSatisfied).toBe(true);
    expect(result.practical).toBeDefined();
    expect(result.ceiling).toBeDefined();

    // Ceiling score should be higher than or equal to Practical score
    expect(result.ceiling.score).toBeGreaterThanOrEqual(result.practical.score);

    // Both tiers must have valid gear across all 6 slots
    expect(Object.keys(result.practical.gear)).toHaveLength(6);
    expect(Object.keys(result.ceiling.gear)).toHaveLength(6);

    // Both tiers must produce 6 shopping list items with recalibration instructions
    expect(result.practical.shoppingList).toHaveLength(6);
    expect(result.ceiling.shoppingList).toHaveLength(6);

    for (const item of result.practical.shoppingList) {
      expect(item.itemName.length).toBeGreaterThan(0);
      expect(item.recalibrationInstruction.length).toBeGreaterThan(0);
    }

    // Gap analysis
    expect(result.gap.scoreDeltaPct).toBeGreaterThanOrEqual(0);
    expect(result.gap.scoreDeltaHeadline.length).toBeGreaterThan(0);
    expect(result.gap.godRollPiecesNeeded).toBeGreaterThan(0);
  });

  it('optimizes Glass Medic and Field Medic respecting armor and haste floors', () => {
    // Glass Medic
    const glassResult = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'glass_medic',
      watch: { skillRepair: 0.10, skillHaste: 0.10 },
      specialization: 'Survivalist',
      context: { isSolo: false, distanceMeters: 15 }
    });
    expect(glassResult.floorsSatisfied).toBe(true);
    expect(glassResult.ceiling.stats.groupBreakdown.skillRepairSum).toBeGreaterThan(0);

    // Field Medic with armor floor
    const fieldResult = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'field_medic',
      customFloors: { minArmor: 1100000 },
      watch: { skillRepair: 0.10, skillHaste: 0.10, armor: 0.10 },
      specialization: 'Survivalist',
      context: { isSolo: false, distanceMeters: 15 }
    });
    expect(fieldResult.floorsSatisfied).toBe(true);
    expect(fieldResult.ceiling.stats.totalArmor).toBeGreaterThanOrEqual(1100000);
  });

  it('optimizes Skill Damage enforcing hard Skill Tier 6 floor', () => {
    const skillResult = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'skill_damage',
      watch: { skillDamage: 0.10, skillHaste: 0.10 },
      specialization: 'Technician',
      context: { isSolo: true, distanceMeters: 15 }
    });

    expect(skillResult.floorsSatisfied).toBe(true);
    expect(skillResult.ceiling.stats.skillTier).toBe(6);
    expect(skillResult.practical.stats.skillTier).toBe(6);
  });

  it('optimizes Bulwark and Lightning Rod respecting threat & EHP metrics', () => {
    const rodResult = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'lightning_rod',
      customFloors: { minArmor: 1400000 },
      watch: { armor: 0.10, health: 0.10 },
      specialization: 'Gunner',
      context: { isSolo: false, distanceMeters: 15 }
    });

    expect(rodResult.floorsSatisfied).toBe(true);
    expect(rodResult.ceiling.stats.totalArmor).toBeGreaterThanOrEqual(1400000);
    expect(rodResult.ceiling.stats.threatMultiplier).toBeGreaterThanOrEqual(1.0);
  });

  it('reports floor shortfall honestly when constraints cannot be met', () => {
    const impossibleResult = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'field_medic',
      customFloors: { minArmor: 3000000 }, // Impossible armor in game
      watch: {},
      specialization: 'Gunner',
      context: { isSolo: false, distanceMeters: 15 }
    });

    expect(impossibleResult.floorsSatisfied).toBe(false);
    expect(impossibleResult.shortfallReason).toBeDefined();
    expect(impossibleResult.warnings.length).toBeGreaterThan(0);
  });

  it('Falsifier (§3, §8 criterion 15): alters score when underlying data values change', () => {
    const baseRun = runTwoTierOptimization(pestilenceWeapon, {
      archetypeId: 'sustained_dps',
      watch: { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      specialization: 'Gunner',
      context: { isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true }
    });

    const modifiedWeapon: WeaponInstance = {
      ...pestilenceWeapon,
      baseDamage: pestilenceWeapon.baseDamage * 2 // Double base damage
    };

    const modifiedRun = runTwoTierOptimization(modifiedWeapon, {
      archetypeId: 'sustained_dps',
      watch: { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      specialization: 'Gunner',
      context: { isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true }
    });

    expect(modifiedRun.ceiling.score).toBeGreaterThan(baseRun.ceiling.score * 1.5);
    expect(modifiedRun.ceiling.stats.sustainedDps).toBeGreaterThan(baseRun.ceiling.stats.sustainedDps * 1.5);
  });
});
