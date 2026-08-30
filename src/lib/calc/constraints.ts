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

  // 2. Exotics: not recalibratable (optimise-only)
  if (piece.kind === 'exotic') {
    if (recalibrationCount > 0) {
      errors.push(`${piece.name} (${piece.slot}): Exotic gear rolls are fixed and cannot be recalibrated.`);
    }
  }

  // 3. Named gear:
  // - Chest & Backpack: Perfect talent is locked, core and minors are open
  // - Mask, Gloves, Holster, Kneepads: Perfect attribute is locked, core and second minor are open
  if (piece.kind === 'named') {
    if (piece.slot === 'chest' || piece.slot === 'backpack') {
      if (piece.isTalentRecalibrated) {
        errors.push(`${piece.name} (${piece.slot}): Named gear has a locked Perfect talent that cannot be recalibrated.`);
      }
    } else {
      if (piece.isTalentRecalibrated) {
        errors.push(`${piece.name} (${piece.slot}): Named gear in slot '${piece.slot}' has no talent slot.`);
      }
      // Check if the locked perfect minor attribute was marked as recalibrated
      const lockedMinor = piece.minors.find(m => m.isLocked);
      if (lockedMinor && lockedMinor.isRecalibrated) {
        errors.push(`${piece.name} (${piece.slot}): Named gear in slot '${piece.slot}' has a locked Perfect attribute that cannot be recalibrated.`);
      }
    }
  }

  // 4. Gear set pieces:
  // - Core IS recalibratable across colours (counts toward 1-recalibration limit)
  // - Talents cannot be recalibrated
  // - Carries only ONE minor attribute (where brand pieces carry two)
  if (piece.kind === 'gear-set') {
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

  // Hard game rule: At most 1 exotic gear piece permitted
  if (exoticCount > 1) {
    allErrors.push(`Illegal loadout: Contains ${exoticCount} exotic gear pieces. Division 2 strictly permits at most 1 exotic gear piece.`);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}
