import { GearPieceInstance, GearSlot } from './types';

export interface LegalityResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single gear piece against Division 2 itemisation and recalibration rules.
 */
export function validateGearPieceLegality(piece: GearPieceInstance): LegalityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let recalibrationCount = 0;
  if (piece.core.isRecalibrated) recalibrationCount++;
  for (const m of piece.minors) {
    if (m.isRecalibrated) recalibrationCount++;
  }
  if (piece.isTalentRecalibrated) recalibrationCount++;

  // 1. One recalibration per item rule
  if (recalibrationCount > 1) {
    errors.push(`${piece.name} (${piece.slot}): Violates the one recalibration per item limit (${recalibrationCount} recalibrations specified).`);
  }

  // 2. Exotics: not recalibratable
  if (piece.kind === 'exotic') {
    if (recalibrationCount > 0) {
      errors.push(`${piece.name} (${piece.slot}): Exotic gear rolls are fixed and cannot be recalibrated.`);
    }
  }

  // 3. Named gear: perfect talent locked
  if (piece.kind === 'named') {
    if (piece.isTalentRecalibrated) {
      errors.push(`${piece.name} (${piece.slot}): Named gear has a locked perfect talent that cannot be recalibrated.`);
    }
  }

  // 4. Gear set pieces:
  // - Core is fixed to the set natural colour and cannot change
  // - Talents cannot be recalibrated
  // - Carries only ONE minor attribute (where brand pieces carry two)
  if (piece.kind === 'gear-set') {
    if (piece.core.isRecalibrated) {
      errors.push(`${piece.name} (${piece.slot}): Gear set cores are fixed to their natural colour and cannot be recalibrated.`);
    }
    if (piece.isTalentRecalibrated) {
      errors.push(`${piece.name} (${piece.slot}): Gear set chest/backpack talents are fixed and cannot be recalibrated.`);
    }
    if (piece.minors.length > 1) {
      errors.push(`${piece.name} (${piece.slot}): Gear set pieces carry only 1 minor attribute (got ${piece.minors.length}).`);
    } else if (piece.minors.length === 1) {
      warnings.push(`${piece.name} (${piece.slot}): Gear set piece has only 1 minor attribute (-1 minor attribute budget vs brand).`);
    }
  }

  // 5. Mod slot validity:
  // Mod slots exist only on masks, backpacks, and chests unless Improvised
  const validModSlots: GearSlot[] = ['mask', 'backpack', 'chest'];
  const hasModSlot = piece.modSlot !== undefined && piece.modSlot !== null;
  const isImprovised = piece.kind === 'improvised' || piece.name.toLowerCase().includes('improvised');

  if (hasModSlot && !validModSlots.includes(piece.slot) && !isImprovised) {
    errors.push(`${piece.name} (${piece.slot}): Only masks, backpacks, and chests have mod slots (unless Improvised).`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates full loadout gear legality.
 */
export function validateLoadoutLegality(gear: Record<GearSlot, GearPieceInstance>): LegalityResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  let exoticCount = 0;
  for (const [slot, piece] of Object.entries(gear)) {
    if (!piece) continue;
    if (piece.kind === 'exotic') exoticCount++;
    const res = validateGearPieceLegality(piece);
    allErrors.push(...res.errors);
    allWarnings.push(...res.warnings);
  }

  // Exotic limit: standard loadout allows 1 exotic gear piece
  if (exoticCount > 1) {
    allWarnings.push(`Loadout contains ${exoticCount} exotic gear pieces. Note: standard loadout rules permit 1 exotic gear piece.`);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}
