import { GearSlot, GearPieceInstance, WeaponInstance, ComputedLoadoutStats } from '../calc/types';
import { SolvedMinorPlan } from './minor-assignment';
import { ArchetypeDefinition } from './archetypes';

export interface ShoppingListItem {
  slot: GearSlot;
  itemName: string;
  kind: 'brand' | 'gear-set' | 'named' | 'exotic' | 'improvised';
  brandOrSetName: string;
  source: string;
  coreType: string;
  isCoreRecalibrated: boolean;
  minors: Array<{ attribute: string; valueFormatted: string; isLocked?: boolean }>;
  mod: { attribute: string; valueFormatted: string } | null;
  talent: { name: string; isLocked: boolean; isRecalibrated: boolean } | null;
  recalibrationInstruction: string;
}

export interface WeaponShoppingItem {
  slot: 'primary' | 'secondary' | 'sidearm';
  name: string;
  category: string;
  source: string;
  coreAttribute: string;
  minorAttribute: string;
  talent: string;
  isExotic?: boolean;
  recalibrationInstruction: string;
}

export interface SpecializationRecommendation {
  name: string;
  perks: string[];
  rationale: string;
}

export interface TwoTierGapAnalysis {
  scoreDeltaPct: number;
  scoreDeltaHeadline: string;
  godRollPiecesNeeded: number;
  recalibrationsRequired: number;
  libraryBanksRequired: string[];
  perPieceDiff: Array<{
    slot: GearSlot;
    itemName: string;
    practicalSummary: string;
    ceilingSummary: string;
    gapImpact: string;
  }>;
}

export interface TwoTierResult {
  archetype: ArchetypeDefinition;
  recommendedSpecialization: SpecializationRecommendation;
  practical: {
    gear: Record<GearSlot, GearPieceInstance>;
    weapons: WeaponShoppingItem[];
    stats: ComputedLoadoutStats;
    score: number;
    shoppingList: ShoppingListItem[];
    runnerUp?: { name: string; score: number; scoreDeltaPct: number };
  };
  ceiling: {
    gear: Record<GearSlot, GearPieceInstance>;
    weapons: WeaponShoppingItem[];
    stats: ComputedLoadoutStats;
    score: number;
    shoppingList: ShoppingListItem[];
    runnerUp?: { name: string; score: number; scoreDeltaPct: number };
  };
  gap: TwoTierGapAnalysis;
  warnings: string[];
  confidenceFlags: string[];
  floorsSatisfied: boolean;
  shortfallReason?: string;
}

/**
 * Generates the recalibration shopping list items for a tier.
 */
export function generateShoppingList(
  gear: Record<GearSlot, GearPieceInstance>,
  minorPlan: SolvedMinorPlan,
  dataSourcesMap: Map<string, string>
): ShoppingListItem[] {
  const slots: GearSlot[] = ['mask', 'backpack', 'chest', 'gloves', 'holster', 'kneepads'];
  const items: ShoppingListItem[] = [];

  for (const slot of slots) {
    const piece = gear[slot];
    if (!piece) continue;

    const source = dataSourcesMap.get(piece.brandOrSetId) || 'LZ / Targeted Loot / Countdown';
    const minors = (minorPlan.minorsPerSlot[slot] || []).map(m => ({
      attribute: m.attribute,
      valueFormatted: m.unit === '%' ? `${(m.value * 100).toFixed(1)}%` : `${m.value.toLocaleString()}${m.unit}`,
      isLocked: m.isLocked
    }));

    const mod = minorPlan.modsPerSlot[slot]
      ? {
          attribute: minorPlan.modsPerSlot[slot]!.attribute,
          valueFormatted: minorPlan.modsPerSlot[slot]!.unit === '%'
            ? `${(minorPlan.modsPerSlot[slot]!.value * 100).toFixed(1)}%`
            : `${minorPlan.modsPerSlot[slot]!.value.toLocaleString()}${minorPlan.modsPerSlot[slot]!.unit}`
        }
      : null;

    let talentInfo: { name: string; isLocked: boolean; isRecalibrated: boolean } | null = null;
    if (piece.talent) {
      const isLocked = piece.kind === 'gear-set' || piece.kind === 'named' || piece.kind === 'exotic';
      talentInfo = {
        name: piece.talent,
        isLocked,
        isRecalibrated: !isLocked && (piece.isTalentRecalibrated || false)
      };
    }

    const recalDecision = minorPlan.recalibrationPerSlot[slot]?.detail || 'Keep natural roll';

    items.push({
      slot,
      itemName: piece.name,
      kind: piece.kind,
      brandOrSetName: piece.brandOrSetId,
      source,
      coreType: piece.core.type,
      isCoreRecalibrated: piece.core.isRecalibrated || false,
      minors,
      mod,
      talent: talentInfo,
      recalibrationInstruction: recalDecision
    });
  }

  return items;
}

