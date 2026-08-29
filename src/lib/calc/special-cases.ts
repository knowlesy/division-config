/**
 * Special calculation cases from Reference §3.
 * Each exception has its own tested pure function.
 */

/**
 * Skill Efficiency grants +1% of every yellow minor per point.
 */
export function calculateSkillEfficiency(points: number) {
  const bonus = points * 0.01;
  return {
    skillDamage: bonus,
    skillHaste: bonus,
    skillDuration: bonus,
    skillHealth: bonus,
    repairSkills: bonus,
    statusEffects: bonus
  };
}

/**
 * Heartbreaker Heartstopper multiplier: (1 + 0.011 * n)
 * n max 50 (or 100 with chest talent Max BPM)
 */
export function calculateHeartstopper(stacks: number, withChest: boolean = false) {
  const maxStacks = withChest ? 100 : 50;
  const n = Math.max(0, Math.min(stacks, maxStacks));
  const factor = 1 + 0.011 * n;
  return {
    stacks: n,
    maxStacks,
    factor,
    bonusArmourPctPerStack: withChest ? 0.01 : 0.01 // chest increases max stacks, bp increases armor per stack to 2%
  };
}

/**
 * Striker's Gamble amplifier: (1 + 0.0065 * n) without backpack, (1 + 0.009 * n) with backpack.
 * n max 100 (or 200 with chest talent Press the Advantage)
 */
export function calculateStrikerGamble(stacks: number, withBackpack: boolean = false, withChest: boolean = false) {
  const maxStacks = withChest ? 200 : 100;
  const perStack = withBackpack ? 0.009 : 0.0065;
  const n = Math.max(0, Math.min(stacks, maxStacks));
  const factor = 1 + perStack * n;
  return {
    stacks: n,
    maxStacks,
    perStack,
    factor,
    confidence: withBackpack ? '[?]' : '[PDF]',
    note: 'In-game text calls this total weapon damage, but it functions as a true amplifier.'
  };
}

/**
 * Ortiz Exuro Heatstroke amplifier: +40% amplified damage to enemies burned by the turret prototype.
 */
export function calculateOrtizHeatstroke(burnedByTurret: boolean = true) {
  return {
    factor: burnedByTurret ? 1.40 : 1.00,
    confidence: '[PDF]',
    note: 'In-game text calls this weapon damage, but it functions as an all-damage amplifier.'
  };
}

/**
 * Hunter's Fury Apex Predator:
 * - Enemies within 15m take +20% amplified damage.
 * - On-kill stacks are self-multiplicative: 1.05^n, n = 0..5 (up to ~1.276x).
 */
export function calculateHuntersFury(within15m: boolean, killStacks: number = 0) {
  const n = Math.max(0, Math.min(killStacks, 5));
  const proximityAmp = within15m ? 1.20 : 1.00;
  const killAmp = Math.pow(1.05, n);
  const totalFactor = proximityAmp * killAmp;
  return {
    within15m,
    killStacks: n,
    proximityAmp,
    killAmp,
    totalFactor
  };
}

/**
 * Fafnir Exotic Shotgun Dragon's Breath amplifier:
 * Weapon Damage amplified by 50% of your Status Effect bonus.
 */
export function calculateFafnirAmplifier(statusEffectBonusPct: number) {
  const ampValue = 0.5 * Math.max(0, statusEffectBonusPct);
  return {
    ampValue,
    factor: 1 + ampValue,
    confidence: '[UBI]',
    notes: 'Exact term behavior flagged [?]. Subject to status-effect diminishing returns.'
  };
}

/**
 * True Patriot Red Flag debuff:
 * Amplifies enemy damage taken by +15% (or +30% with backpack Patriotic Boost) from ALL sources.
 */
export function calculateTruePatriotRedFlag(withBackpack: boolean = false) {
  const amp = withBackpack ? 0.30 : 0.15;
  return {
    factor: 1 + amp,
    ampValue: amp,
    confidence: '[PDF]',
    note: 'Beneficial amplifier applied to target; scales damage of all teammates in group.'
  };
}

/**
 * Pestilence Plague of the Outcasts debuff:
 * Hits apply debuff dealing 100% weapon damage over 10s per stack, max 50 stacks.
 * Transfers to nearest enemy within 25m on death.
 *
 * Scaling:
 * - Scales directly with Weapon Damage and Amplifiers.
 * - Does NOT crit (0% crit chance / 0% crit damage contribution).
 */
export function calculatePestilencePlague(
  baseWeaponDamage: number,
  weaponDamageSum: number,
  totalWeaponDamageSum: number,
  amplifierMultiplier: number,
  stacks: number = 50
) {
  const n = Math.max(0, Math.min(stacks, 50));
  // Base single bullet non-crit hit damage
  const singleShotBase = baseWeaponDamage * (1 + weaponDamageSum) * (1 + totalWeaponDamageSum) * amplifierMultiplier;
  // 100% weapon damage over 10s per stack = 10% weapon damage per second per stack (10 ticks over 10s)
  const totalDebuffDamage10s = singleShotBase * n;
  const dpsTick = totalDebuffDamage10s / 10; // Tick damage per second

  return {
    stacks: n,
    singleShotBase,
    totalDebuffDamage10s,
    dpsTick,
    doesCrit: false,
    confidence: '[PDF]'
  };
}
