import {
  GearSlot,
  GearPieceInstance,
  WeaponInstance,
  WatchStats,
  CombatContext,
  BonusTerm,
  ActiveSetBonus,
  ComputedLoadoutStats
} from './types';
import { calculateMultiplierBreakdown, calculateDamageMetrics } from './multipliers';
import { validateLoadoutLegality } from './constraints';
import { calculatePestilencePlague, calculateStrikerGamble, calculateHeartstopper, calculateHuntersFury, calculateFafnirAmplifier, calculateTruePatriotRedFlag, calculateOrtizHeatstroke } from './special-cases';

// Load static data for brand bonuses and gear set bonuses
import brandSetsData from '../../../data/brand-sets.json';
import gearSetsData from '../../../data/gear-sets.json';

const brandMap = new Map(brandSetsData.map((b: any) => [b.id, b]));
const gearSetMap = new Map(gearSetsData.map((s: any) => [s.id, s]));

export function calculateLoadout(
  gear: Record<GearSlot, GearPieceInstance>,
  activeWeapon: WeaponInstance,
  watch: WatchStats = {},
  specialization: string = 'Gunner',
  context: CombatContext = { isSolo: true, distanceMeters: 15 }
): ComputedLoadoutStats {
  const bonuses: BonusTerm[] = [];
  const warnings: string[] = [];
  const confidenceFlags = new Set<string>();

  // 1. Check for NinjaBike Messenger Backpack
  const hasNinjaBike = Object.values(gear).some(
    p => p && p.kind === 'exotic' && (p.name.toLowerCase().includes('ninjabike') || p.brandOrSetId.includes('ninjabike')) && p.slot === 'backpack'
  );

  // 2. Count Brand and Gear Set pieces
  const brandCounts = new Map<string, number>();
  const gearSetCounts = new Map<string, number>();

  for (const piece of Object.values(gear)) {
    if (!piece) continue;

    // Cores
    if (piece.core) {
      if (piece.core.type === 'Weapon Damage') {
        bonuses.push({ group: 'Weapon Damage', value: piece.core.value, source: `${piece.name} (Core)` });
      } else if (piece.core.type === 'Skill Tier') {
        bonuses.push({ group: 'Utility', value: piece.core.value, source: `${piece.name} (Skill Tier)` });
      }
    }

    // Minors
    for (const m of piece.minors) {
      const attrLower = m.attribute.toLowerCase();
      if (attrLower.includes('crit') && attrLower.includes('chance')) {
        bonuses.push({ group: 'Critical Hit Chance', value: m.value, source: `${piece.name} (Minor CHC)` });
      } else if (attrLower.includes('crit') && attrLower.includes('damage')) {
        bonuses.push({ group: 'Critical Hit Damage', value: m.value, source: `${piece.name} (Minor CHD)` });
      } else if (attrLower.includes('headshot')) {
        bonuses.push({ group: 'Headshot Damage', value: m.value, source: `${piece.name} (Minor HSD)` });
      } else if (attrLower.includes('weapon handling')) {
        bonuses.push({ group: 'Utility', value: m.value, source: `${piece.name} (Handling)` });
      } else if (attrLower.includes('skill damage')) {
        bonuses.push({ group: 'Skill Damage', value: m.value, source: `${piece.name} (Skill Damage)`, beneficiary: 'self' });
      } else if (attrLower.includes('skill haste') || attrLower.includes('haste')) {
        bonuses.push({ group: 'Utility', value: m.value, source: `${piece.name} (Skill Haste)`, beneficiary: 'self' });
      } else if (attrLower.includes('status')) {
        bonuses.push({ group: 'Status Effects', value: m.value, source: `${piece.name} (Status Effects)`, beneficiary: 'self' });
      } else if (attrLower.includes('repair')) {
        bonuses.push({ group: 'Skill Repair', value: m.value, source: `${piece.name} (Skill Repair)`, beneficiary: 'self' });
      } else if (attrLower.includes('hazard')) {
        bonuses.push({ group: 'Utility', value: m.value, source: `${piece.name} (Hazard Protection)`, beneficiary: 'self' });
      } else if (attrLower.includes('threat')) {
        bonuses.push({ group: 'Utility', value: m.value, source: `${piece.name} (Threat)`, beneficiary: 'self' });
      }
    }

    // Gear Mod Slot
    if (piece.modSlot) {
      const modAttrLower = piece.modSlot.attribute.toLowerCase();
      if (modAttrLower.includes('crit') && modAttrLower.includes('chance')) {
        bonuses.push({ group: 'Critical Hit Chance', value: piece.modSlot.value, source: `${piece.name} (Mod CHC)`, beneficiary: 'self' });
      } else if (modAttrLower.includes('crit') && modAttrLower.includes('damage')) {
        bonuses.push({ group: 'Critical Hit Damage', value: piece.modSlot.value, source: `${piece.name} (Mod CHD)`, beneficiary: 'self' });
      } else if (modAttrLower.includes('headshot')) {
        bonuses.push({ group: 'Headshot Damage', value: piece.modSlot.value, source: `${piece.name} (Mod HSD)`, beneficiary: 'self' });
      } else if (modAttrLower.includes('skill haste') || modAttrLower.includes('haste')) {
        bonuses.push({ group: 'Utility', value: piece.modSlot.value, source: `${piece.name} (Mod Skill Haste)`, beneficiary: 'self' });
      } else if (modAttrLower.includes('repair')) {
        bonuses.push({ group: 'Skill Repair', value: piece.modSlot.value, source: `${piece.name} (Mod Skill Repair)`, beneficiary: 'self' });
      }
    }

    // Gear Set or Brand identification
    if (piece.kind === 'gear-set') {
      const current = gearSetCounts.get(piece.brandOrSetId) || 0;
      gearSetCounts.set(piece.brandOrSetId, current + 1);
    } else if (piece.kind === 'brand' || piece.kind === 'named') {
      const current = brandCounts.get(piece.brandOrSetId) || 0;
      brandCounts.set(piece.brandOrSetId, current + 1);
    }
  }

  // 3. Resolve Active Brand Bonuses
  const activeBrandBonuses: ActiveSetBonus[] = [];
  for (const [brandId, count] of brandCounts.entries()) {
    const brand = brandMap.get(brandId);
    if (!brand) continue;

    if (brand.confidence) confidenceFlags.add(brand.confidence);
    const effectiveCount = hasNinjaBike ? count + 1 : count;

    const brandBonusList: Array<{ attribute: string; value: number; unit: string; raw: string }> = [];

    if (effectiveCount >= 1 && brand.bonus1pc) {
      brandBonusList.push(brand.bonus1pc);
      addParsedBonusToGroup(bonuses, brand.bonus1pc, `${brand.name} 1pc`);
    }
    if (effectiveCount >= 2 && brand.bonus2pc) {
      brandBonusList.push(brand.bonus2pc);
      addParsedBonusToGroup(bonuses, brand.bonus2pc, `${brand.name} 2pc`);
    }
    if (effectiveCount >= 3 && brand.bonus3pc) {
      brandBonusList.push(brand.bonus3pc);
      addParsedBonusToGroup(bonuses, brand.bonus3pc, `${brand.name} 3pc`);
    }

    if (brandBonusList.length > 0) {
      activeBrandBonuses.push({
        setName: brand.name,
        piecesCount: count,
        effectivePiecesCount: effectiveCount,
        tierUnlocked: Math.min(3, effectiveCount),
        bonuses: brandBonusList
      });
    }
  }

  // 4. Resolve Active Gear Set Bonuses
  const activeSetBonuses: ActiveSetBonus[] = [];
  for (const [setId, count] of gearSetCounts.entries()) {
    const set = gearSetMap.get(setId);
    if (!set) continue;

    if (set.confidence) confidenceFlags.add(set.confidence);
    const effectiveCount = hasNinjaBike ? count + 1 : count;
    const setBonusList: Array<{ attribute: string; value: number; unit: string; raw: string }> = [];

    if (effectiveCount >= 2 && set.bonuses2pc) {
      for (const b of set.bonuses2pc) {
        setBonusList.push(b);
        addParsedBonusToGroup(bonuses, b, `${set.name} 2pc`);
      }
    }
    if (effectiveCount >= 3 && set.bonuses3pc) {
      for (const b of set.bonuses3pc) {
        setBonusList.push(b);
        addParsedBonusToGroup(bonuses, b, `${set.name} 3pc`);
      }
    }

    const hasChestTalent = gear.chest?.kind === 'gear-set' && gear.chest?.brandOrSetId === setId;
    const hasBackpackTalent = gear.backpack?.kind === 'gear-set' && gear.backpack?.brandOrSetId === setId;

    if (effectiveCount >= 4) {
      // 4pc Talent is active
      if (setId === 'tipping-scales') {
        const stacks = context.throttleControlStacks !== undefined ? context.throttleControlStacks : (hasChestTalent ? 75 : 50);
        const perStackChd = hasBackpackTalent ? 0.08 : 0.05;
        const totalChd = stacks * perStackChd;
        bonuses.push({
          group: 'Critical Hit Damage',
          value: totalChd,
          source: `Tipping Scales (${stacks} stacks${hasBackpackTalent ? ' + Snowball' : ''})`
        });
        bonuses.push({
          group: 'Utility',
          value: stacks * 0.005,
          source: `Tipping Scales Handling (${stacks} stacks)`
        });
      } else if (setId.includes('striker')) {
        const stacks = context.strikerStacks !== undefined ? context.strikerStacks : (hasChestTalent ? 200 : 100);
        const res = calculateStrikerGamble(stacks, hasBackpackTalent, hasChestTalent);
        bonuses.push({
          group: 'Amplifier',
          value: res.factor - 1,
          source: `Striker's Gamble (${stacks} stacks${hasBackpackTalent ? ' + Risk Management' : ''})`,
          isIndependentAmp: true,
          confidence: res.confidence
        });
      } else if (setId.includes('heartbreaker')) {
        const stacks = context.heartstopperStacks !== undefined ? context.heartstopperStacks : (hasChestTalent ? 100 : 50);
        const res = calculateHeartstopper(stacks, hasChestTalent);
        bonuses.push({
          group: 'Amplifier',
          value: res.factor - 1,
          source: `Heartbreaker Heartstopper (${stacks} stacks vs Pulsed)`,
          isIndependentAmp: true,
          confidence: '[PDF]'
        });
      } else if (setId.includes('hunter')) {
        const res = calculateHuntersFury(context.distanceMeters <= 15, context.huntersFuryKillStacks || 0);
        if (context.distanceMeters <= 15) {
          bonuses.push({
            group: 'Amplifier',
            value: 0.20,
            source: "Hunter's Fury (Apex Predator <=15m)",
            isIndependentAmp: true
          });
        }
        if (context.huntersFuryKillStacks && context.huntersFuryKillStacks > 0) {
          bonuses.push({
            group: 'Amplifier',
            value: res.killAmp - 1,
            source: `Hunter's Fury (${context.huntersFuryKillStacks} kill stacks)`,
            isIndependentAmp: true
          });
        }
      } else if (setId.includes('eclipse-protocol')) {
        if (hasBackpackTalent && context.isEnemyStatusAffected) {
          // Solo/Self damage amplifier
          bonuses.push({
            group: 'Amplifier',
            value: 0.30,
            source: 'Eclipse Protocol (Symptom Aggravator: +30% to status-affected)',
            isIndependentAmp: true,
            condition: 'Self-only damage vs status targets'
          });
        }
      } else if (setId.includes('true-patriot')) {
        const res = calculateTruePatriotRedFlag(hasBackpackTalent);
        bonuses.push({
          group: 'Amplifier',
          value: res.ampValue,
          source: `True Patriot Red Flag (+${res.ampValue * 100}% debuff to target)`,
          isIndependentAmp: true,
          confidence: '[PDF]'
        });
      } else if (setId.includes('ortiz-exuro')) {
        if (hasBackpackTalent && context.isEnemyBurning) {
          const res = calculateOrtizHeatstroke(true);
          bonuses.push({
            group: 'Amplifier',
            value: res.factor - 1,
            source: 'Ortiz Exuro Heatstroke (+40% amp vs Turret Burned)',
            isIndependentAmp: true,
            confidence: '[PDF]'
          });
        }
      }
    }

    if (setBonusList.length > 0 || effectiveCount >= 4) {
      activeSetBonuses.push({
        setName: set.name,
        piecesCount: count,
        effectivePiecesCount: effectiveCount,
        tierUnlocked: effectiveCount >= 4 ? 4 : (effectiveCount >= 3 ? 3 : 2),
        bonuses: setBonusList,
        talent: effectiveCount >= 4 ? set.talent4pc : null
      });
    }
  }

  // 5. Gear Talents on Chest & Backpack (High-End & Named)
  if (gear.chest?.talent && gear.chest.kind !== 'gear-set') {
    const talent = gear.chest.talent.toLowerCase();
    if (talent.includes('obliterate')) {
      bonuses.push({ group: 'Total Weapon Damage', value: 0.25, source: 'Obliterate (Max stacks)' });
    } else if (talent.includes('glass cannon')) {
      const isPerfect = talent.includes('perfect');
      bonuses.push({ group: 'Amplifier', value: isPerfect ? 0.30 : 0.25, source: 'Glass Cannon', isIndependentAmp: true });
    } else if (talent.includes('spotter')) {
      if (context.isEnemyPulsed) {
        const isPerfect = talent.includes('perfect');
        bonuses.push({ group: 'Amplifier', value: isPerfect ? 0.20 : 0.15, source: 'Spotter (vs Pulsed)', isIndependentAmp: true });
      }
    } else if (talent.includes('focus')) {
      bonuses.push({ group: 'Total Weapon Damage', value: 0.50, source: 'Focus (Full zoom)' });
    }
  }

  if (gear.backpack?.talent && gear.backpack.kind !== 'gear-set') {
    const talent = gear.backpack.talent.toLowerCase();
    if (talent.includes('vigilance')) {
      const isPerfect = talent.includes('perfect');
      bonuses.push({ group: 'Total Weapon Damage', value: 0.25, source: isPerfect ? 'The Gift (Vigilance)' : 'Vigilance' });
    } else if (talent.includes('composure')) {
      bonuses.push({ group: 'Total Weapon Damage', value: 0.15, source: 'Composure (In Cover)' });
    } else if (talent.includes('companion')) {
      bonuses.push({ group: 'Total Weapon Damage', value: 0.15, source: 'Companion' });
    } else if (talent.includes('concussion')) {
      const isPerfect = talent.includes('perfect');
      bonuses.push({ group: 'Total Weapon Damage', value: isPerfect ? 0.20 : 0.10, source: 'Concussion' });
    } else if (talent.includes('wicked')) {
      if (context.isEnemyStatusAffected) {
        bonuses.push({ group: 'Total Weapon Damage', value: 0.18, source: 'Wicked' });
      }
    } else if (talent.includes('creeping death')) {
      bonuses.push({ group: 'Utility', value: 0, source: talent.includes('perfect') ? 'The Courier (Perfect Creeping Death)' : 'Creeping Death' });
    }
  }

  // 6. Specific Gear Exotics
  for (const piece of Object.values(gear)) {
    if (!piece || piece.kind !== 'exotic') continue;
    const name = piece.name.toLowerCase();

    if (name.includes('coyote')) {
      if (context.distanceMeters >= 25) {
        bonuses.push({ group: 'Critical Hit Chance', value: 0.25, source: "Coyote's Mask (25m+ range band)" });
      } else if (context.distanceMeters >= 15) {
        bonuses.push({ group: 'Critical Hit Chance', value: 0.10, source: "Coyote's Mask (15-25m band)" });
        bonuses.push({ group: 'Critical Hit Damage', value: 0.10, source: "Coyote's Mask (15-25m band)" });
      } else {
        bonuses.push({ group: 'Critical Hit Damage', value: 0.25, source: "Coyote's Mask (0-15m band)" });
      }
    } else if (name.includes('overdogs')) {
      bonuses.push({
        group: 'Amplifier',
        value: 0.30,
        source: 'Overdogs (Weakest Link: +30% amp to lowest-tier targets)',
        isIndependentAmp: true,
        confidence: '[PDF]'
      });
    } else if (name.includes('vile')) {
      bonuses.push({
        group: 'Utility',
        value: 0,
        source: 'Vile Mask (Toxic Delivery: status applies DoT based on grenade damage)',
        confidence: '[PDF]'
      });
    }
  }

  // 7. Weapon Stats & Fixed Secondaries
  if (activeWeapon) {
    if (activeWeapon.coreAttribute?.value) {
      bonuses.push({ group: 'Weapon Damage', value: activeWeapon.coreAttribute.value, source: `${activeWeapon.name} (Core WD)` });
    }
    if (activeWeapon.secondaryCoreAttribute) {
      const secAttr = activeWeapon.secondaryCoreAttribute.type.toLowerCase();
      const val = activeWeapon.secondaryCoreAttribute.value;
      if (secAttr.includes('crit') && secAttr.includes('chance')) {
        bonuses.push({ group: 'Critical Hit Chance', value: val, source: `${activeWeapon.name} (2nd Core CHC)` });
      } else if (secAttr.includes('crit') && secAttr.includes('damage')) {
        bonuses.push({ group: 'Critical Hit Damage', value: val, source: `${activeWeapon.name} (2nd Core CHD)` });
      } else if (secAttr.includes('headshot')) {
        bonuses.push({ group: 'Headshot Damage', value: val, source: `${activeWeapon.name} (2nd Core HSD)` });
      } else if (secAttr.includes('out of cover')) {
        if (context.isEnemyOutOfCover !== false) {
          bonuses.push({ group: 'Amplifier', value: val, source: `${activeWeapon.name} (DtTOoC)`, isIndependentAmp: true });
        }
      } else if (secAttr.includes('armor')) {
        bonuses.push({ group: 'Amplifier', value: val, source: `${activeWeapon.name} (DtA)`, isIndependentAmp: true });
      } else if (secAttr.includes('health')) {
        bonuses.push({ group: 'Amplifier', value: val, source: `${activeWeapon.name} (Health Dmg)`, isIndependentAmp: true });
      }
    }

    if (activeWeapon.minorAttribute) {
      const mAttr = activeWeapon.minorAttribute.attribute.toLowerCase();
      const val = activeWeapon.minorAttribute.value;
      if (mAttr.includes('crit') && mAttr.includes('chance')) {
        bonuses.push({ group: 'Critical Hit Chance', value: val, source: `${activeWeapon.name} (Minor CHC)` });
      } else if (mAttr.includes('crit') && mAttr.includes('damage')) {
        bonuses.push({ group: 'Critical Hit Damage', value: val, source: `${activeWeapon.name} (Minor CHD)` });
      } else if (mAttr.includes('headshot')) {
        bonuses.push({ group: 'Headshot Damage', value: val, source: `${activeWeapon.name} (Minor HSD)` });
      } else if (mAttr.includes('out of cover')) {
        if (context.isEnemyOutOfCover !== false) {
          bonuses.push({ group: 'Amplifier', value: val, source: `${activeWeapon.name} (Minor DtTOoC)`, isIndependentAmp: true });
        }
      } else if (mAttr.includes('armor')) {
        bonuses.push({ group: 'Amplifier', value: val, source: `${activeWeapon.name} (Minor DtA)`, isIndependentAmp: true });
      }
    }

    if (activeWeapon.name.toLowerCase().includes('fafnir')) {
      const stBonus = context.activeStatusEffectBonus || 0.60;
      const res = calculateFafnirAmplifier(stBonus);
      bonuses.push({
        group: 'Amplifier',
        value: res.ampValue,
        source: `Fafnir Dragon's Breath (+${Math.round(res.ampValue * 100)}% amp from Status Effects)`,
        isIndependentAmp: true,
        confidence: res.confidence
      });
    }
  }

  // 8. SHD Watch Maxima
  if (watch) {
    if (watch.weaponDamage) bonuses.push({ group: 'Weapon Damage', value: watch.weaponDamage, source: 'SHD Watch (WD)' });
    if (watch.critChance) bonuses.push({ group: 'Critical Hit Chance', value: watch.critChance, source: 'SHD Watch (CHC)' });
    if (watch.critDamage) bonuses.push({ group: 'Critical Hit Damage', value: watch.critDamage, source: 'SHD Watch (CHD)' });
    if (watch.headshotDamage) bonuses.push({ group: 'Headshot Damage', value: watch.headshotDamage, source: 'SHD Watch (HSD)' });
    if (watch.skillDamage) bonuses.push({ group: 'Skill Damage', value: watch.skillDamage, source: 'SHD Watch (Skill Damage)' });
    if (watch.skillRepair) bonuses.push({ group: 'Skill Repair', value: watch.skillRepair, source: 'SHD Watch (Skill Repair)' });
  }

  // 9. Specialization Passives
  if (specialization === 'Gunner') {
    bonuses.push({ group: 'Weapon Damage', value: 0.15, source: 'Gunner (Onslaught 15% LMG)' });
    bonuses.push({ group: 'Rate of Fire', value: 0.05, source: 'Gunner (Barrage)' });
  } else if (specialization === 'Sharpshooter') {
    bonuses.push({ group: 'Headshot Damage', value: 0.15, source: 'Sharpshooter (One in the Head 15% HSD)' });
  } else if (specialization === 'Survivalist') {
    bonuses.push({ group: 'Amplifier', value: 0.10, source: 'Survivalist Tactical Link (+10% to status targets)', isIndependentAmp: true });
  }

  // 10. Multiplier Group Calculation
  const innateHsd = activeWeapon ? activeWeapon.innateHsd : 0.55;
  const breakdown = calculateMultiplierBreakdown(bonuses, innateHsd);

  // 11. Calculate Damage Metrics
  const baseDmg = activeWeapon ? activeWeapon.baseDamage : 50000;
  const rpm = activeWeapon ? activeWeapon.rpm : 600;
  const mag = activeWeapon ? activeWeapon.magSize : 30;
  const reload = activeWeapon ? activeWeapon.reloadTime : 2.0;

  const metrics = calculateDamageMetrics(baseDmg, breakdown, rpm, mag, reload);

  // 12. Calculate Damage-Over-Time (DoT) and Debuff Tick Damage from weapon/gear sources
  let dotTickDamage = 0;
  if (activeWeapon && ((activeWeapon.talent && activeWeapon.talent.toLowerCase().includes('plague')) || (activeWeapon.name && activeWeapon.name.toLowerCase().includes('pestilence')))) {
    const res = calculatePestilencePlague(
      baseDmg,
      breakdown.weaponDamageSum,
      breakdown.totalWeaponDamageSum,
      breakdown.totalAmplifierMultiplier,
      50
    );
    dotTickDamage = res.dpsTick;
  }

  // 13. Warnings & Diminishing Returns Check
  if (breakdown.critChance >= 0.60) {
    warnings.push('Critical Hit Chance is capped at 60%. Any further CHC rolls provide 0 value.');
  }

  let redCores = 0;
  let blueCores = 0;
  let yellowCores = 0;
  let totalArmorPercentBonus = 0;
  let totalHealthBonus = 0;

  for (const piece of Object.values(gear)) {
    if (!piece || !piece.core) continue;
    if (piece.core.type === 'Weapon Damage') redCores++;
    else if (piece.core.type === 'Armor') blueCores++;
    else if (piece.core.type === 'Skill Tier') yellowCores++;
  }

  // Calculate base armor and total armor
  const baseArmor = 726000;
  const totalArmor = (baseArmor + blueCores * 170000) * (1 + (watch?.armor || 0));
  const baseHealth = 330000;
  const totalHealth = baseHealth * (1 + (watch?.health || 0));
  const effectiveHealth = totalArmor + totalHealth;

  const legality = validateLoadoutLegality(gear);
  // Calculate total skill haste
  let totalSkillHaste = watch?.skillHaste || 0;
  for (const b of bonuses) {
    if (b.source.toLowerCase().includes('skill haste') || b.source.toLowerCase().includes('haste')) {
      totalSkillHaste += b.value;
    }
  }

  return {
    effectiveBulletDamage: metrics.expectedHit,
    effectiveCritHitDamage: metrics.critHit,
    effectiveHeadshotDamage: metrics.headshotHit,
    effectiveHeadshotCritDamage: metrics.headshotCrit,
    expectedDamagePerShot: metrics.expectedHit,
    burstDps: metrics.burstDps,
    sustainedDps: metrics.sustainedDps,
    dotTickDamage: dotTickDamage || undefined,
    totalArmor,
    totalHealth,
    effectiveHealth,
    threatMultiplier: breakdown.threatMultiplier,
    hazardProtection: Math.min(1.0, breakdown.hazardProtectionSum + (watch?.hazardProtection || 0)),
    skillHasteSum: totalSkillHaste,
    skillTier: yellowCores,
    activeSetBonuses,
    activeBrandBonuses,
    groupBreakdown: breakdown,
    warnings: [...warnings, ...legality.warnings],
    confidenceFlags: Array.from(confidenceFlags),
    itemisationValid: legality.valid,
    itemisationErrors: legality.errors
  };
}

