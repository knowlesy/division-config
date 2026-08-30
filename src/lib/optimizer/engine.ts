import {
  GearSlot,
  GearPieceInstance,
  WeaponInstance,
  WatchStats,
  CombatContext,
  CoreType
} from '../calc/types';
import { calculateLoadout } from '../calc/loadout-calculator';
import { ALL_GEAR_SLOTS } from '../calc/slot-legality';
import { ARCHETYPES, ArchetypeDefinition, ArchetypeFloors } from './archetypes';
import { solveMinorAttributes } from './minor-assignment';
import {
  computeTwoTierGap,
  generateShoppingList,
  generateRecommendedWeapons,
  getRecommendedSpecialization,
  TwoTierResult
} from './cost-model';

// Load static datasets
import brandSetsData from '../../../data/brand-sets.json';
import gearSetsData from '../../../data/gear-sets.json';
import gearNamedData from '../../../data/gear-named.json';

const brandSets = brandSetsData as any[];
const gearSets = gearSetsData as any[];
const namedGear = gearNamedData as any[];

const dataSourcesMap = new Map<string, string>();
for (const b of brandSets) dataSourcesMap.set(b.id, 'Targeted Loot (Brand) / Countdown');
for (const s of gearSets) dataSourcesMap.set(s.id, s.dropLocations || 'Targeted Loot (Gear Set) / Countdown');
for (const g of namedGear) dataSourcesMap.set(g.id, g.source || 'Targeted Loot / LZ');

export interface OptimizerOptions {
  archetypeId: string;
  customFloors?: ArchetypeFloors;
  watch?: WatchStats;
  specialization?: string;
  context?: CombatContext;
}

/**
 * Optimizes gear dynamically over /data/ for the specified archetype in two tiers:
 * - Tier 1: Practical (realistic drops, strict 1-recal budget)
 * - Tier 2: Ceiling (max rolls, freed core recalibration)
 */
