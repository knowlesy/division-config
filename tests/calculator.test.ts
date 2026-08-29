import { describe, it, expect } from 'vitest';
import { calculateMultiplierBreakdown, calculateDamageMetrics } from '../src/lib/calc/multipliers';
import {
  calculateSkillEfficiency,
  calculateHeartstopper,
  calculateStrikerGamble,
  calculateHuntersFury,
  calculateFafnirAmplifier,
  calculateTruePatriotRedFlag,
  calculatePestilencePlague
} from '../src/lib/calc/special-cases';
import { HARD_CAPS, isStatusImmune, STATUS_IMMUNITY_THRESHOLDS } from '../src/lib/calc/caps';
import { validateGearPieceLegality, validateLoadoutLegality } from '../src/lib/calc/constraints';
import { calculateLoadout } from '../src/lib/calc/loadout-calculator';
import { GearPieceInstance, WeaponInstance } from '../src/lib/calc/types';

describe('Calculator Step 2: Multiplier Groups & Pure Mathematics', () => {
  it('adds bonuses within the same group additively (30% + 30% = 1.60x)', () => {
    const breakdown = calculateMultiplierBreakdown([
      { group: 'Weapon Damage', value: 0.30, source: 'Bonus 1' },
      { group: 'Weapon Damage', value: 0.30, source: 'Bonus 2' }
    ]);
    expect(breakdown.weaponDamageSum).toBeCloseTo(0.60);
    const metrics = calculateDamageMetrics(100, breakdown);
    // Base 100 * (1 + 0.60) = 160
    expect(metrics.baseHit).toBeCloseTo(160);
  });

  it('multiplies bonuses across different groups (1.30 * 1.30 = 1.69x)', () => {
    const breakdown = calculateMultiplierBreakdown([
      { group: 'Weapon Damage', value: 0.30, source: 'WD Bonus' },
      { group: 'Total Weapon Damage', value: 0.30, source: 'TWD Bonus' }
    ]);
    expect(breakdown.weaponDamageSum).toBeCloseTo(0.30);
    expect(breakdown.totalWeaponDamageSum).toBeCloseTo(0.30);
    const metrics = calculateDamageMetrics(100, breakdown);
    // 100 * (1 + 0.30) * (1 + 0.30) = 169
    expect(metrics.baseHit).toBeCloseTo(169);
  });

  it('treats amplifiers as NEVER additive with each other (each amp is its own multiplicative term)', () => {
    const breakdown = calculateMultiplierBreakdown([
      { group: 'Weapon Damage', value: 0.15, source: 'Core' },
      { group: 'Amplifier', value: 0.20, source: 'Spotter', isIndependentAmp: true },
      { group: 'Amplifier', value: 0.30, source: 'Overdogs', isIndependentAmp: true }
    ]);
    // 1.20 * 1.30 = 1.56x total amp
    expect(breakdown.totalAmplifierMultiplier).toBeCloseTo(1.56);
    const metrics = calculateDamageMetrics(100, breakdown);
    // 100 * 1.15 * 1.20 * 1.30 = 179.4
    expect(metrics.baseHit).toBeCloseTo(179.4);
  });

  it('hard-caps Critical Hit Chance at 60%', () => {
    const breakdown = calculateMultiplierBreakdown([
      { group: 'Critical Hit Chance', value: 0.30, source: 'Source 1' },
      { group: 'Critical Hit Chance', value: 0.40, source: 'Source 2' }
    ]);
    expect(breakdown.critChance).toBe(0.60);
  });
});

describe('Calculator Step 2: Special Cases Mechanics', () => {
  it('Skill Efficiency provides +1% to every yellow minor attribute', () => {
    const eff = calculateSkillEfficiency(10);
    expect(eff.skillDamage).toBeCloseTo(0.10);
    expect(eff.skillHaste).toBeCloseTo(0.10);
    expect(eff.skillDuration).toBeCloseTo(0.10);
    expect(eff.skillHealth).toBeCloseTo(0.10);
    expect(eff.repairSkills).toBeCloseTo(0.10);
    expect(eff.statusEffects).toBeCloseTo(0.10);
  });

  it('Heartbreaker Heartstopper calculates (1 + 0.011n)', () => {
    const withoutChest = calculateHeartstopper(50, false);
    expect(withoutChest.factor).toBeCloseTo(1 + 0.011 * 50); // 1.55x
    const withChest = calculateHeartstopper(100, true);
    expect(withChest.factor).toBeCloseTo(1 + 0.011 * 100); // 2.10x
  });

  it('Striker Gamble functions as an amplifier (1 + 0.009n with backpack, max 200 with chest -> 2.8x)', () => {
    const maxStriker = calculateStrikerGamble(200, true, true);
    expect(maxStriker.factor).toBeCloseTo(2.80);
  });

  it("Hunter's Fury calculates self-multiplicative kill stacks 1.05^n", () => {
    const hf = calculateHuntersFury(true, 5);
    expect(hf.proximityAmp).toBe(1.20);
    expect(hf.killAmp).toBeCloseTo(Math.pow(1.05, 5)); // ~1.27628
    expect(hf.totalFactor).toBeCloseTo(1.20 * Math.pow(1.05, 5));
  });

  it('Pestilence Plague scales off weapon damage and does not crit', () => {
    const plague = calculatePestilencePlague(48300, 0.90, 0.25, 1.30, 50);
    expect(plague.doesCrit).toBe(false);
    expect(plague.stacks).toBe(50);
    expect(plague.totalDebuffDamage10s).toBeGreaterThan(0);
  });
});

