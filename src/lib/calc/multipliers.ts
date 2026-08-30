import { BonusTerm, MultiplierGroupBreakdown, MultiplierGroupName } from './types';

export const BASE_CRIT_CHANCE = 0.00;
export const BASE_CRIT_DAMAGE = 0.25; // 25% base CHD in Division 2
export const MAX_CRIT_CHANCE = 0.60; // 60% hard cap

/**
 * Aggregate bonuses by multiplier group and compute final terms.
 */
export function calculateMultiplierBreakdown(
  bonuses: BonusTerm[],
  innateHsdMultiplier: number = 0.55
): MultiplierGroupBreakdown {
  let wdSum = 0;
  let twdSum = 0;
  let chcSum = BASE_CRIT_CHANCE;
  let chdSum = BASE_CRIT_DAMAGE;
  let hsdSum = innateHsdMultiplier;
  let sdSum = 0;
  let tsdSum = 0;
  let srSum = 0;
  let seSum = 0;
  let hazardSum = 0;
  let rofSum = 0;
  let magSum = 0;
  let reloadSum = 0;
  let threatSum = 0;
  let allyDmgSum = 0;
  let allyMitSum = 0;
  let enemyDebuffMultiplier = 1.0;

  const amplifiers: Array<{ source: string; factor: number; condition?: string; beneficiary?: any }> = [];

  for (const b of bonuses) {
    const beneficiary = b.beneficiary || 'self';

    // Track ally and enemy debuff contributions
    if (beneficiary === 'ally') {
      if (b.group === 'Weapon Damage' || b.group === 'Total Weapon Damage' || b.group === 'Skill Damage' || b.group === 'Amplifier' || b.group === 'Critical Hit Chance' || b.group === 'Critical Hit Damage') {
        allyDmgSum += b.value;
      } else {
        allyMitSum += b.value;
      }
    } else if (beneficiary === 'enemy-debuff') {
      if (b.group === 'Amplifier') {
        enemyDebuffMultiplier *= (1 + b.value);
      }
    }

    switch (b.group) {
      case 'Weapon Damage':
        wdSum += b.value;
        break;
      case 'Total Weapon Damage':
        twdSum += b.value;
        break;
      case 'Critical Hit Chance':
        chcSum += b.value;
        break;
      case 'Critical Hit Damage':
        chdSum += b.value;
        break;
      case 'Headshot Damage':
        hsdSum += b.value;
        break;
      case 'Skill Damage':
        sdSum += b.value;
        break;
      case 'Total Skill Damage':
        tsdSum += b.value;
        break;
      case 'Skill Repair':
        srSum += b.value;
        break;
      case 'Status Effects':
        seSum += b.value;
        break;
      case 'Rate of Fire':
        rofSum += b.value;
        break;
      case 'Amplifier':
        amplifiers.push({
          source: b.source,
          factor: 1 + b.value,
          condition: b.condition,
          beneficiary
        });
        break;
      case 'Utility':
        const srcLower = b.source.toLowerCase();
        if (srcLower.includes('mag size') || srcLower.includes('magazine')) magSum += b.value;
        if (srcLower.includes('reload')) reloadSum += b.value;
        if (srcLower.includes('hazard')) hazardSum += b.value;
        if (srcLower.includes('increased threat') || srcLower.includes('threat')) {
          threatSum += b.value;
        } else if (srcLower.includes('reduced threat')) {
          threatSum -= b.value;
        }
        break;
    }
  }

  // Hard cap CHC at 60%
  const finalChc = Math.min(MAX_CRIT_CHANCE, Math.max(0, chcSum));
  const effectiveCritFactor = 1 + finalChc * chdSum;

  let totalAmplifierMultiplier = 1.0;
  for (const amp of amplifiers) {
    totalAmplifierMultiplier *= amp.factor;
  }

  const threatMultiplier = Math.max(0.1, 1.0 + threatSum);

  return {
    weaponDamageSum: wdSum,
    totalWeaponDamageSum: twdSum,
    critChance: finalChc,
    critDamage: chdSum,
    effectiveCritFactor,
    headshotDamage: hsdSum,
    skillDamageSum: sdSum,
    totalSkillDamageSum: tsdSum,
    skillRepairSum: srSum,
    statusEffectsSum: seSum,
    hazardProtectionSum: Math.min(1.0, hazardSum),
    rateOfFireMultiplier: 1 + rofSum,
    magazineSizeMultiplier: 1 + magSum,
    reloadSpeedMultiplier: 1 + reloadSum,
    threatMultiplier,
    amplifiers,
    totalAmplifierMultiplier,
    allyDamageBonusSum: allyDmgSum,
    allyMitigationBonusSum: allyMitSum,
    enemyDebuffMultiplier
  };
}

/**
 * Calculate expected damage per bullet given base weapon damage and group breakdown.
 */
export function calculateDamageMetrics(
  baseDamage: number,
  breakdown: MultiplierGroupBreakdown,
  baseRpm: number = 600,
  baseMagSize: number = 30,
  baseReloadSecs: number = 2.0
) {
  const wdTerm = 1 + breakdown.weaponDamageSum;
  const twdTerm = 1 + breakdown.totalWeaponDamageSum;
  const ampTerm = breakdown.totalAmplifierMultiplier;

  // Base bullet damage without crit or headshot
  const baseHit = baseDamage * wdTerm * twdTerm * ampTerm;

  // Crit hit damage
  const critHit = baseDamage * wdTerm * twdTerm * (1 + breakdown.critDamage) * ampTerm;

  // Headshot non-crit hit damage
  const headshotHit = baseDamage * wdTerm * twdTerm * (1 + breakdown.headshotDamage) * ampTerm;

  // Headshot crit hit damage
  const headshotCrit = baseDamage * wdTerm * twdTerm * (1 + breakdown.headshotDamage + breakdown.critDamage) * ampTerm;

  // Expected average hit per shot factoring in CHC
  const expectedHit = baseDamage * wdTerm * twdTerm * breakdown.effectiveCritFactor * ampTerm;

  // RPM and DPS
  const effectiveRpm = baseRpm * breakdown.rateOfFireMultiplier;
  const rps = effectiveRpm / 60;
  const effectiveMagSize = Math.floor(baseMagSize * breakdown.magazineSizeMultiplier);
  const effectiveReloadTime = baseReloadSecs / breakdown.reloadSpeedMultiplier;

  const burstDps = rps * expectedHit;

  const timeToEmptyMag = effectiveMagSize / rps;
  const cycleTime = timeToEmptyMag + effectiveReloadTime;
  const sustainedDps = (effectiveMagSize * expectedHit) / cycleTime;

  return {
    baseHit,
    critHit,
    headshotHit,
    headshotCrit,
    expectedHit,
    effectiveRpm,
    effectiveMagSize,
    effectiveReloadTime,
    burstDps,
    sustainedDps
  };
}