export function runTwoTierOptimization(
  activeWeapon: WeaponInstance,
  options: OptimizerOptions
): TwoTierResult {
  const archetype = ARCHETYPES[options.archetypeId] || ARCHETYPES['sustained_dps'];
  const floors: ArchetypeFloors = { ...archetype.defaultFloors, ...(options.customFloors || {}) };
  const watch = options.watch || { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 };
  const spec = options.specialization || 'Gunner';
  const context = options.context || { isSolo: true, distanceMeters: 15 };

  // Generate candidate loadout skeletons derived purely from /data/
  const candidateSkeletons = generateCandidateSkeletons(archetype, floors);

  let bestPracticalBuild: { gear: Record<GearSlot, GearPieceInstance>; stats: any; score: number; minorPlan: any } | null = null;
  let bestCeilingBuild: { gear: Record<GearSlot, GearPieceInstance>; stats: any; score: number; minorPlan: any } | null = null;

  let closestRejectedBuild: { gear: Record<GearSlot, GearPieceInstance>; stats: any; score: number; shortfall: string } | null = null;

  const warnings: string[] = [];
  const confidenceFlags = new Set<string>();

  for (const skeleton of candidateSkeletons) {
    // 1. Solve Tier 2 (Ceiling)
    const ceilingPlan = solveMinorAttributes(skeleton, archetype, 2, activeWeapon, watch, spec, context);
    const ceilingGear = assembleGearWithPlan(skeleton, ceilingPlan);
    const ceilingStats = calculateLoadout(ceilingGear, activeWeapon, watch, spec, context);

    // Validate floors
    const floorCheck = archetype.validateFloors(ceilingStats, floors, context);
    if (!floorCheck.satisfied) {
      const score = archetype.score(ceilingStats, context);
      if (!closestRejectedBuild || score > closestRejectedBuild.score) {
        closestRejectedBuild = {
          gear: ceilingGear,
          stats: ceilingStats,
          score,
          shortfall: floorCheck.shortfall || 'Failed archetype floor criteria'
        };
      }
      continue;
    }

    const ceilingScore = archetype.score(ceilingStats, context);

    // 2. Solve Tier 1 (Practical)
    const practicalPlan = solveMinorAttributes(skeleton, archetype, 1, activeWeapon, watch, spec, context);
    const practicalGear = assembleGearWithPlan(skeleton, practicalPlan);
    const practicalStats = calculateLoadout(practicalGear, activeWeapon, watch, spec, context);
    const practicalScore = archetype.score(practicalStats, context);

    if (!bestCeilingBuild || ceilingScore > bestCeilingBuild.score) {
      bestCeilingBuild = {
        gear: ceilingGear,
        stats: ceilingStats,
        score: ceilingScore,
        minorPlan: ceilingPlan
      };
      bestPracticalBuild = {
        gear: practicalGear,
        stats: practicalStats,
        score: practicalScore,
        minorPlan: practicalPlan
      };

      for (const flag of ceilingStats.confidenceFlags) confidenceFlags.add(flag);
    }
  }

  // If no legal build satisfied floors, report shortfall honestly per spec §3
  if (!bestCeilingBuild) {
    const fallback = closestRejectedBuild || {
      gear: getEmergencyFallbackGear(),
      stats: calculateLoadout(getEmergencyFallbackGear(), activeWeapon, watch, spec, context),
      score: 0,
      shortfall: 'No legal build configuration met the required archetype floors.'
    };

    const emptyPlan = solveMinorAttributes(fallback.gear, archetype, 1, activeWeapon, watch, spec, context);
    const practicalItems = generateShoppingList(fallback.gear, emptyPlan, dataSourcesMap);
    const recSpec = getRecommendedSpecialization(archetype);
    const practicalWeapons = generateRecommendedWeapons(archetype, activeWeapon, 1);
    const ceilingWeapons = generateRecommendedWeapons(archetype, activeWeapon, 2);

    return {
      archetype,
      recommendedSpecialization: recSpec,
      practical: {
        gear: fallback.gear,
        weapons: practicalWeapons,
        stats: fallback.stats,
        score: fallback.score,
        shoppingList: practicalItems
      },
      ceiling: {
        gear: fallback.gear,
        weapons: ceilingWeapons,
        stats: fallback.stats,
        score: fallback.score,
        shoppingList: practicalItems
      },
      gap: {
        scoreDeltaPct: 0,
        scoreDeltaHeadline: 'No legal build met all floors',
        godRollPiecesNeeded: 0,
        recalibrationsRequired: 0,
        libraryBanksRequired: [],
        perPieceDiff: []
      },
      warnings: [`Floor shortfall: ${fallback.shortfall}`],
      confidenceFlags: Array.from(confidenceFlags),
      floorsSatisfied: false,
      shortfallReason: fallback.shortfall
    };
  }

  // Calculate gap and shopping lists
  const practicalShoppingList = generateShoppingList(bestPracticalBuild!.gear, bestPracticalBuild!.minorPlan, dataSourcesMap);
  const ceilingShoppingList = generateShoppingList(bestCeilingBuild.gear, bestCeilingBuild.minorPlan, dataSourcesMap);
  const recSpec = getRecommendedSpecialization(archetype);
  const practicalWeapons = generateRecommendedWeapons(archetype, activeWeapon, 1);
  const ceilingWeapons = generateRecommendedWeapons(archetype, activeWeapon, 2);

  const gap = computeTwoTierGap(
    bestPracticalBuild!.stats,
    bestPracticalBuild!.score,
    bestCeilingBuild.stats,
    bestCeilingBuild.score,
    bestPracticalBuild!.gear,
    bestCeilingBuild.gear,
    archetype
  );

  return {
    archetype,
    recommendedSpecialization: recSpec,
    practical: {
      gear: bestPracticalBuild!.gear,
      weapons: practicalWeapons,
      stats: bestPracticalBuild!.stats,
      score: bestPracticalBuild!.score,
      shoppingList: practicalShoppingList
    },
    ceiling: {
      gear: bestCeilingBuild.gear,
      weapons: ceilingWeapons,
      stats: bestCeilingBuild.stats,
      score: bestCeilingBuild.score,
      shoppingList: ceilingShoppingList
    },
    gap,
    warnings,
    confidenceFlags: Array.from(confidenceFlags),
    floorsSatisfied: true
  };
}

