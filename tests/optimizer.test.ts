import { describe, it, expect } from 'vitest';
import { runOptimization } from '../src/lib/optimizer/engine';
import { GearSlot, GearPieceInstance, WeaponInstance } from '../src/lib/calc/types';

describe('Optimizer Engine', () => {
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

  const baselineGear: Record<GearSlot, GearPieceInstance> = {
    mask: { slot: 'mask', kind: 'brand', name: 'Airaldi Mask', brandOrSetId: 'airaldi-holdings', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Headshot Damage', value: 0.10, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
    backpack: { slot: 'backpack', kind: 'brand', name: 'Airaldi Backpack', brandOrSetId: 'airaldi-holdings', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Headshot Damage', value: 0.10, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], talent: 'Vigilance' },
    chest: { slot: 'chest', kind: 'brand', name: 'Airaldi Chest', brandOrSetId: 'airaldi-holdings', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Headshot Damage', value: 0.10, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], talent: 'Obliterate' },
    gloves: { slot: 'gloves', kind: 'brand', name: 'Airaldi Gloves', brandOrSetId: 'airaldi-holdings', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Headshot Damage', value: 0.10, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
    holster: { slot: 'holster', kind: 'brand', name: 'Airaldi Holster', brandOrSetId: 'airaldi-holdings', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Headshot Damage', value: 0.10, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
    kneepads: { slot: 'kneepads', kind: 'brand', name: 'Airaldi Kneepads', brandOrSetId: 'airaldi-holdings', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Headshot Damage', value: 0.10, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
  };

  it('finds high DPS candidate builds for Pestilence', () => {
    const candidates = runOptimization(
      baselineGear,
      pestilenceWeapon,
      'max_sustained_dps',
      {},
      { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      'Gunner',
      { isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true }
    );

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].score).toBeGreaterThan(0);
    expect(candidates[0].stats.sustainedDps).toBeGreaterThan(0);
    expect(candidates[0].tradeoffAnalysis.length).toBeGreaterThan(0);
  });

  it('respects minimum armor floor constraint (1,200,000 armor)', () => {
    const candidates = runOptimization(
      baselineGear,
      pestilenceWeapon,
      'max_sustained_dps',
      { minArmor: 1200000 },
      { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      'Gunner',
      { isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true }
    );

    for (const c of candidates) {
      expect(c.stats.totalArmor).toBeGreaterThanOrEqual(1200000);
    }
  });

  it('respects minimum skill tier constraint (Tier 6)', () => {
    const candidates = runOptimization(
      baselineGear,
      pestilenceWeapon,
      'max_status_effects',
      { minSkillTier: 6 },
      { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
      'Technician',
      { isSolo: false, distanceMeters: 15, isEnemyStatusAffected: true }
    );

    for (const c of candidates) {
      expect(c.stats.skillTier).toBe(6);
    }
  });
});