describe('Calculator Step 2: Constraints & Recalibration Legality', () => {
  it('rejects a gear piece with more than one recalibration', () => {
    const illegalPiece: GearPieceInstance = {
      slot: 'chest',
      kind: 'brand',
      name: 'Ceska Chest',
      brandOrSetId: 'ceska-vyroba-s-r-o',
      core: { type: 'Armor', value: 170000, isRecalibrated: true },
      minors: [
        { attribute: 'Critical Hit Chance', value: 0.06, unit: '%', isRecalibrated: true },
        { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
      ]
    };
    const res = validateGearPieceLegality(illegalPiece);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('one recalibration per item limit');
  });

  it('enforces gear set core lock and 1-minor attribute constraint', () => {
    const illegalGearSet: GearPieceInstance = {
      slot: 'kneepads',
      kind: 'gear-set',
      name: 'Striker Kneepads',
      brandOrSetId: 'striker-s-battlegear',
      core: { type: 'Armor', value: 170000, isRecalibrated: true },
      minors: [
        { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
        { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
      ]
    };
    const res = validateGearPieceLegality(illegalGearSet);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('cores are fixed'))).toBe(true);
    expect(res.errors.some(e => e.includes('only 1 minor attribute'))).toBe(true);
  });

  it('named gear locks perfect talent but permits core recalibration across colours', () => {
    const legalCourier: GearPieceInstance = {
      slot: 'backpack',
      kind: 'named',
      name: 'The Courier',
      brandOrSetId: 'habsburg-guard',
      core: { type: 'Skill Tier', value: 1, isRecalibrated: true },
      minors: [
        { attribute: 'Status Effects', value: 0.10, unit: '%' },
        { attribute: 'Skill Haste', value: 0.12, unit: '%' }
      ],
      talent: 'Perfect Creeping Death',
      isTalentRecalibrated: false
    };
    const res = validateGearPieceLegality(legalCourier);
    expect(res.valid).toBe(true);
  });
});

describe('Calculator Step 2: Worked Builds from Reference §10', () => {
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
    isExotic: true
  };

  it('Build A: Explains why Tipping Scales beats Heartbreaker on Pestilence', () => {
    // 1. Tipping Scales build: 4pc Tipping Scales (chest Sustainability + bp Snowball) + Coyote Mask + Overdogs, 6 Red Cores
    const tippingScalesGear: Record<string, GearPieceInstance> = {
      mask: {
        slot: 'mask',
        kind: 'exotic',
        name: "Coyote's Mask",
        brandOrSetId: 'coyotes-mask',
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }],
        modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
      },
      backpack: {
        slot: 'backpack',
        kind: 'gear-set',
        name: 'Tipping Scales Backpack',
        brandOrSetId: 'tipping-scales',
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }],
        modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
        talent: 'Snowball'
      },
      chest: {
        slot: 'chest',
        kind: 'gear-set',
        name: 'Tipping Scales Chest',
        brandOrSetId: 'tipping-scales',
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }],
        modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
        talent: 'Sustainability'
      },
      gloves: {
        slot: 'gloves',
        kind: 'exotic',
        name: 'Overdogs',
        brandOrSetId: 'overdogs',
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }]
      },
      holster: {
        slot: 'holster',
        kind: 'gear-set',
        name: 'Tipping Scales Holster',
        brandOrSetId: 'tipping-scales',
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
      },
      kneepads: {
        slot: 'kneepads',
        kind: 'gear-set',
        name: 'Tipping Scales Kneepads',
        brandOrSetId: 'tipping-scales',
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
      }
    };

    const watch: any = { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 };
    const context: any = { isSolo: true, distanceMeters: 30, isEnemyOutOfCover: true, throttleControlStacks: 75 };

    const tsResult = calculateLoadout(tippingScalesGear as any, pestilenceWeapon, watch, 'Gunner', context);

    // Verify 30% Mag size increased mag to 130
    expect(tsResult.groupBreakdown.magazineSizeMultiplier).toBeCloseTo(1.30);
    // Verify Throttle Control (75 stacks * 8% = 600% CHD)
    expect(tsResult.groupBreakdown.critDamage).toBeGreaterThan(6.0);
    // Verify Coyote 25m+ gave 25% CHC -> hitting 60% CHC cap
    expect(tsResult.groupBreakdown.critChance).toBe(0.60);
    // Expected bullet damage and Plague debuff
    expect(tsResult.effectiveBulletDamage).toBeGreaterThan(300000);
    expect(tsResult.pestilencePlagueTickDamage).toBeGreaterThan(0);

    // 2. Heartbreaker build comparison: 4pc Heartbreaker (Blue Cores), lower crit damage
    const heartbreakerGear: Record<string, GearPieceInstance> = {
      ...tippingScalesGear,
      backpack: {
        slot: 'backpack',
        kind: 'gear-set',
        name: 'Heartbreaker Backpack',
        brandOrSetId: 'heartbreaker',
        core: { type: 'Armor', value: 170000 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
      },
      chest: {
        slot: 'chest',
        kind: 'gear-set',
        name: 'Heartbreaker Chest',
        brandOrSetId: 'heartbreaker',
        core: { type: 'Armor', value: 170000 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }],
        talent: 'Max BPM'
      },
      holster: {
        slot: 'holster',
        kind: 'gear-set',
        name: 'Heartbreaker Holster',
        brandOrSetId: 'heartbreaker',
        core: { type: 'Armor', value: 170000 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
      },
      kneepads: {
        slot: 'kneepads',
        kind: 'gear-set',
        name: 'Heartbreaker Kneepads',
        brandOrSetId: 'heartbreaker',
        core: { type: 'Armor', value: 170000 },
        minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
      }
    };

    const hbContext: any = { isSolo: true, distanceMeters: 30, isEnemyOutOfCover: true, heartstopperStacks: 100, isEnemyPulsed: true };
    const hbResult = calculateLoadout(heartbreakerGear as any, pestilenceWeapon, watch, 'Gunner', hbContext);

    // Tipping Scales bullet damage heavily beats Heartbreaker (~1.8x to 2x higher bullet DPS) due to 600% CHD and 6 Red Cores
    expect(tsResult.effectiveBulletDamage).toBeGreaterThan(hbResult.effectiveBulletDamage * 1.5);
    // Heartbreaker has much higher total armor (4 blue cores = +680,000 armor)
    expect(hbResult.totalArmor).toBeGreaterThan(tsResult.totalArmor + 600000);
  });

  it('Build B vs B2: Explains why Symptom Aggravator is wrong in a Group but optimal Solo', () => {
    const soloGear: Record<string, GearPieceInstance> = {
      mask: { slot: 'mask', kind: 'exotic', name: 'Vile', brandOrSetId: 'vile', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Hazard Protection', value: 0.10, unit: '%' }] },
      chest: { slot: 'chest', kind: 'gear-set', name: 'Eclipse Chest', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Proliferation' },
      backpack: { slot: 'backpack', kind: 'gear-set', name: 'Eclipse Backpack', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Symptom Aggravator' },
      gloves: { slot: 'gloves', kind: 'gear-set', name: 'Eclipse Gloves', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
      holster: { slot: 'holster', kind: 'gear-set', name: 'Eclipse Holster', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
      kneepads: { slot: 'kneepads', kind: 'brand', name: 'Electrique Kneepads', brandOrSetId: 'electrique', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }] }
    };

    const soloResult = calculateLoadout(soloGear as any, pestilenceWeapon, {}, 'Technician', { isSolo: true, distanceMeters: 15, isEnemyStatusAffected: true });

    const hasSymptomAmp = soloResult.groupBreakdown.amplifiers.some(a => a.source.includes('Symptom Aggravator') && a.factor === 1.30);
    expect(hasSymptomAmp).toBe(true);

    const groupGear: Record<string, GearPieceInstance> = {
      ...soloGear,
      backpack: {
        slot: 'backpack',
        kind: 'named',
        name: 'The Courier',
        brandOrSetId: 'habsburg-guard',
        core: { type: 'Skill Tier', value: 1, isRecalibrated: true },
        minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }],
        talent: 'Perfect Creeping Death'
      },
      kneepads: {
        slot: 'kneepads',
        kind: 'gear-set',
        name: 'Eclipse Kneepads',
        brandOrSetId: 'eclipse-protocol',
        core: { type: 'Skill Tier', value: 1 },
        minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }]
      }
    };

    const groupResult = calculateLoadout(groupGear as any, pestilenceWeapon, {}, 'Technician', { isSolo: false, distanceMeters: 15, isEnemyStatusAffected: true });
    expect(groupResult.skillTier).toBe(6);
    expect(groupResult.itemisationValid).toBe(true);
  });

  it('Build D: True Patriot debuff provides a group-wide 30% amplifier', () => {
    const tpRed = calculateTruePatriotRedFlag(true);
    expect(tpRed.ampValue).toBe(0.30);
    expect(tpRed.factor).toBe(1.30);
  });
});
