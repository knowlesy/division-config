import { describe, it, expect } from 'vitest';
import { generateLoadoutTweaks } from '../src/lib/optimizer/tweak-engine';
import { GearSlot, GearPieceInstance, WeaponInstance } from '../src/lib/calc/types';

describe('Tweak Engine (Incremental Build Tuning)', () => {
  const sampleGear: Record<GearSlot, GearPieceInstance> = {
    mask: {
      slot: 'mask',
      kind: 'brand',
      name: 'Ceska Mask',
      brandOrSetId: 'ceska-vyroba',
      core: { type: 'Weapon Damage', value: 0.15 },
      minors: [
        { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
        { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
      ],
      modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
    },
    backpack: {
      slot: 'backpack',
      kind: 'brand',
      name: 'Grupo Backpack',
      brandOrSetId: 'grupo-sombra',
      core: { type: 'Armor', value: 170000 },
      minors: [
        { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
        { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
      ],
      modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
      talent: 'Unbreakable'
    },
    chest: {
      slot: 'chest',
      kind: 'brand',
      name: 'Fenris Chest',
      brandOrSetId: 'fenris-group-ab',
      core: { type: 'Weapon Damage', value: 0.15 },
      minors: [
        { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
        { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
      ],
      modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
      talent: 'Obliterate'
    },
    gloves: {
      slot: 'gloves',
      kind: 'brand',
      name: 'Ceska Gloves',
      brandOrSetId: 'ceska-vyroba',
      core: { type: 'Weapon Damage', value: 0.15 },
      minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
    },
    holster: {
      slot: 'holster',
      kind: 'brand',
      name: 'Grupo Holster',
      brandOrSetId: 'grupo-sombra',
      core: { type: 'Weapon Damage', value: 0.15 },
      minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
    },
    kneepads: {
      slot: 'kneepads',
      kind: 'brand',
      name: 'Walker Kneepads',
      brandOrSetId: 'walker-harris',
      core: { type: 'Weapon Damage', value: 0.15 },
      minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
    }
  };

  const sampleWeapon: WeaponInstance = {
    slot: 'primary',
    name: 'St. Elmo\'s Engine',
    category: 'AR',
    baseDamage: 52000,
    rpm: 850,
    magSize: 70,
    reloadTime: 2.3,
    innateHsd: 0.55,
    coreAttribute: { type: 'Weapon Damage', value: 0.15 },
    secondaryCoreAttribute: { type: 'Damage to Health', value: 0.21 }
  };

  it('generates actionable tweaks for active loadout', () => {
    const tweaks = generateLoadoutTweaks(sampleGear, sampleWeapon);
    expect(tweaks.length).toBeGreaterThan(0);

    // Each tweak must have deltas and why explanation
    tweaks.forEach(t => {
      expect(t.id).toBeDefined();
      expect(t.title).toBeDefined();
      expect(t.actionText).toBeDefined();
      expect(t.whyExplanation).toBeDefined();
      expect(typeof t.deltaSustainedDpsPct).toBe('number');
      expect(typeof t.deltaArmor).toBe('number');
    });
  });

  it('detects CHC overcap and recommends swapping CHC to CHD', () => {
    const smgWeapon: WeaponInstance = {
      ...sampleWeapon,
      category: 'SMG',
      secondaryCoreAttribute: { type: 'Critical Hit Chance', value: 0.21 }
    };
    const tweaks = generateLoadoutTweaks(sampleGear, smgWeapon, { critChance: 0.10 });
    const capFixes = tweaks.filter(t => t.category === 'cap-fix');
    expect(capFixes.length).toBeGreaterThan(0);
    expect(capFixes[0].deltaSustainedDpsPct).toBeGreaterThanOrEqual(0);
  });

  it('suggests Fox\'s Prayer (+8% DtOOC) on Kneepads as a high-impact swap', () => {
    const tweaks = generateLoadoutTweaks(sampleGear, sampleWeapon);
    const foxTweak = tweaks.find(t => t.id === 'swap-foxs-prayer');
    expect(foxTweak).toBeDefined();
    expect(foxTweak?.deltaSustainedDpsPct).toBeGreaterThan(0);
  });

  it('suggests core attribute recalibration (Blue -> Red for DPS and Red -> Blue for Armor)', () => {
    const tweaks = generateLoadoutTweaks(sampleGear, sampleWeapon);
    const redCoreTweak = tweaks.find(t => t.id === 'core-red-backpack');
    expect(redCoreTweak).toBeDefined();
    expect(redCoreTweak?.deltaSustainedDpsPct).toBeGreaterThan(0);

    const blueCoreTweak = tweaks.find(t => t.id.startsWith('core-blue-'));
    expect(blueCoreTweak).toBeDefined();
    expect(blueCoreTweak?.deltaArmor).toBe(170000);
  });
});