import namedWeaponsData from '../../../data/weapons-named.json';
import { calculateLoadout } from '../calc/loadout-calculator';
import { CombatContext, WatchStats } from '../calc/types';

/**
 * Generates recommended weapons matching the archetype objective and active weapon dynamically from /data/
 * Evaluates candidates through calculateLoadout and the archetype scoring function.
 */
export function generateRecommendedWeapons(
  archetype: ArchetypeDefinition,
  activeWeapon: WeaponInstance,
  tier: 1 | 2,
  gear?: Record<GearSlot, GearPieceInstance>,
  watch: WatchStats = {},
  specialization: string = 'Gunner',
  context: CombatContext = { isSolo: true, distanceMeters: 15 }
): WeaponShoppingItem[] {
  const dtOocRoll = tier === 2 ? '10.0%' : '8.5%';

  // 1. Primary Weapon
  const primaryItem: WeaponShoppingItem = {
    slot: 'primary',
    name: activeWeapon.name,
    category: activeWeapon.category,
    source: activeWeapon.isExotic ? 'Exotic Cache / Targeted Loot' : 'Targeted Loot / Crafting Bench',
    coreAttribute: activeWeapon.coreAttribute ? `${activeWeapon.coreAttribute.type} (${tier === 2 ? '15.0%' : '12.5%'})` : 'Weapon Damage (15.0%)',
    minorAttribute: `Damage to Target Out of Cover (${dtOocRoll})`,
    talent: activeWeapon.talent || 'Standard Weapon Talent',
    isExotic: activeWeapon.isExotic,
    recalibrationInstruction: activeWeapon.isExotic
      ? 'Optimise all three attributes at the Tinkering Station to maximum rolls.'
      : `Recalibrate 3rd attribute to Damage to Target Out of Cover (${dtOocRoll}); farm or craft desired talent.`
  };

  const evalGear = gear || {
    mask: { slot: 'mask', kind: 'brand', name: 'Mask', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    backpack: { slot: 'backpack', kind: 'brand', name: 'BP', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    chest: { slot: 'chest', kind: 'brand', name: 'Chest', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    gloves: { slot: 'gloves', kind: 'brand', name: 'Gloves', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    holster: { slot: 'holster', kind: 'brand', name: 'Holster', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    kneepads: { slot: 'kneepads', kind: 'brand', name: 'Knees', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] }
  };

  // 2. Dynamic Secondary Weapon Selection: Evaluates all weapons (including Pistols) via calculateLoadout
  const allowsExoticSecondary = !activeWeapon.isExotic;
  const secondaryCandidates = (namedWeaponsData as any[]).filter(w => {
    if (w.isExotic && !allowsExoticSecondary) return false;
    return true;
  });

  let bestSecondary: any = null;
  let bestSecondaryScore = -Infinity;

  for (const cand of secondaryCandidates) {
    const testWeapon: WeaponInstance = {
      slot: 'secondary',
      name: cand.name,
      category: cand.category,
      baseDamage: cand.baseDamage || 50000,
      rpm: cand.rpm || 600,
      magSize: cand.magSize || 30,
      reloadTime: cand.reloadTime || 2.0,
      innateHsd: cand.category === 'Marksman Rifle' ? 1.37 : (cand.category === 'Rifle' ? 0.60 : 0.55),
      coreAttribute: { type: `${cand.category} Damage`, value: tier === 2 ? 0.15 : 0.125 },
      secondaryCoreAttribute: { type: 'Damage to Armor', value: 0.12 },
      minorAttribute: { attribute: 'Damage to Target Out of Cover', value: tier === 2 ? 0.10 : 0.085, unit: '%' },
      talent: cand.talentOrPerk ? cand.talentOrPerk.split('\n')[0] : undefined,
      isExotic: !!cand.isExotic
    };

    const stats = calculateLoadout(evalGear, testWeapon, watch, specialization, context);
    const score = archetype.score(stats, context);

    if (score > bestSecondaryScore) {
      bestSecondaryScore = score;
      bestSecondary = cand;
    }
  }

  const resolvedSecondary = bestSecondary || {
    name: 'Custom M870 (Unscored Default)',
    category: 'Shotgun',
    dropLocation: 'Targeted Loot',
    isExotic: false,
    talentOrPerk: 'In Sync / Preservation'
  };

  const isSecExotic = !!resolvedSecondary.isExotic;
  const secondaryItem: WeaponShoppingItem = {
    slot: 'secondary',
    name: resolvedSecondary.name,
    category: resolvedSecondary.category,
    source: isSecExotic ? 'Exotic Cache / Targeted Loot' : (resolvedSecondary.dropLocation || 'Named Item / Targeted Loot'),
    coreAttribute: `${resolvedSecondary.category} Damage (${tier === 2 ? '15.0%' : '12.5%'}) · Damage to Armor (12.0%)`,
    minorAttribute: `Damage to Target Out of Cover (${dtOocRoll})`,
    talent: resolvedSecondary.talentOrPerk ? resolvedSecondary.talentOrPerk.split('\n')[0] : 'Standard Weapon Talent',
    isExotic: isSecExotic,
    recalibrationInstruction: isSecExotic
      ? 'Optimise attributes at Tinkering Station; Exotic talent is locked.'
      : `Recalibrate 3rd minor attribute to DtOOC (${dtOocRoll}); Perfect talent is locked.`
  };

  // 3. Dynamic Sidearm Selection: Evaluates all Pistol candidates via calculateLoadout
  const allowsExoticSidearm = !activeWeapon.isExotic && !isSecExotic;
  const sidearmCandidates = (namedWeaponsData as any[]).filter(
    w => w.category === 'Pistol' && (!w.isExotic || allowsExoticSidearm)
  );

  let bestSidearm: any = null;
  let bestSidearmScore = -Infinity;

  for (const cand of sidearmCandidates) {
    const testSidearm: WeaponInstance = {
      slot: 'sidearm',
      name: cand.name,
      category: 'Pistol',
      baseDamage: cand.baseDamage || 40000,
      rpm: cand.rpm || 300,
      magSize: cand.magSize || 15,
      reloadTime: cand.reloadTime || 1.8,
      innateHsd: 1.0,
      coreAttribute: { type: 'Pistol Damage', value: tier === 2 ? 0.15 : 0.125 },
      secondaryCoreAttribute: { type: 'Damage to Armor', value: 0.10 },
      minorAttribute: { attribute: cand.minor || 'Damage to Target Out of Cover', value: tier === 2 ? 0.10 : 0.085, unit: '%' },
      talent: cand.talentOrPerk ? cand.talentOrPerk.split('\n')[0] : undefined,
      isExotic: !!cand.isExotic
    };

    const stats = calculateLoadout(evalGear, testSidearm, watch, specialization, context);
    const score = archetype.score(stats, context);

    if (score > bestSidearmScore) {
      bestSidearmScore = score;
      bestSidearm = cand;
    }
  }

  const resolvedSidearm = bestSidearm || {
    name: 'Custom PF45 (Unscored Default)',
    category: 'Pistol',
    dropLocation: 'Targeted Loot',
    isExotic: false,
    talentOrPerk: 'In Sync / Reformation'
  };

  const isSideExotic = !!resolvedSidearm.isExotic;
  const sidearmItem: WeaponShoppingItem = {
    slot: 'sidearm',
    name: resolvedSidearm.name,
    category: 'Pistol',
    source: isSideExotic ? 'Exotic Cache / Targeted Loot' : (resolvedSidearm.dropLocation || 'Named Item / Targeted Loot'),
    coreAttribute: `Pistol Damage (${tier === 2 ? '15.0%' : '12.5%'})`,
    minorAttribute: resolvedSidearm.minor || `Damage to Target Out of Cover (${dtOocRoll})`,
    talent: resolvedSidearm.talentOrPerk ? resolvedSidearm.talentOrPerk.split('\n')[0] : 'Standard Pistol Talent',
    isExotic: isSideExotic,
    recalibrationInstruction: isSideExotic
      ? 'Optimise attributes at Tinkering Station; Exotic talent is locked.'
      : `Recalibrate talent or minor attribute; Perfect attributes/talents are locked.`
  };

  return [primaryItem, secondaryItem, sidearmItem];
}

/**
 * Returns the optimal Specialization recommendation for the chosen archetype.
 */
export function getRecommendedSpecialization(archetype: ArchetypeDefinition): SpecializationRecommendation {
  if (archetype.id === 'sustained_dps') {
    return {
      name: 'Gunner',
      perks: ['+10% Reload Speed', '+50-round Large Pouch (LMG)', '+10% Armor on Kill', 'Banshee Confuse Pulse'],
      rationale: 'Maximises sustained uptime through fast cycle reloads, high magazine capacities, and ammo generation.'
    };
  } else if (archetype.id === 'precision_dps') {
    return {
      name: 'Sharpshooter',
      perks: ['+15% Headshot Damage', '+15% Weapon Handling in Cover', 'Tactical Link (+10% Headshot for team)', 'Flashbang Grenade'],
      rationale: 'Maximises burst headshot multipliers and provides instant weapon handling stability.'
    };
  } else if (archetype.id === 'skill_damage') {
    return {
      name: 'Technician',
      perks: ['+1 Skill Tier (Free Blue/Red core elsewhere)', '+10% Skill Damage', 'Artificer Hive Support', 'EMP Grenade'],
      rationale: 'Directly scales destructive skill damage and grants a free extra core slot.'
    };
  } else if (archetype.id === 'glass_medic' || archetype.id === 'force_multiplier') {
    return {
      name: 'Survivalist',
      perks: ['+15% Outgoing Skill Repair', '+10% Group Damage Amplifier vs Status Targets', 'Incendiary Grenade', 'Crossbow Armor Break'],
      rationale: 'Highest possible team healing output combined with squad-wide damage amplification.'
    };
  } else if (archetype.id === 'field_medic') {
    return {
      name: 'Technician',
      perks: ['+1 Skill Tier (Allows +170k Blue Core without losing ST6)', '+12% Skill Repair', 'Artificer Hive Support'],
      rationale: 'Provides the free Skill Tier needed to invest an extra core into Armour for field survivability.'
    };
  } else if (archetype.id === 'bulwark' || archetype.id === 'lightning_rod') {
    return {
      name: 'Gunner (or Firewall)',
      perks: ['+10% Armor on Kill', 'Banshee Pulse (Crowd Control / Threat)', 'Supply Line Ammo Gen', 'Emergency Bonus Armor'],
      rationale: 'Sustains huge frontline armor pools with armor-on-kill and heavy crowd control threat.'
    };
  } else if (archetype.id === 'lockdown') {
    return {
      name: 'Survivalist (or Technician)',
      perks: ['+10% Group Damage Amp vs Status-Affected Targets', 'Incendiary Grenades (Area Deny)', 'Tactical Link'],
      rationale: 'Amplifies all team weapon and skill damage against targets caught in your crowd control status effects.'
    };
  } else {
    return {
      name: 'Demolitionist',
      perks: ['Crisis Response (Auto-reload on armor break)', 'Ignore 1 explosion/rupture every 60s', '+5% DtOOC to Allies'],
      rationale: 'Provides explosion resilience and passive team damage amplifiers.'
    };
  }
}

/**
 * Computes the gap between Tier 1 Practical and Tier 2 Ceiling.
 */
export function computeTwoTierGap(
  practicalStats: ComputedLoadoutStats,
  practicalScore: number,
  ceilingStats: ComputedLoadoutStats,
  ceilingScore: number,
  practicalGear: Record<GearSlot, GearPieceInstance>,
  ceilingGear: Record<GearSlot, GearPieceInstance>,
  archetype: ArchetypeDefinition
): TwoTierGapAnalysis {
  const scoreDeltaPct = practicalScore > 0 ? ((ceilingScore - practicalScore) / practicalScore) * 100 : 0;

  let scoreDeltaHeadline = `+${scoreDeltaPct.toFixed(1)}% ceiling improvement`;
  if (archetype.id.includes('medic')) {
    const repairDelta = ((ceilingStats.groupBreakdown.skillRepairSum - practicalStats.groupBreakdown.skillRepairSum) / (practicalStats.groupBreakdown.skillRepairSum || 1)) * 100;
    scoreDeltaHeadline = `+${Math.max(0, repairDelta).toFixed(1)}% repair output`;
  } else if (archetype.id.includes('dps')) {
    const dpsDelta = ((ceilingStats.sustainedDps - practicalStats.sustainedDps) / (practicalStats.sustainedDps || 1)) * 100;
    scoreDeltaHeadline = `+${Math.max(0, dpsDelta).toFixed(1)}% sustained DPS`;
  } else if (archetype.id.includes('bulwark') || archetype.id.includes('rod')) {
    const ehpDelta = ((ceilingStats.effectiveHealth - practicalStats.effectiveHealth) / (practicalStats.effectiveHealth || 1)) * 100;
    scoreDeltaHeadline = `+${Math.max(0, ehpDelta).toFixed(1)}% effective health`;
  }

  const slots: GearSlot[] = ['mask', 'backpack', 'chest', 'gloves', 'holster', 'kneepads'];
  let godRollPiecesNeeded = 0;
  let recalibrationsRequired = 0;
  const libraryBanks = new Set<string>();
  const perPieceDiff: TwoTierGapAnalysis['perPieceDiff'] = [];

  for (const slot of slots) {
    const pPiece = practicalGear[slot];
    const cPiece = ceilingGear[slot];
    if (!pPiece || !cPiece) continue;

    godRollPiecesNeeded++;
    if (cPiece.core.isRecalibrated) {
      recalibrationsRequired++;
      libraryBanks.add(`${cPiece.core.type} (${slot} Core)`);
    }

    perPieceDiff.push({
      slot,
      itemName: cPiece.name,
      practicalSummary: `Mid-range minor rolls (~75% max)`,
      ceilingSummary: `100% max roll attributes + free core recal`,
      gapImpact: `+${(scoreDeltaPct / 6).toFixed(1)}% marginal contribution`
    });
  }

  return {
    scoreDeltaPct,
    scoreDeltaHeadline,
    godRollPiecesNeeded,
    recalibrationsRequired,
    libraryBanksRequired: Array.from(libraryBanks),
    perPieceDiff
  };
}

/**
 * Determines the number of free (re-rollable/customizable) minor attribute slots on a gear piece.
 * - Gear Set pieces carry 1 minor slot.
 * - Named pieces in non-talent slots (mask, gloves, holster, kneepads) have 1 locked Perfect attribute + 1 free minor slot.
 * - High-End / Brand pieces and Named Chest/Backpacks have 2 free minor slots.
 */
export function getFreeMinorsCount(piece: { kind: string; slot: string }): 1 | 2 {
  if (piece.kind === 'gear-set') {
    return 1;
  }
  if (piece.kind === 'named' && piece.slot !== 'chest' && piece.slot !== 'backpack') {
    return 1; // 1 locked perfect minor + 1 free minor
  }
  return 2;
}

/**
 * Computes exact combinatoric drop probability for gear pieces
 * drawn from a standard pool of N = 12 minor attributes under a uniform-draw assumption [?].
 *
 * @param desiredMinorsCount Number of specific minor attributes the build requires (1 or 2).
 * @param isCoreRecalibrated True if recalibration is committed to the Core; False if Core is kept and recal is free for a Minor.
 * @param freeSlotsCount Number of free minor attribute slots on the piece (1 for Gear Sets & Named non-talent pieces; 2 for High-End).
 */
export function computeFarmingProbability(
  desiredMinorsCount: 1 | 2,
  isCoreRecalibrated: boolean,
  freeSlotsCount: 1 | 2 = 2
): { probability: number; expectedDrops: number; confidence: string } {
  // Defensive validation: impossible to require more desired minors than available free slots
  if (desiredMinorsCount > freeSlotsCount) {
    return { probability: 0, expectedDrops: Infinity, confidence: '[?]' };
  }

  // Standard pool of 12 minor attributes in Division 2
  const N = 12;

  // Single free minor slot (Gear Sets, Named non-chest/backpack pieces)
  if (freeSlotsCount === 1) {
    if (isCoreRecalibrated) {
      // Must drop the 1 desired minor naturally: 1 out of 12
      const prob = 1 / N; // ~8.333%
      return { probability: prob, expectedDrops: N, confidence: '[?]' }; // 12 drops
    } else {
      // Freed recalibration: guaranteed via recalibration bench
      return { probability: 1.0, expectedDrops: 1, confidence: '[?]' }; // 1 drop
    }
  }

  // Two free minor slots (Brand / High-End / Named Chest & Backpack)
  // Total distinct unordered pairs drawn from 12 minors = C(12,2) = 66
  const TOTAL_PAIRS = 66;

  if (desiredMinorsCount === 2) {
    if (isCoreRecalibrated) {
      // Both minors must drop correct: exactly 1 qualifying pair out of 66
      const prob = 1 / TOTAL_PAIRS; // ~1.515%
      return { probability: prob, expectedDrops: TOTAL_PAIRS, confidence: '[?]' }; // 66 drops
    } else {
      // Freed recalibration: at least one minor must drop correct
      // Non-qualifying pairs (neither desired) = C(10,2) = 45
      // Qualifying pairs = 66 - 45 = 21
      const prob = 21 / TOTAL_PAIRS; // ~31.818%
      return { probability: prob, expectedDrops: TOTAL_PAIRS / 21, confidence: '[?]' }; // ~3.14 drops
    }
  } else {
    // 1 desired minor on a 2-slot piece
    if (isCoreRecalibrated) {
      // Must drop naturally: 11 pairs out of 66 contain the desired minor
      const prob = 11 / TOTAL_PAIRS; // 1/6 (~16.667%)
      return { probability: prob, expectedDrops: 6, confidence: '[?]' }; // 6 drops
    } else {
      // Guaranteed via recalibration bench
      return { probability: 1.0, expectedDrops: 1, confidence: '[?]' }; // 1 drop
    }
  }
}
