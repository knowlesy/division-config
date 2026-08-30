import { GearSlot, GearPieceInstance, AttributeRoll, ComputedLoadoutStats, CombatContext, WatchStats, WeaponInstance } from '../calc/types';
import { STANDARD_GEAR_MINORS, STANDARD_GEAR_MODS, MinorAttributeInfo, ModAttributeInfo, MOD_GEAR_SLOTS } from '../calc/slot-legality';
import { calculateLoadout } from '../calc/loadout-calculator';
import { ArchetypeDefinition } from './archetypes';

export interface SolvedMinorPlan {
  minorsPerSlot: Record<GearSlot, AttributeRoll[]>;
  modsPerSlot: Record<GearSlot, AttributeRoll | null>;
  recalibrationPerSlot: Record<GearSlot, { target: 'core' | 'minor' | 'none'; detail: string }>;
}

const rankingCache = new Map<string, { scoredMinors: Array<{ minor: MinorAttributeInfo; marginalGain: number }>; scoredMods: Array<{ mod: ModAttributeInfo; marginalGain: number }> }>();

function getRankedMinorsAndMods(
  archetype: ArchetypeDefinition,
  weapon: WeaponInstance,
  watch: WatchStats,
  specialization: string,
  context: CombatContext,
  tier: 1 | 2
) {
  const cacheKey = `${archetype.id}:${tier}:${weapon.name}:${specialization}:${context.isSolo}`;
  if (rankingCache.has(cacheKey)) {
    return rankingCache.get(cacheKey)!;
  }

  const dummyGear: Record<GearSlot, GearPieceInstance> = {
    mask: { slot: 'mask', kind: 'brand', name: 'Mask', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    backpack: { slot: 'backpack', kind: 'brand', name: 'BP', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    chest: { slot: 'chest', kind: 'brand', name: 'Chest', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    gloves: { slot: 'gloves', kind: 'brand', name: 'Gloves', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    holster: { slot: 'holster', kind: 'brand', name: 'Holster', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] },
    kneepads: { slot: 'kneepads', kind: 'brand', name: 'Knees', brandOrSetId: 'brand', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: false }, minors: [] }
  };

  const baseStats = calculateLoadout(dummyGear, weapon, watch, specialization, context);
  const scoredMinors: Array<{ minor: MinorAttributeInfo; marginalGain: number }> = [];

  for (const minor of STANDARD_GEAR_MINORS) {
    const testRoll: AttributeRoll = {
      attribute: minor.name,
      value: tier === 2 ? minor.maxRoll : minor.typicalRoll,
      unit: minor.unit
    };
    const testGear = createGearWithMinors(dummyGear, { mask: [testRoll] }, {}, tier);
    const testStats = calculateLoadout(testGear, weapon, watch, specialization, context);
    const gain = archetype.score(testStats, context) - archetype.score(baseStats, context);
    scoredMinors.push({ minor, marginalGain: gain });
  }
  scoredMinors.sort((a, b) => b.marginalGain - a.marginalGain);

  const scoredMods: Array<{ mod: ModAttributeInfo; marginalGain: number }> = [];
  for (const mod of STANDARD_GEAR_MODS) {
    const testRoll: AttributeRoll = {
      attribute: mod.name,
      value: tier === 2 ? mod.maxRoll : mod.typicalRoll,
      unit: mod.unit
    };
    const testGear = createGearWithMinors(dummyGear, {}, { mask: testRoll }, tier);
    const testStats = calculateLoadout(testGear, weapon, watch, specialization, context);
    const gain = archetype.score(testStats, context) - archetype.score(baseStats, context);
    scoredMods.push({ mod, marginalGain: gain });
  }
  scoredMods.sort((a, b) => b.marginalGain - a.marginalGain);

  const result = { scoredMinors, scoredMods };
  rankingCache.set(cacheKey, result);
  return result;
}

/**
 * Assigns minor attributes and mods to gear pieces using a deterministic marginal-gain assignment solver.
 *
 * Stage 1: Compute candidate minor attribute totals based on archetype objective.
 * Stage 2: Assign deterministically to slots respecting slot legality, locked perfect minors, and recal budget.
 */
export function solveMinorAttributes(
  gearSkeleton: Record<GearSlot, GearPieceInstance>,
  archetype: ArchetypeDefinition,
  tier: 1 | 2,
  weapon: WeaponInstance,
  watch: WatchStats = {},
  specialization: string = 'Gunner',
  context: CombatContext = { isSolo: true, distanceMeters: 15 }
): SolvedMinorPlan {
  // Determine available minor and mod slots per piece
  const slotCapacities: Record<GearSlot, { availableMinors: number; hasMod: boolean; lockedMinor?: AttributeRoll }> = {
    mask: { availableMinors: 2, hasMod: true },
    backpack: { availableMinors: 2, hasMod: true },
    chest: { availableMinors: 2, hasMod: true },
    gloves: { availableMinors: 2, hasMod: false },
    holster: { availableMinors: 2, hasMod: false },
    kneepads: { availableMinors: 2, hasMod: false }
  };

  for (const [slotKey, piece] of Object.entries(gearSkeleton) as [GearSlot, GearPieceInstance][]) {
    if (!piece) continue;
    if (piece.kind === 'gear-set') {
      slotCapacities[slotKey].availableMinors = 1;
    } else if (piece.kind === 'named') {
      if (slotKey !== 'chest' && slotKey !== 'backpack') {
        // Non-talent named piece has 1 locked perfect minor and 1 open minor
        const locked = piece.minors?.find(m => m.isLocked);
        if (locked) {
          slotCapacities[slotKey].lockedMinor = locked;
          slotCapacities[slotKey].availableMinors = 1;
        }
      }
    }
  }

  // Rank candidate minor attributes by testing marginal score improvement (memoized per archetype)
  const { scoredMinors, scoredMods } = getRankedMinorsAndMods(archetype, weapon, watch, specialization, context, tier);
  const candidateMinors = STANDARD_GEAR_MINORS;
  const candidateMods = STANDARD_GEAR_MODS;

  // Stage 1 & 2: Allocate minors deterministically
  const assignedMinors: Record<GearSlot, AttributeRoll[]> = {
    mask: [],
    backpack: [],
    chest: [],
    gloves: [],
    holster: [],
    kneepads: []
  };

  const assignedMods: Record<GearSlot, AttributeRoll | null> = {
    mask: null,
    backpack: null,
    chest: null,
    gloves: null,
    holster: null,
    kneepads: null
  };

  const recalPlan: Record<GearSlot, { target: 'core' | 'minor' | 'none'; detail: string }> = {
    mask: { target: 'none', detail: 'Native rolls kept' },
    backpack: { target: 'none', detail: 'Native rolls kept' },
    chest: { target: 'none', detail: 'Native rolls kept' },
    gloves: { target: 'none', detail: 'Native rolls kept' },
    holster: { target: 'none', detail: 'Native rolls kept' },
    kneepads: { target: 'none', detail: 'Native rolls kept' }
  };

  // 1. Add locked minors from named pieces first
  for (const slot of Object.keys(assignedMinors) as GearSlot[]) {
    if (slotCapacities[slot].lockedMinor) {
      assignedMinors[slot].push(slotCapacities[slot].lockedMinor!);
    }
  }

  // 2. Greedily assign minors to slots
  // Select top 2 complementary attributes for the objective
  const primaryMinor = scoredMinors[0]?.minor || candidateMinors[0];
  const secondaryMinor = scoredMinors[1]?.minor || candidateMinors[1];

  let currentChcSum = (watch.critChance || 0) + (weapon.secondaryCoreAttribute?.type.includes('Crit Chance') ? weapon.secondaryCoreAttribute.value : 0);

  for (const slot of Object.keys(assignedMinors) as GearSlot[]) {
    const piece = gearSkeleton[slot];
    if (!piece) continue;

    const capacity = slotCapacities[slot].availableMinors;
    const currentCount = assignedMinors[slot].length;
    const needed = capacity - (slotCapacities[slot].lockedMinor ? 0 : 0);

    for (let i = currentCount; i < (slotCapacities[slot].lockedMinor ? capacity + 1 : capacity); i++) {
      let chosenMinor = primaryMinor;

      // Check if primary is CHC and already close to 60% cap
      if (primaryMinor.name === 'Critical Hit Chance' && currentChcSum >= 0.54) {
        chosenMinor = secondaryMinor;
      } else if (assignedMinors[slot].some(m => m.attribute === primaryMinor.name)) {
        // Cannot have duplicate attribute on same piece
        chosenMinor = secondaryMinor;
      }

      const rollVal = tier === 2 ? chosenMinor.maxRoll : chosenMinor.typicalRoll;
      if (chosenMinor.name === 'Critical Hit Chance') {
        currentChcSum += rollVal;
      }

      assignedMinors[slot].push({
        attribute: chosenMinor.name,
        value: rollVal,
        unit: chosenMinor.unit
      });
    }
  }

  // 3. Assign mods to mod slots (mask, backpack, chest)
  const bestMod = scoredMods[0]?.mod || candidateMods[0];
  for (const slot of MOD_GEAR_SLOTS) {
    if (slotCapacities[slot].hasMod) {
      let chosenMod = bestMod;
      if (bestMod.name === 'Critical Hit Chance' && currentChcSum >= 0.54 && scoredMods.length > 1) {
        chosenMod = scoredMods[1].mod;
      }

      const rollVal = tier === 2 ? chosenMod.maxRoll : chosenMod.typicalRoll;
      assignedMods[slot] = {
        attribute: chosenMod.name,
        value: rollVal,
        unit: chosenMod.unit
      };
    }
  }

  // 4. Generate transparent recalibration instructions per slot
  for (const slot of Object.keys(assignedMinors) as GearSlot[]) {
    const piece = gearSkeleton[slot];
    if (!piece) continue;

    if (piece.kind === 'exotic') {
      recalPlan[slot] = {
        target: 'none',
        detail: 'Exotic fixed rolls (Optimise-only at Tinkering Station; non-recalibratable)'
      };
      continue;
    }

    if (tier === 2) {
      // Tier 2 assumes god-roll drop with desired minors, leaving recal free for Core
      if (piece.core.isRecalibrated) {
        recalPlan[slot] = {
          target: 'core',
          detail: `Recalibrate Core to ${piece.core.type} (farmed perfect minor rolls leave recal free for core)`
        };
      } else {
        recalPlan[slot] = {
          target: 'none',
          detail: `Native ${piece.core.type} Core kept; all minors god-rolled`
        };
      }
    } else {
      // Tier 1 commits 1 recalibration budget
      if (piece.core.isRecalibrated) {
        recalPlan[slot] = {
          target: 'core',
          detail: `Spend recalibration on Core (${piece.core.type}); minor rolls are native drop values`
        };
      } else {
        const firstOpenMinor = assignedMinors[slot][0]?.attribute || 'minor attribute';
        recalPlan[slot] = {
          target: 'minor',
          detail: `Leave natural ${piece.core.type} Core; recalibrate minor to ${firstOpenMinor}`
        };
      }
    }
  }

  return {
    minorsPerSlot: assignedMinors,
    modsPerSlot: assignedMods,
    recalibrationPerSlot: recalPlan
  };
}

function createGearWithMinors(
  skeleton: Record<GearSlot, GearPieceInstance>,
  minors: Partial<Record<GearSlot, AttributeRoll[]>>,
  mods: Partial<Record<GearSlot, AttributeRoll>>,
  tier: 1 | 2
): Record<GearSlot, GearPieceInstance> {
  const result: Record<GearSlot, GearPieceInstance> = {} as any;
  for (const [slot, piece] of Object.entries(skeleton) as [GearSlot, GearPieceInstance][]) {
    if (!piece) continue;
    result[slot] = {
      ...piece,
      minors: minors[slot] || piece.minors || [],
      modSlot: mods[slot] || piece.modSlot || null
    };
  }
  return result;
}
