import { GearSlot, GearPieceInstance, WeaponInstance, ComputedLoadoutStats, WatchStats, CombatContext } from '../calc/types';
import { calculateLoadout } from '../calc/loadout-calculator';
import { OptimizationObjective, OptimizerConstraints, CandidateBuild } from './types';

// Load static dataset
import brandSetsData from '../../../data/brand-sets.json';
import gearSetsData from '../../../data/gear-sets.json';
import gearNamedData from '../../../data/gear-named.json';

const brandSets = brandSetsData as any[];
const gearSets = gearSetsData as any[];
const namedGear = gearNamedData as any[];

/**
 * Generate candidate builds and optimize towards the selected objective.
 */
export function runOptimization(
  currentGear: Record<GearSlot, GearPieceInstance>,
  activeWeapon: WeaponInstance,
  objective: OptimizationObjective,
  constraints: OptimizerConstraints = {},
  watch: WatchStats = { weaponDamage: 0.10, critChance: 0.10, critDamage: 0.20, headshotDamage: 0.20 },
  specialization: string = 'Gunner',
  context: CombatContext = { isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true }
): CandidateBuild[] {
  const currentStats = calculateLoadout(currentGear, activeWeapon, watch, specialization, context);
  const candidates: CandidateBuild[] = [];

  // Generate candidate loadouts across known high-tier archetypes
  const archetypes = getArchetypeTemplates(activeWeapon, constraints);

  for (const template of archetypes) {
    // Check constraints early
    if (constraints.requiredGearSetId) {
      const count = Object.values(template.gear).filter(p => p.kind === 'gear-set' && p.brandOrSetId === constraints.requiredGearSetId).length;
      if (count < 4) continue;
    }
    if (constraints.requiredExoticId) {
      const hasExotic = Object.values(template.gear).some(p => p.kind === 'exotic' && (p.brandOrSetId === constraints.requiredExoticId || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(constraints.requiredExoticId)));
      if (!hasExotic) continue;
    }
    if (constraints.requiredBrandId) {
      const hasBrand = Object.values(template.gear).some(p => p.brandOrSetId === constraints.requiredBrandId);
      if (!hasBrand) continue;
    }

    const stats = calculateLoadout(template.gear, activeWeapon, watch, specialization, context);

    // Filter by min armor / min skill tier
    if (constraints.minArmor && stats.totalArmor < constraints.minArmor) continue;
    if (constraints.minSkillTier && stats.skillTier < constraints.minSkillTier) continue;

    // Score based on objective
    let score = 0;
    switch (objective) {
      case 'max_sustained_dps':
        score = stats.sustainedDps;
        break;
      case 'max_burst_dps':
        score = stats.burstDps;
        break;
      case 'max_bullet_hit':
        score = stats.effectiveBulletDamage;
        break;
      case 'max_plague_damage':
        score = (stats.pestilencePlagueTickDamage || 0) * 10 + stats.sustainedDps * 0.3;
        break;
      case 'max_status_effects':
        score = stats.groupBreakdown.statusEffectsSum * 10000 + stats.skillTier * 2000;
        break;
      case 'max_skill_damage':
        score = stats.groupBreakdown.skillDamageSum * 5000 + stats.skillTier * 3000;
        break;
      case 'max_armor_dps':
        score = (stats.totalArmor / 1000) * 0.4 + (stats.sustainedDps / 1000) * 0.6;
        break;
    }

    const tradeoffs = generateTradeoffs(currentStats, stats, currentGear, template.gear);

    candidates.push({
      id: template.id,
      name: template.name,
      gear: template.gear,
      weapon: activeWeapon,
      score,
      stats,
      tradeoffAnalysis: tradeoffs
    });
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Return top 5 unique candidates
  return candidates.slice(0, 5);
}

/**
 * Generate human-readable comparison of trade-offs between current and proposed build.
 */
function generateTradeoffs(
  current: ComputedLoadoutStats,
  proposed: ComputedLoadoutStats,
  currentGear: Record<GearSlot, GearPieceInstance>,
  proposedGear: Record<GearSlot, GearPieceInstance>
): string[] {
  const notes: string[] = [];

  // DPS / Damage Delta
  const dpsDeltaPct = ((proposed.sustainedDps - current.sustainedDps) / (current.sustainedDps || 1)) * 100;
  if (Math.abs(dpsDeltaPct) > 1) {
    if (dpsDeltaPct > 0) {
      notes.push(`+${dpsDeltaPct.toFixed(1)}% Sustained DPS improvement (${Math.round(proposed.sustainedDps).toLocaleString()} vs ${Math.round(current.sustainedDps).toLocaleString()}).`);
    } else {
      notes.push(`${dpsDeltaPct.toFixed(1)}% Sustained DPS change (${Math.round(proposed.sustainedDps).toLocaleString()} vs ${Math.round(current.sustainedDps).toLocaleString()}).`);
    }
  }

  // Bullet hit delta
  const bulletDeltaPct = ((proposed.effectiveBulletDamage - current.effectiveBulletDamage) / (current.effectiveBulletDamage || 1)) * 100;
  if (Math.abs(bulletDeltaPct) > 1) {
    notes.push(`Average single-bullet expected hit is ${bulletDeltaPct > 0 ? '+' : ''}${bulletDeltaPct.toFixed(1)}% (${Math.round(proposed.effectiveBulletDamage).toLocaleString()}).`);
  }

  // Armor Delta
  const armorDelta = proposed.totalArmor - current.totalArmor;
  if (Math.abs(armorDelta) >= 100000) {
    notes.push(`Total Armor ${armorDelta > 0 ? '+' : ''}${Math.round(armorDelta / 1000)}k (${Math.round(proposed.totalArmor / 1000)}k vs ${Math.round(current.totalArmor / 1000)}k).`);
  }

  // Multiplier group shifts
  const curChc = current.groupBreakdown.critChance;
  const propChc = proposed.groupBreakdown.critChance;
  if (propChc >= 0.60 && curChc < 0.60) {
    notes.push(`Caps Critical Hit Chance at the 60% engine ceiling.`);
  }

  const curChd = current.groupBreakdown.critDamage;
  const propChd = proposed.groupBreakdown.critDamage;
  if (propChd - curChd > 0.50) {
    notes.push(`Massive +${Math.round((propChd - curChd) * 100)}% Critical Hit Damage increase from stacking Throttle Control.`);
  }

  // Check amplifiers
  const propAmps = proposed.groupBreakdown.amplifiers.length;
  const curAmps = current.groupBreakdown.amplifiers.length;
  if (propAmps > curAmps) {
    notes.push(`Adds independent multiplicative damage amplifier terms (${proposed.groupBreakdown.amplifiers.map(a => a.source).join(', ')}).`);
  }

  // Minor attribute budget note for gear sets
  let gearSetCount = 0;
  for (const p of Object.values(proposedGear)) {
    if (p.kind === 'gear-set') gearSetCount++;
  }
  if (gearSetCount >= 4) {
    notes.push(`4pc Gear Set: Trades 4 minor attribute slots (-4 minor rolls) for powerful set talent.`);
  }

  return notes;
}

/**
 * Returns pre-constructed archetype templates tuned for fast exploration.
 */
function getArchetypeTemplates(
  weapon: WeaponInstance,
  constraints: OptimizerConstraints
): Array<{ id: string; name: string; gear: Record<GearSlot, GearPieceInstance> }> {
  const isPestilence = weapon.name.toLowerCase().includes('pestilence') || weapon.category === 'LMG';

  return [
    // 1. Tipping Scales 4pc + Coyote's + Overdogs (Red DPS)
    {
      id: 'tipping-scales-red-dps',
      name: 'Tipping Scales Red DPS (Coyote + Overdogs)',
      gear: {
        mask: { slot: 'mask', kind: 'exotic', name: "Coyote's Mask", brandOrSetId: 'coyotes-mask', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } },
        backpack: { slot: 'backpack', kind: 'gear-set', name: 'Tipping Scales Backpack', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }, talent: 'Snowball' },
        chest: { slot: 'chest', kind: 'gear-set', name: 'Tipping Scales Chest', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }, talent: 'Sustainability' },
        gloves: { slot: 'gloves', kind: 'exotic', name: 'Overdogs', brandOrSetId: 'overdogs', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }] },
        holster: { slot: 'holster', kind: 'gear-set', name: 'Tipping Scales Holster', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'gear-set', name: 'Tipping Scales Kneepads', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
      }
    },
    // 2. Striker 4pc + Coyote's + Fox's Prayer (Classic Striker DPS)
    {
      id: 'striker-classic-dps',
      name: "Striker's Battlegear DPS (Coyote + Fox's Prayer)",
      gear: {
        mask: { slot: 'mask', kind: 'exotic', name: "Coyote's Mask", brandOrSetId: 'coyotes-mask', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } },
        backpack: { slot: 'backpack', kind: 'gear-set', name: "Striker's Backpack", brandOrSetId: 'striker-s-battlegear', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }, talent: 'Risk Management' },
        chest: { slot: 'chest', kind: 'gear-set', name: "Striker's Chest", brandOrSetId: 'striker-s-battlegear', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }, talent: 'Press the Advantage' },
        gloves: { slot: 'gloves', kind: 'gear-set', name: "Striker's Gloves", brandOrSetId: 'striker-s-battlegear', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
        holster: { slot: 'holster', kind: 'gear-set', name: "Striker's Holster", brandOrSetId: 'striker-s-battlegear', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'named', name: "Fox's Prayer", brandOrSetId: 'overlord-armaments', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: true }, minors: [{ attribute: 'Damage to Target Out of Cover', value: 0.08, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
      }
    },
    // 3. Heartbreaker 4pc (Survivable Hybrid DPS)
    {
      id: 'heartbreaker-survivable-dps',
      name: 'Heartbreaker Survivable Hybrid (4 Blue / 2 Red)',
      gear: {
        mask: { slot: 'mask', kind: 'exotic', name: "Coyote's Mask", brandOrSetId: 'coyotes-mask', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } },
        backpack: { slot: 'backpack', kind: 'gear-set', name: 'Heartbreaker Backpack', brandOrSetId: 'heartbreaker', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } },
        chest: { slot: 'chest', kind: 'gear-set', name: 'Heartbreaker Chest', brandOrSetId: 'heartbreaker', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }, talent: 'Max BPM' },
        gloves: { slot: 'gloves', kind: 'exotic', name: 'Overdogs', brandOrSetId: 'overdogs', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }] },
        holster: { slot: 'holster', kind: 'gear-set', name: 'Heartbreaker Holster', brandOrSetId: 'heartbreaker', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'gear-set', name: 'Heartbreaker Kneepads', brandOrSetId: 'heartbreaker', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
      }
    },
    // 4. Eclipse Protocol 4pc + Vile + The Courier (Group Control ST6)
    {
      id: 'eclipse-group-control',
      name: 'Eclipse Protocol Group Crowd Control (Vile + The Courier)',
      gear: {
        mask: { slot: 'mask', kind: 'exotic', name: 'Vile', brandOrSetId: 'vile', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Hazard Protection', value: 0.10, unit: '%' }] },
        backpack: { slot: 'backpack', kind: 'named', name: 'The Courier', brandOrSetId: 'habsburg-guard', core: { type: 'Skill Tier', value: 1, isRecalibrated: true }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }], talent: 'Perfect Creeping Death' },
        chest: { slot: 'chest', kind: 'gear-set', name: 'Eclipse Chest', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Proliferation' },
        gloves: { slot: 'gloves', kind: 'gear-set', name: 'Eclipse Gloves', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
        holster: { slot: 'holster', kind: 'gear-set', name: 'Eclipse Holster', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'gear-set', name: 'Eclipse Kneepads', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] }
      }
    },
    // 5. Eclipse Protocol 4pc + Symptom Aggravator + Electrique (Solo Control ST6)
    {
      id: 'eclipse-solo-control',
      name: 'Eclipse Protocol Solo Damage Control (Symptom Aggravator + Electrique)',
      gear: {
        mask: { slot: 'mask', kind: 'exotic', name: 'Vile', brandOrSetId: 'vile', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Hazard Protection', value: 0.10, unit: '%' }] },
        backpack: { slot: 'backpack', kind: 'gear-set', name: 'Eclipse Backpack', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Symptom Aggravator' },
        chest: { slot: 'chest', kind: 'gear-set', name: 'Eclipse Chest', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Proliferation' },
        gloves: { slot: 'gloves', kind: 'gear-set', name: 'Eclipse Gloves', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
        holster: { slot: 'holster', kind: 'gear-set', name: 'Eclipse Holster', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'brand', name: 'Electrique Kneepads', brandOrSetId: 'electrique', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }] }
      }
    },
    // 6. True Patriot 4pc + Overdogs + Fox's Prayer (Team Debuff Amp)
    {
      id: 'true-patriot-team-debuff',
      name: 'True Patriot Team Debuff (30% Group Amp)',
      gear: {
        mask: { slot: 'mask', kind: 'gear-set', name: 'True Patriot Mask', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
        backpack: { slot: 'backpack', kind: 'gear-set', name: 'True Patriot Backpack', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], talent: 'Patriotic Boost' },
        chest: { slot: 'chest', kind: 'gear-set', name: 'True Patriot Chest', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], talent: 'Waving the Flag' },
        gloves: { slot: 'gloves', kind: 'exotic', name: 'Overdogs', brandOrSetId: 'overdogs', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }] },
        holster: { slot: 'holster', kind: 'gear-set', name: 'True Patriot Holster', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'named', name: "Fox's Prayer", brandOrSetId: 'overlord-armaments', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: true }, minors: [{ attribute: 'Damage to Target Out of Cover', value: 0.08, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
      }
    },
    // 7. Pure High-End Brand Red DPS (3pc Providence + Ceska + Grupo + Fox's Prayer)
    {
      id: 'high-end-pure-red',
      name: 'High-End Pure Red DPS (Providence + Ceska + Grupo + Fox)',
      gear: {
        mask: { slot: 'mask', kind: 'brand', name: 'Providence Mask', brandOrSetId: 'providence-defense', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }], modSlot: { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' } },
        backpack: { slot: 'backpack', kind: 'named', name: 'The Gift', brandOrSetId: 'providence-defense', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }], modSlot: { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, talent: 'Perfect Vigilance' },
        chest: { slot: 'chest', kind: 'brand', name: 'Ceska Chest', brandOrSetId: 'ceska-vyroba-s-r-o', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }], modSlot: { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, talent: 'Obliterate' },
        gloves: { slot: 'gloves', kind: 'brand', name: 'Grupo Gloves', brandOrSetId: 'grupo-sombra-s-a-s', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }] },
        holster: { slot: 'holster', kind: 'brand', name: 'Providence Holster', brandOrSetId: 'providence-defense', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }] },
        kneepads: { slot: 'kneepads', kind: 'named', name: "Fox's Prayer", brandOrSetId: 'overlord-armaments', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: true }, minors: [{ attribute: 'Damage to Target Out of Cover', value: 0.08, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
      }
    }
  ];
}
