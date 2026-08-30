import {
  GearSlot,
  GearPieceInstance,
  WeaponInstance,
  WatchStats,
  CombatContext,
  ComputedLoadoutStats
} from '../calc/types';
import { calculateLoadout } from '../calc/loadout-calculator';
import brandSetsData from '../../../data/brand-sets.json';
import namedGearData from '../../../data/gear-named.json';

const brandSets = brandSetsData as any[];
const namedGear = namedGearData as any[];

export interface TweakSuggestion {
  id: string;
  category: 'cap-fix' | 'dps' | 'survivability' | 'brand' | 'combo';
  categoryLabel: string;
  badgeColor: 'orange' | 'blue' | 'emerald' | 'purple' | 'amber';
  title: string;
  actionText: string;
  modifiedGear: Record<GearSlot, GearPieceInstance>;
  modifiedWeapon?: WeaponInstance;
  deltaSustainedDpsPct: number;
  deltaSustainedDps: number;
  deltaArmor: number;
  deltaArmorPct: number;
  deltaCritChance: number;
  deltaCritDamage: number;
  whyExplanation: string;
  isUpgrade: boolean;
}

const ALL_SLOTS: GearSlot[] = ['mask', 'backpack', 'chest', 'gloves', 'holster', 'kneepads'];

export function generateLoadoutTweaks(
  gear: Record<GearSlot, GearPieceInstance>,
  weapon: WeaponInstance,
  watch: WatchStats = {},
  specialization: string = 'Gunner',
  context: CombatContext = { isSolo: true, distanceMeters: 15 }
): TweakSuggestion[] {
  const baseline = calculateLoadout(gear, weapon, watch, specialization, context);
  const baselineDps = baseline.sustainedDps || 1;
  const baselineArmor = baseline.totalArmor || 726000;
  const baselineChc = baseline.groupBreakdown?.critChance || 0;
  const baselineChd = baseline.groupBreakdown?.critDamage || 0;

  const suggestions: TweakSuggestion[] = [];
  const seenIds = new Set<string>();

  const addSuggestion = (s: TweakSuggestion) => {
    if (seenIds.has(s.id)) return;
    seenIds.add(s.id);
    suggestions.push(s);
  };

  // Helper to evaluate a modified gear set
  const evaluateDelta = (
    id: string,
    category: TweakSuggestion['category'],
    categoryLabel: string,
    badgeColor: TweakSuggestion['badgeColor'],
    title: string,
    actionText: string,
    whyExplanation: string,
    newGear: Record<GearSlot, GearPieceInstance>,
    newWeapon?: WeaponInstance
  ) => {
    const testedStats = calculateLoadout(newGear, newWeapon || weapon, watch, specialization, context);

    // Skip if illegal (e.g. >1 exotic)
    if (testedStats.itemisationErrors && testedStats.itemisationErrors.length > 0) return;

    const deltaDps = testedStats.sustainedDps - baselineDps;
    const deltaDpsPct = (deltaDps / baselineDps) * 100;
    const deltaArmor = testedStats.totalArmor - baselineArmor;
    const deltaArmorPct = (deltaArmor / baselineArmor) * 100;
    const deltaChc = (testedStats.groupBreakdown?.critChance || 0) - baselineChc;
    const deltaChd = (testedStats.groupBreakdown?.critDamage || 0) - baselineChd;

    // Skip if literally 0 change
    if (Math.abs(deltaDps) < 50 && Math.abs(deltaArmor) < 1000) return;

    addSuggestion({
      id,
      category,
      categoryLabel,
      badgeColor,
      title,
      actionText,
      modifiedGear: newGear,
      modifiedWeapon: newWeapon,
      deltaSustainedDpsPct: deltaDpsPct,
      deltaSustainedDps: deltaDps,
      deltaArmor,
      deltaArmorPct,
      deltaCritChance: deltaChc,
      deltaCritDamage: deltaChd,
      whyExplanation,
      isUpgrade: deltaDps > 0 || deltaArmor > 0
    });
  };

  // 1. CHC MOD & MINOR TUNING / OVERCAP FIX
  ALL_SLOTS.forEach(slot => {
    const piece = gear[slot];
    if (!piece) return;

    // Check mod slot
    if (piece.modSlot && piece.modSlot.attribute.includes('Critical Hit Chance')) {
      const copy = { ...gear, [slot]: { ...piece, modSlot: { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' } } };
      const tested = calculateLoadout(copy, weapon, watch, specialization, context);
      const isDpsGain = tested.sustainedDps >= baselineDps;
      if (isDpsGain || baselineChc >= 0.50) {
        evaluateDelta(
          `cap-mod-${slot}`,
          isDpsGain ? 'cap-fix' : 'dps',
          isDpsGain ? '🎯 STAT CAP FIX' : '⚡ CHC TO CHD SWAP',
          isDpsGain ? 'emerald' : 'orange',
          `Convert ${slot.toUpperCase()} Mod to +12% CHD`,
          `Change Gear Mod in ${slot.toUpperCase()} from CHC (+6%) to CHD (+12%)`,
          isDpsGain
            ? `Your build has sufficient CHC (≥54-60%). Swapping this mod gives higher average bullet damage.`
            : `Trades 6% CHC for +12% Critical Hit Damage.`,
          copy
        );
      }
    }

    // Check minor attributes
    piece.minors.forEach((m, idx) => {
      if (m.attribute.includes('Critical Hit Chance')) {
        const newMinors = [...piece.minors];
        newMinors[idx] = { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' };
        const copy = { ...gear, [slot]: { ...piece, minors: newMinors } };
        const tested = calculateLoadout(copy, weapon, watch, specialization, context);
        const isDpsGain = tested.sustainedDps >= baselineDps;
        if (isDpsGain || baselineChc >= 0.50) {
          evaluateDelta(
            `cap-minor-${slot}-${idx}`,
            isDpsGain ? 'cap-fix' : 'dps',
            isDpsGain ? '🎯 STAT CAP FIX' : '⚡ CHC TO CHD SWAP',
            isDpsGain ? 'emerald' : 'orange',
            `Convert ${slot.toUpperCase()} Minor to +12% CHD`,
            `Change Minor Attribute on ${slot.toUpperCase()} from CHC (+6%) to CHD (+12%)`,
            isDpsGain
              ? `Your build has excess or high CHC. Swapping to CHD maximizes damage output.`
              : `Trades 6% CHC for +12% Critical Hit Damage.`,
            copy
          );
        }
      }
    });
  });

  // 2. CORE ATTRIBUTE TUNING: Red vs Blue vs Yellow
  ALL_SLOTS.forEach(slot => {
    const piece = gear[slot];
    if (!piece || piece.kind === 'exotic') return; // Cannot recalibrate exotic cores

    const currentCoreType = piece.core?.type;

    // Flip Blue -> Red (DPS boost)
    if (currentCoreType === 'Armor') {
      const copy = {
        ...gear,
        [slot]: {
          ...piece,
          core: { type: 'Weapon Damage' as const, value: 0.15, isRecalibrated: true }
        }
      };
      evaluateDelta(
        `core-red-${slot}`,
        'dps',
        '⚡ DPS BOOST',
        'orange',
        `Recalibrate ${slot.toUpperCase()} Core to +15% Weapon Damage`,
        `Switch ${slot.toUpperCase()} Core from Armor (170k) to Red Weapon Damage (+15%)`,
        `Trades 170k Armor for +15% All Weapon Damage to increase your burst and sustained kill speed.`,
        copy
      );
    }

    // Flip Red -> Blue (Survivability boost)
    if (currentCoreType === 'Weapon Damage') {
      const copy = {
        ...gear,
        [slot]: {
          ...piece,
          core: { type: 'Armor' as const, value: 170000, isRecalibrated: true }
        }
      };
      evaluateDelta(
        `core-blue-${slot}`,
        'survivability',
        '🛡️ SURVIVABILITY BOOST',
        'blue',
        `Add +170k Armor on ${slot.toUpperCase()} Core`,
        `Switch ${slot.toUpperCase()} Core from Weapon Damage (+15%) to Blue Armor (+170,000)`,
        `Increases maximum armor pool by +170k to survive high-difficulty heroic/legendary burst damage.`,
        copy
      );
    }
  });

  // 3. CHEST & BACKPACK TALENT TWEAKS (For High-End / Named pieces)
  const chestPiece = gear['chest'];
  if (chestPiece && (chestPiece.kind === 'brand' || chestPiece.kind === 'named')) {
    const candidateChestTalents = [
      { name: 'Obliterate', desc: 'Crits grant up to +25% Total Weapon Damage stacks' },
      { name: 'Spotter', desc: 'Amplifies Total Weapon and Skill damage by 15% to pulsed enemies' },
      { name: 'Glass Cannon', desc: 'All damage dealt is amplified by 25% (takes 50% more dmg)' },
      { name: 'Unbreakable', desc: 'When armor is depleted, repair 95% of armor within 3s' }
    ];

    candidateChestTalents.forEach(t => {
      if (chestPiece.talent !== t.name) {
        const copy = {
          ...gear,
          chest: { ...chestPiece, talent: t.name, isTalentRecalibrated: true }
        };
        const isDefensive = t.name === 'Unbreakable';
        evaluateDelta(
          `talent-chest-${t.name.toLowerCase()}`,
          isDefensive ? 'survivability' : 'dps',
          isDefensive ? '🛡️ DEFENSIVE TALENT' : '⚡ CHEST TALENT',
          isDefensive ? 'blue' : 'orange',
          `Equip '${t.name}' on Chest`,
          `Change Chest Talent to '${t.name}' (${t.desc})`,
          `Swaps chest talent to '${t.name}' to test active combat output vs current talent.`,
          copy
        );
      }
    });
  }

  const bpPiece = gear['backpack'];
  if (bpPiece && (bpPiece.kind === 'brand' || bpPiece.kind === 'named')) {
    const candidateBpTalents = [
      { name: 'Vigilance', desc: '+25% Total Weapon Damage (disabled 4s on taking damage)' },
      { name: 'Companion', desc: '+15% Total Weapon Damage while within 5m of an ally or skill' },
      { name: 'Composure', desc: '+15% Total Weapon Damage while in cover' },
      { name: 'Bloodsucker', desc: 'Killing an enemy adds +10% bonus armor stack for 10s (up to 10 stacks)' },
      { name: 'Adrenaline Rush', desc: 'Whenever you are within 10m of an enemy, gain 20% bonus armor' }
    ];

    candidateBpTalents.forEach(t => {
      if (bpPiece.talent !== t.name) {
        const copy = {
          ...gear,
          backpack: { ...bpPiece, talent: t.name, isTalentRecalibrated: true }
        };
        const isDefensive = ['Bloodsucker', 'Adrenaline Rush'].includes(t.name);
        evaluateDelta(
          `talent-bp-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          isDefensive ? 'survivability' : 'dps',
          isDefensive ? '🛡️ BONUS ARMOR TALENT' : '⚡ BACKPACK TALENT',
          isDefensive ? 'blue' : 'orange',
          `Equip '${t.name}' on Backpack`,
          `Change Backpack Talent to '${t.name}' (${t.desc})`,
          `Applies '${t.name}' to the backpack slot to compare multiplier terms.`,
          copy
        );
      }
    });
  }

  // 4. BEST-IN-SLOT HIGH-END / BRAND SWAPS (Fox's Prayer, Contractor's Gloves, Grupo, Ceska)
  // Check Kneepads for Fox's Prayer (+8% DtOOC)
  const knees = gear['kneepads'];
  if (knees && knees.name !== "Fox's Prayer" && knees.kind !== 'exotic') {
    const copy = {
      ...gear,
      kneepads: {
        slot: 'kneepads' as GearSlot,
        kind: 'named' as const,
        name: "Fox's Prayer",
        brandOrSetId: 'overlord-armaments',
        core: { type: 'Weapon Damage' as const, value: 0.15, isRecalibrated: false },
        minors: [
          { attribute: 'Damage to Target Out of Cover', value: 0.08, unit: '%' },
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
        ],
        modSlot: null
      }
    };
    evaluateDelta(
      'swap-foxs-prayer',
      'brand',
      '🔥 BEST-IN-SLOT ITEM',
      'purple',
      "Equip Fox's Prayer on Kneepads (+8% DtOOC)",
      "Swap Kneepads to Fox's Prayer (Overlord Named Knees)",
      "Fox's Prayer provides +8% Damage to Target Out of Cover as a multiplicative Group 4 modifier.",
      copy
    );
  }

  // Check Gloves for Contractor's Gloves (+8% DtA)
  const gloves = gear['gloves'];
  if (gloves && gloves.name !== "Contractor's Gloves" && gloves.kind !== 'exotic') {
    const copy = {
      ...gear,
      gloves: {
        slot: 'gloves' as GearSlot,
        kind: 'named' as const,
        name: "Contractor's Gloves",
        brandOrSetId: 'petrov-defense-group',
        core: { type: 'Weapon Damage' as const, value: 0.15, isRecalibrated: false },
        minors: [
          { attribute: 'Damage to Armor', value: 0.08, unit: '%' },
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
        ],
        modSlot: null
      }
    };
    evaluateDelta(
      'swap-contractors-gloves',
      'brand',
      '🔥 BEST-IN-SLOT ITEM',
      'purple',
      "Equip Contractor's Gloves (+8% DtA)",
      "Swap Gloves to Contractor's Gloves (Petrov Named Gloves)",
      "Contractor's Gloves provide +8% Damage to Armor as a separate multiplicative term.",
      copy
    );
  }

  // 5. EXOTIC GEAR CHECK: If no exotic gear is equipped, suggest Coyote's Mask or Overdogs
  const hasExoticGear = Object.values(gear).some(p => p && p.kind === 'exotic');
  if (!hasExoticGear) {
    // Suggest Coyote's Mask
    const mask = gear['mask'];
    if (mask) {
      const copy = {
        ...gear,
        mask: {
          slot: 'mask' as GearSlot,
          kind: 'exotic' as const,
          name: "Coyote's Mask",
          brandOrSetId: 'coyotes-mask',
          core: { type: 'Weapon Damage' as const, value: 0.15, isRecalibrated: false },
          minors: [
            { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
            { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
          ],
          modSlot: { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
        }
      };
      evaluateDelta(
        'exotic-coyotes-mask',
        'dps',
        '👑 EXOTIC UPGRADE',
        'amber',
        "Equip Coyote's Mask (Exotic Mask)",
        "Equip Coyote's Mask in Mask Slot (Pack Instincts Team/Self Crit Buff)",
        "Provides up to +25% Critical Hit Damage / +10% CHC based on combat engagement distance.",
        copy
      );
    }
  }

  // 6. 2-STEP COMBO TWEAKS ("Change X and Y to get MUCH BETTER Z")
  // Combo A: 2-Core Bruiser Shift (2 Red -> 2 Blue) + Bloodsucker Backpack
  const redCoreSlots = ALL_SLOTS.filter(s => gear[s]?.core?.type === 'Weapon Damage' && gear[s]?.kind !== 'exotic');
  if (redCoreSlots.length >= 2 && bpPiece && (bpPiece.kind === 'brand' || bpPiece.kind === 'named')) {
    const slotA = redCoreSlots[0];
    const slotB = redCoreSlots[1];
    const copy = {
      ...gear,
      [slotA]: { ...gear[slotA], core: { type: 'Armor' as const, value: 170000, isRecalibrated: true } },
      [slotB]: { ...gear[slotB], core: { type: 'Armor' as const, value: 170000, isRecalibrated: true } },
      backpack: { ...bpPiece, talent: 'Bloodsucker', isTalentRecalibrated: true }
    };
    evaluateDelta(
      'combo-bruiser',
      'combo',
      '🔥 2-STEP SYNERGY',
      'purple',
      `Shift 2 Cores to Armor + Bloodsucker (+340k Armor Bruiser)`,
      `1. Recalibrate ${slotA.toUpperCase()} & ${slotB.toUpperCase()} Cores to Blue Armor (+340k total)\n2. Equip Bloodsucker on Backpack (+10% bonus armor per kill)`,
      `Converts a fragile glass build into a high-sustain aggressive bruiser with over 1.3M Armor and stacking bonus shields.`,
      copy
    );
  }

  // Combo B: Fox's Prayer + Obliterate Chest
  if (knees && knees.name !== "Fox's Prayer" && chestPiece && chestPiece.talent !== 'Obliterate' && (chestPiece.kind === 'brand' || chestPiece.kind === 'named')) {
    const copy = {
      ...gear,
      kneepads: {
        slot: 'kneepads' as GearSlot,
        kind: 'named' as const,
        name: "Fox's Prayer",
        brandOrSetId: 'overlord-armaments',
        core: { type: 'Weapon Damage' as const, value: 0.15, isRecalibrated: false },
        minors: [
          { attribute: 'Damage to Target Out of Cover', value: 0.08, unit: '%' },
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
        ],
        modSlot: null
      },
      chest: {
        ...chestPiece,
        talent: 'Obliterate',
        isTalentRecalibrated: true
      }
    };
    evaluateDelta(
      'combo-fox-obliterate',
      'combo',
      '🔥 2-STEP SYNERGY',
      'purple',
      "Fox's Prayer Knees + Obliterate Chest (+33% Combined Term Stacking)",
      "1. Equip Fox's Prayer Kneepads (+8% DtOOC Multiplier)\n2. Roll Chest Talent to Obliterate (+25% Total Weapon Damage)",
      "Combines multiplicative Group 4 damage with high Total Weapon Damage stacks for a massive sustained DPS surge.",
      copy
    );
  }

  // 7. WEAPON ATTRIBUTE & TALENT TUNING
  if (weapon && !weapon.isExotic) {
    // 7A. Weapon 3rd Minor Attribute -> DtOOC (+10%)
    if (weapon.minorAttribute?.attribute !== 'Damage to Target Out of Cover') {
      const copyWeapon: WeaponInstance = {
        ...weapon,
        minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' }
      };
      evaluateDelta(
        'weapon-dtooc-minor',
        'dps',
        '🎯 WEAPON OPTIMISATION',
        'orange',
        `Roll Weapon 3rd Attribute to +10% DtOOC`,
        `Change 3rd Minor on ${weapon.name} to Damage to Target Out of Cover (+10%)`,
        `Damage to Target Out of Cover acts as a multiplicative Group 4 damage amplifier.`,
        gear,
        copyWeapon
      );
    }

    // 7B. Weapon Talents
    const candidateWeaponTalents = [
      { name: 'Flatline', desc: '+15% Amplified damage to pulsed enemies' },
      { name: 'Strained', desc: 'Up to +50% Critical Hit Damage over firing duration' },
      { name: 'Fast Hands', desc: 'Crits reduce reload time by up to 80%' },
      { name: 'Optimist', desc: 'Up to +30% Weapon Damage as magazine empties' },
      { name: 'In Sync', desc: '+15% Weapon & Skill Damage upon skill/weapon hit' },
      { name: 'Killer', desc: 'Killing with a crit gives +40% CHD for 10s' }
    ];

    candidateWeaponTalents.forEach(t => {
      if (weapon.talent !== t.name) {
        const copyWeapon: WeaponInstance = {
          ...weapon,
          talent: t.name
        };
        evaluateDelta(
          `weapon-talent-${t.name.toLowerCase()}`,
          'dps',
          '⚡ WEAPON TALENT',
          'orange',
          `Equip '${t.name}' Talent on ${weapon.name}`,
          `Roll Weapon Talent on ${weapon.name} to '${t.name}' (${t.desc})`,
          `Applies '${t.name}' weapon perk to test performance gain over your current perk.`,
          gear,
          copyWeapon
        );
      }
    });
  }

  // Sort: Cap fixes first, then highest DPS gains, then Survivability
  return suggestions.sort((a, b) => {
    // Cap fixes first
    if (a.category === 'cap-fix' && b.category !== 'cap-fix') return -1;
    if (b.category === 'cap-fix' && a.category !== 'cap-fix') return 1;
    // Highest DPS gain
    if (Math.abs(b.deltaSustainedDpsPct - a.deltaSustainedDpsPct) > 0.5) {
      return b.deltaSustainedDpsPct - a.deltaSustainedDpsPct;
    }
    // Highest Armor gain
    return b.deltaArmor - a.deltaArmor;
  });
}