/**
 * Systematically generates candidate gear layouts from /data/
 */
function generateCandidateSkeletons(
  archetype: ArchetypeDefinition,
  floors: ArchetypeFloors
): Array<Record<GearSlot, GearPieceInstance>> {
  const skeletons: Array<Record<GearSlot, GearPieceInstance>> = [];

  // Determine target core preference based on archetype
  const coreVariations: CoreType[][] = getTargetCoreVariations(archetype, floors);

  // 1. Generate 4pc Gear Set skeletons across all gear sets in /data/
  for (const set of gearSets) {
    if (set.isPTS) continue;

    // Slot layout 1: 4pc on mask, chest, holster, kneepads + named/exotic backpack & gloves
    const layout1Slots: GearSlot[] = ['mask', 'chest', 'holster', 'kneepads'];
    const nonSetSlots1: GearSlot[] = ['backpack', 'gloves'];

    // Slot layout 2: 4pc on backpack, chest, holster, kneepads + exotic mask & named gloves
    const layout2Slots: GearSlot[] = ['backpack', 'chest', 'holster', 'kneepads'];
    const nonSetSlots2: GearSlot[] = ['mask', 'gloves'];

    // Slot layout 3: 4pc on mask, holster, gloves, kneepads + brand chest & brand backpack
    const layout3Slots: GearSlot[] = ['mask', 'holster', 'gloves', 'kneepads'];
    const nonSetSlots3: GearSlot[] = ['chest', 'backpack'];

    const layouts = [
      { setSlots: layout1Slots, otherSlots: nonSetSlots1, useSetChest: true, useSetBp: false },
      { setSlots: layout2Slots, otherSlots: nonSetSlots2, useSetChest: true, useSetBp: true },
      { setSlots: layout3Slots, otherSlots: nonSetSlots3, useSetChest: false, useSetBp: false }
    ];

    for (const layout of layouts) {
      // Pick complementary brand/named/exotics for the 2 other slots
      const complementaryPairs = getComplementaryOtherPieces(layout.otherSlots, archetype);

      for (const pair of complementaryPairs) {
        for (const cores of coreVariations) {
          const loadout: Record<GearSlot, GearPieceInstance> = {} as any;

          // Fill gear set pieces
          let coreIdx = 0;
          for (const slot of layout.setSlots) {
            const desiredCore = cores[coreIdx] || (set.coreAttribute?.includes('Armor') ? 'Armor' : (set.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'));
            const isRecal = !set.coreAttribute?.toLowerCase().includes(desiredCore.toLowerCase());

            loadout[slot] = {
              slot,
              kind: 'gear-set',
              name: `${set.name} ${capitalize(slot)}`,
              brandOrSetId: set.id,
              core: {
                type: desiredCore,
                value: desiredCore === 'Armor' ? 170000 : (desiredCore === 'Skill Tier' ? 1 : 0.15),
                isRecalibrated: isRecal
              },
              minors: [],
              talent: (slot === 'chest' && layout.useSetChest) ? set.chestTalent : (slot === 'backpack' && layout.useSetBp ? set.backpackTalent : undefined)
            };
            coreIdx++;
          }

          // Fill other 2 pieces
          for (let i = 0; i < layout.otherSlots.length; i++) {
            const slot = layout.otherSlots[i];
            const pieceTemplate = pair[i];
            const desiredCore = cores[coreIdx] || pieceTemplate.naturalCore;
            const isRecal = desiredCore !== pieceTemplate.naturalCore;

            loadout[slot] = {
              slot,
              kind: pieceTemplate.kind,
              name: pieceTemplate.name,
              brandOrSetId: pieceTemplate.brandOrSetId,
              core: {
                type: desiredCore,
                value: desiredCore === 'Armor' ? 170000 : (desiredCore === 'Skill Tier' ? 1 : 0.15),
                isRecalibrated: isRecal
              },
              minors: pieceTemplate.lockedMinor ? [{ ...pieceTemplate.lockedMinor, isLocked: true }] : [],
              talent: pieceTemplate.talent
            };
            coreIdx++;
          }

          skeletons.push(loadout);
        }
      }
    }
  }

  // 2. Generate Brand Set skeletons (High-End & Named)
  const brandCombinations = getBrandCombinations(archetype);
  for (const combo of brandCombinations) {
    for (const cores of coreVariations) {
      const loadout: Record<GearSlot, GearPieceInstance> = {} as any;
      let coreIdx = 0;

      for (let i = 0; i < ALL_GEAR_SLOTS.length; i++) {
        const slot = ALL_GEAR_SLOTS[i];
        const template = combo[i];
        const desiredCore = cores[coreIdx] || template.naturalCore;
        const isRecal = desiredCore !== template.naturalCore;

        loadout[slot] = {
          slot,
          kind: template.kind,
          name: template.name,
          brandOrSetId: template.brandOrSetId,
          core: {
            type: desiredCore,
            value: desiredCore === 'Armor' ? 170000 : (desiredCore === 'Skill Tier' ? 1 : 0.15),
            isRecalibrated: isRecal
          },
          minors: template.lockedMinor ? [{ ...template.lockedMinor, isLocked: true }] : [],
          talent: template.talent
        };
        coreIdx++;
      }

      skeletons.push(loadout);
    }
  }

  return skeletons;
}

function getTargetCoreVariations(archetype: ArchetypeDefinition, floors: ArchetypeFloors): CoreType[][] {
  const variations: CoreType[][] = [];

  if (archetype.id === 'sustained_dps' || archetype.id === 'precision_dps') {
    variations.push(['Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage']);
    variations.push(['Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Armor', 'Armor']); // 4 Red / 2 Blue
  } else if (archetype.id === 'skill_damage' || archetype.id === 'glass_medic' || archetype.id === 'lockdown') {
    variations.push(['Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier']);
  } else if (archetype.id === 'field_medic' || archetype.id === 'force_multiplier') {
    variations.push(['Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Armor', 'Armor']); // 4 Yellow / 2 Blue
    variations.push(['Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier']);
  } else if (archetype.id === 'bulwark' || archetype.id === 'lightning_rod') {
    variations.push(['Armor', 'Armor', 'Armor', 'Armor', 'Armor', 'Armor']); // 6 Blue
    variations.push(['Armor', 'Armor', 'Armor', 'Armor', 'Skill Tier', 'Skill Tier']); // 4 Blue / 2 Yellow
  } else if (archetype.id === 'hardened') {
    variations.push(['Armor', 'Armor', 'Armor', 'Armor', 'Armor', 'Armor']);
    variations.push(['Armor', 'Armor', 'Armor', 'Armor', 'Weapon Damage', 'Weapon Damage']);
    variations.push(['Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier']);
  } else {
    variations.push(['Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage', 'Weapon Damage']);
    variations.push(['Armor', 'Armor', 'Armor', 'Armor', 'Armor', 'Armor']);
    variations.push(['Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier', 'Skill Tier']);
  }

  return variations;
}

function getComplementaryOtherPieces(
  slots: GearSlot[],
  archetype: ArchetypeDefinition
): Array<Array<{ name: string; brandOrSetId: string; kind: 'brand' | 'named' | 'exotic'; naturalCore: CoreType; talent?: string; lockedMinor?: any }>> {
  const result: Array<Array<any>> = [];

  // Filter exotics and named items from /data/
  const exoticsForSlots = namedGear.filter(g => g.isExotic);
  const namedForSlots = namedGear.filter(g => !g.isExotic);

  // Group exotics by slot
  const exoticsBySlot = new Map<string, any[]>();
  for (const ex of exoticsForSlots) {
    const s = normalizeSlot(ex.slot);
    if (!exoticsBySlot.has(s)) exoticsBySlot.set(s, []);
    exoticsBySlot.get(s)!.push(ex);
  }

  // Filter top relevant brand sets from /data/
  const relevantBrands = brandSets.slice(0, 15);

  const slotA = slots[0];
  const slotB = slots[1];

  // Variation 1: 1 Exotic on slotA + 1 Named on slotB
  const exListA = exoticsBySlot.get(slotA) || [];
  const namedListB = namedForSlots.filter(g => normalizeSlot(g.slot) === slotB);

  for (const ex of exListA.slice(0, 2)) {
    for (const n of namedListB.slice(0, 2)) {
      result.push([
        {
          name: ex.name,
          brandOrSetId: ex.id,
          kind: 'exotic',
          naturalCore: ex.coreAttribute?.includes('Armor') ? 'Armor' : (ex.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'),
          talent: ex.talent
        },
        {
          name: n.name,
          brandOrSetId: n.brand ? n.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'brand',
          kind: 'named',
          naturalCore: n.coreAttribute?.includes('Armor') ? 'Armor' : (n.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'),
          talent: n.talent,
          lockedMinor: n.minor1 ? { attribute: parseMinorName(n.minor1), value: parseMinorVal(n.minor1), unit: '%' } : undefined
        }
      ]);
    }
  }

  // Variation 2: 2 Complementary Brand pieces
  for (let i = 0; i < Math.min(4, relevantBrands.length - 1); i++) {
    const b1 = relevantBrands[i];
    const b2 = relevantBrands[i + 1];
    result.push([
      {
        name: `${b1.name} ${capitalize(slotA)}`,
        brandOrSetId: b1.id,
        kind: 'brand',
        naturalCore: b1.coreAttribute?.includes('Armor') ? 'Armor' : (b1.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'),
        talent: slotA === 'chest' ? 'Obliterate' : (slotA === 'backpack' ? 'Vigilance' : undefined)
      },
      {
        name: `${b2.name} ${capitalize(slotB)}`,
        brandOrSetId: b2.id,
        kind: 'brand',
        naturalCore: b2.coreAttribute?.includes('Armor') ? 'Armor' : (b2.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'),
        talent: slotB === 'chest' ? 'Obliterate' : (slotB === 'backpack' ? 'Vigilance' : undefined)
      }
    ]);
  }

  return result.length > 0 ? result : [[
    { name: `High-End ${capitalize(slotA)}`, brandOrSetId: 'brand-a', kind: 'brand', naturalCore: 'Weapon Damage' },
    { name: `High-End ${capitalize(slotB)}`, brandOrSetId: 'brand-b', kind: 'brand', naturalCore: 'Weapon Damage' }
  ]];
}

function getBrandCombinations(
  archetype: ArchetypeDefinition
): Array<Array<{ name: string; brandOrSetId: string; kind: 'brand' | 'named' | 'exotic'; naturalCore: CoreType; talent?: string; lockedMinor?: any }>> {
  const result: Array<Array<any>> = [];

  // Select groups of 3+2+1 brands from /data/
  const offensiveBrands = brandSets.filter(b => b.coreAttribute === 'Weapon Damage');
  const defensiveBrands = brandSets.filter(b => b.coreAttribute === 'Armor');
  const skillBrands = brandSets.filter(b => b.coreAttribute === 'Skill Tier');

  const primaryGroup = archetype.id.includes('medic') || archetype.id.includes('skill') || archetype.id.includes('lockdown')
    ? skillBrands
    : (archetype.id.includes('bulwark') || archetype.id.includes('rod') || archetype.id.includes('hardened') ? defensiveBrands : offensiveBrands);

  const secondaryGroup = archetype.id.includes('field') || archetype.id.includes('force')
    ? defensiveBrands
    : offensiveBrands;

  if (primaryGroup.length >= 2) {
    const b1 = primaryGroup[0];
    const b2 = primaryGroup[1];
    const b3 = (secondaryGroup[0] && secondaryGroup[0].id !== b1.id && secondaryGroup[0].id !== b2.id) ? secondaryGroup[0] : (primaryGroup[2] || primaryGroup[0]);

    // Build: 3pc b1, 2pc b2, 1pc b3
    const combo: any[] = [];
    const slots = ALL_GEAR_SLOTS;

    // 3 pieces of b1
    for (let i = 0; i < 3; i++) {
      const slot = slots[i];
      combo.push({
        name: `${b1.name} ${capitalize(slot)}`,
        brandOrSetId: b1.id,
        kind: 'brand',
        naturalCore: b1.coreAttribute?.includes('Armor') ? 'Armor' : (b1.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'),
        talent: slot === 'chest' ? 'Glass Cannon' : (slot === 'backpack' ? 'Vigilance' : undefined)
      });
    }
    // 2 pieces of b2
    for (let i = 3; i < 5; i++) {
      const slot = slots[i];
      combo.push({
        name: `${b2.name} ${capitalize(slot)}`,
        brandOrSetId: b2.id,
        kind: 'brand',
        naturalCore: b2.coreAttribute?.includes('Armor') ? 'Armor' : (b2.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'),
        talent: undefined
      });
    }
    // 1 piece of b3
    const slot5 = slots[5];
    combo.push({
      name: `${b3.name} ${capitalize(slot5)}`,
      brandOrSetId: b3.id,
      kind: 'brand',
      naturalCore: b3.coreAttribute?.includes('Armor') ? 'Armor' : (b3.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage')
    });

    result.push(combo);
  }

  return result;
}

function assembleGearWithPlan(
  skeleton: Record<GearSlot, GearPieceInstance>,
  plan: any
): Record<GearSlot, GearPieceInstance> {
  const result: Record<GearSlot, GearPieceInstance> = {} as any;
  for (const [slot, piece] of Object.entries(skeleton) as [GearSlot, GearPieceInstance][]) {
    result[slot] = {
      ...piece,
      minors: plan.minorsPerSlot[slot] || [],
      modSlot: plan.modsPerSlot[slot] || null
    };
  }
  return result;
}

function getEmergencyFallbackGear(): Record<GearSlot, GearPieceInstance> {
  const b = brandSets[0] || { name: 'Airaldi Holdings', id: 'airaldi-holdings', coreAttribute: 'Weapon Damage' };
  const res: any = {};
  for (const slot of ALL_GEAR_SLOTS) {
    res[slot] = {
      slot,
      kind: 'brand',
      name: `${b.name} ${capitalize(slot)}`,
      brandOrSetId: b.id,
      core: { type: 'Weapon Damage', value: 0.15 },
      minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
    };
  }
  return res;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeSlot(s: string): GearSlot {
  const lower = (s || '').toLowerCase();
  if (lower.includes('mask')) return 'mask';
  if (lower.includes('backpack')) return 'backpack';
  if (lower.includes('chest') || lower.includes('body')) return 'chest';
  if (lower.includes('glove')) return 'gloves';
  if (lower.includes('holster')) return 'holster';
  return 'kneepads';
}

function parseMinorName(raw: string): string {
  if (!raw) return 'Critical Hit Damage';
  const lines = raw.split('\n');
  return lines[0].replace(/[0-9%+-]/g, '').trim() || 'Critical Hit Damage';
}

function parseMinorVal(raw: string): number {
  if (!raw) return 0.12;
  const match = raw.match(/([0-9.]+)/);
  if (match) {
    const n = parseFloat(match[1]);
    return n > 1 ? n / 100 : n;
  }
  return 0.12;
}
