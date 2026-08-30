import { GearSlot, GearPieceInstance, ComputedLoadoutStats } from '../calc/types';
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
  practical: {
    gear: Record<GearSlot, GearPieceInstance>;
    stats: ComputedLoadoutStats;
    score: number;
    shoppingList: ShoppingListItem[];
  };
  ceiling: {
    gear: Record<GearSlot, GearPieceInstance>;
    stats: ComputedLoadoutStats;
    score: number;
    shoppingList: ShoppingListItem[];
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
