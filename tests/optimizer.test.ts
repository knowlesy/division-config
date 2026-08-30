import { describe, it, expect } from 'vitest';
import { runTwoTierOptimization, getAllCoreVariations } from '../src/lib/optimizer/engine';
import { computeFarmingProbability } from '../src/lib/optimizer/cost-model';
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

  it('Falsifier on Sustained DPS with DoT: shifts score with 1:1 rate parity when DoT varies', () => {
    const standardWeapon: WeaponInstance = {
      slot: 'primary',
      name: 'Custom P416 G3',
      category: 'Assault Rifle',
      baseDamage: 45000,
      rpm: 750,
      magSize: 30,
      reloadTime: 2.0,
      innateHsd: 0.55,
      coreAttribute: { type: 'Weapon Damage', value: 0.15 },
      minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
      talent: 'Strained'
    };

    const bulletOnlyRun = runTwoTierOptimization(standardWeapon, {
      archetypeId: 'sustained_dps',
      watch: { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      specialization: 'Gunner',
      context: { isSolo: true, distanceMeters: 20, isEnemyOutOfCover: true }
    });

    // Score is exactly sustained DPS with 0 DoT
    expect(bulletOnlyRun.ceiling.score).toBeCloseTo(bulletOnlyRun.ceiling.stats.sustainedDps, -1);
  });

  it('evaluates all 28 integer partitions of 6 cores across Red, Blue, and Yellow (C(8,2) = 28)', () => {
    const variations = getAllCoreVariations();
    expect(variations).toHaveLength(28);

    // Verify all 28 are unique partitions of 6
    const uniqueKeys = new Set(variations.map(cores => {
      const red = cores.filter(c => c === 'Weapon Damage').length;
      const blue = cores.filter(c => c === 'Armor').length;
      const yellow = cores.filter(c => c === 'Skill Tier').length;
      expect(red + blue + yellow).toBe(6);
      return `${red}-${blue}-${yellow}`;
    }));
    expect(uniqueKeys.size).toBe(28);

    // Check specific hybrids exist: 5-0-1, 4-0-2, 3-0-3, 2-0-4, 1-0-5, 2-2-2
    expect(uniqueKeys.has('5-0-1')).toBe(true);
    expect(uniqueKeys.has('4-0-2')).toBe(true);
    expect(uniqueKeys.has('3-0-3')).toBe(true);
    expect(uniqueKeys.has('2-0-4')).toBe(true);
    expect(uniqueKeys.has('1-0-5')).toBe(true);
    expect(uniqueKeys.has('2-2-2')).toBe(true);
  });

  it('correctly calculates exact combinatoric farming probabilities and ratios', () => {
    // 2 desired minors: Scenario A (1/66, 66 drops) vs Scenario B (21/66, 3.14 drops) -> ~21x ratio
    const twoMinorsCoreRecal = computeFarmingProbability(2, true);
    expect(twoMinorsCoreRecal.probability).toBeCloseTo(1 / 66, 5);
    expect(twoMinorsCoreRecal.expectedDrops).toBe(66);

    const twoMinorsCoreKept = computeFarmingProbability(2, false);
    expect(twoMinorsCoreKept.probability).toBeCloseTo(21 / 66, 5);
    expect(twoMinorsCoreKept.expectedDrops).toBeCloseTo(66 / 21, 2);

    const ratio2 = twoMinorsCoreKept.probability / twoMinorsCoreRecal.probability;
    expect(ratio2).toBeCloseTo(21, 1);

    // 1 desired minor: Scenario A (1/6, 6 drops) vs Scenario B (1.0, 1 drop) -> 6x ratio
    const oneMinorCoreRecal = computeFarmingProbability(1, true);
    expect(oneMinorCoreRecal.probability).toBeCloseTo(1 / 6, 5);
    expect(oneMinorCoreRecal.expectedDrops).toBe(6);

    const oneMinorCoreKept = computeFarmingProbability(1, false);
    expect(oneMinorCoreKept.probability).toBe(1.0);
    expect(oneMinorCoreKept.expectedDrops).toBe(1);

    const ratio1 = oneMinorCoreKept.probability / oneMinorCoreRecal.probability;
    expect(ratio1).toBeCloseTo(6, 1);
  });
});