function addParsedBonusToGroup(bonuses: BonusTerm[], bonus: { attribute: string; value: number; unit: string; raw: string }, sourcePrefix: string) {
  if (!bonus || bonus.value === null || bonus.value === undefined) return;
  const attrLower = bonus.attribute.toLowerCase();
  const source = `${sourcePrefix} (${bonus.attribute})`;

  if (attrLower.includes('crit') && attrLower.includes('chance')) {
    bonuses.push({ group: 'Critical Hit Chance', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('crit') && attrLower.includes('damage')) {
    bonuses.push({ group: 'Critical Hit Damage', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('headshot')) {
    bonuses.push({ group: 'Headshot Damage', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('reload')) {
    bonuses.push({ group: 'Utility', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('magazine') || attrLower.includes('mag size') || (attrLower.includes('mag') && !attrLower.includes('damage') && !attrLower.includes('marksman'))) {
    bonuses.push({ group: 'Utility', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('handling')) {
    bonuses.push({ group: 'Utility', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('rate of fire') || attrLower === 'rof') {
    bonuses.push({ group: 'Rate of Fire', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('damage to armor') || attrLower.includes('dta')) {
    bonuses.push({ group: 'Amplifier', value: bonus.value, source, isIndependentAmp: true, beneficiary: 'self' });
  } else if (attrLower.includes('status')) {
    bonuses.push({ group: 'Status Effects', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('hazard')) {
    bonuses.push({ group: 'Utility', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('threat')) {
    bonuses.push({ group: 'Utility', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('skill haste') || attrLower.includes('haste')) {
    bonuses.push({ group: 'Utility', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('skill damage')) {
    bonuses.push({ group: 'Skill Damage', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('repair')) {
    bonuses.push({ group: 'Skill Repair', value: bonus.value, source, beneficiary: 'self' });
  } else if (attrLower.includes('weapon damage') || attrLower.includes('lmg damage') || attrLower.includes('rifle damage') || attrLower.includes('smg damage') || attrLower.includes('shotgun damage') || attrLower.includes('assault rifle damage') || attrLower.includes('marksman rifle damage')) {
    bonuses.push({ group: 'Weapon Damage', value: bonus.value, source, beneficiary: 'self' });
  }
}
