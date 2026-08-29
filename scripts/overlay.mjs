import fs from 'fs';
import path from 'path';

/**
 * Standardize multiplier group names
 */
export function normalizeMultiplierGroup(groupStr) {
  if (!groupStr) return 'Utility';
  const s = String(groupStr).replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = s.toLowerCase();

  if (lower.includes('exponential') || lower.includes('1.04^') || lower.includes('stacks exponentially')) {
    return 'Amplifier (Exponential)';
  }
  if (lower.includes('additive to all weapon damage and critical hit damage') || lower.includes('additive to all wd and chd')) {
    return 'Weapon Damage / Critical Hit Damage';
  }
  if (lower.includes('additive to all weapon damage') || lower.includes('additive to weapon damage')) {
    return 'Weapon Damage';
  }
  if (lower.includes('critical hit damage and rate of fire') || lower.includes('chd and rate of fire') || lower.includes('chd and rof')) {
    return 'Critical Hit Damage / Rate of Fire';
  }
  if (lower.includes('spec weapon amplifier') || lower.includes('signature moves') || lower.includes('total weapon damage / sig amp') || lower.includes('total weapon damage spec weapon amplifier')) {
    return 'Total Weapon Damage / Amplifier';
  }
  if (lower.includes('red = amplifier') || lower.includes('red: amplifier')) {
    return 'Amplifier (Red Flag)';
  }
  if (lower.includes('amplifier') || lower.includes('amp')) {
    if (lower.includes('bullet')) return 'Amplifier (Bullet)';
    if (lower.includes('armor') || lower.includes('plates')) return 'Amplifier (Armor Only)';
    if (lower.includes('1 + 0.035') || lower.includes('pellet')) return 'Amplifier (Pellet)';
    return 'Amplifier';
  }
  if (lower === 'weapon damage' || lower === 'all weapon damage') return 'Weapon Damage';
  if (lower === 'total weapon damage' || lower === 'twd') return 'Total Weapon Damage';
  if (lower === 'critical hit damage' || lower === 'crit damage' || lower === 'chd') return 'Critical Hit Damage';
  if (lower === 'critical hit chance' || lower === 'crit chance' || lower === 'chc') return 'Critical Hit Chance';
  if (lower === 'critical chance / hit damage' || lower === 'chc / chd') return 'Critical Hit Chance / Damage';
  if (lower === 'headshot damage' || lower === 'head shot damage' || lower === 'hsd') return 'Headshot Damage';
  if (lower === 'total skill damage' || lower === 'tsd') return 'Total Skill Damage';
  if (lower === 'skill damage') return 'Skill Damage';
  if (lower === 'skill repair' || lower === 'total skill repair') return 'Skill Repair';
  if (lower === 'total: skill damage / repair' || lower.includes('skill damage / repair') || lower.includes('skill damage/repair') || lower.includes('skill damage / status effects')) return 'Total Skill Damage / Repair';
  if (lower.includes('total: weapon damage / skill damage') || lower.includes('weapon damage/ skill damage') || lower.includes('weapon damage / skill damage') || lower.includes('total weapon/ skill damage') || lower.includes('total weapon / skill damage')) return 'Total Weapon Damage / Skill Damage';
  if (lower.includes('rof / weapon damage') || lower.includes('rof / total weapon damage') || lower === 'rate of fire') return 'Rate of Fire / Weapon Damage';
  if (lower === 'status effect' || lower === 'status effects') return 'Status Effects';
  if (lower === 'explosive damage') return 'Explosive Damage';
  if (lower === 'utility') return 'Utility';
  if (lower.includes('separate mult') || lower.includes('separate multiplier') || lower.includes('heartstopper')) return 'Separate Multiplier';
  if (lower.includes('guides')) return 'Special (Headhunter)';

  return s;
}

/**
 * Apply corrections and additions to the extracted dataset.
 */
export function applyOverlay(extracted, corrections) {
  const data = JSON.parse(JSON.stringify(extracted));

  // 1. Brands with verified PDF status vs SHEET
  const sheetOnlyBrands = new Set([
    'alps-summit-armaments',
    'edelweiss-gpz',
    'shiny-monkey',
    'brazos-de-arcabuz',
    'uzina-getica',
    'yaahl-gear',
    'providence-defense'
  ]);

  for (const brand of data.brandSets) {
    const isSheetOnly = sheetOnlyBrands.has(brand.id);
    brand.confidence = isSheetOnly ? '[SHEET]' : '[PDF]';
  }

  // Apply the four brand corrections
  for (const corr of corrections.brandCorrections) {
    const brand = data.brandSets.find(b => b.name.toLowerCase().includes(corr.brand.toLowerCase()));
    if (brand) {
      if (corr.slot === '1pc') {
        brand.bonus1pcRaw = corr.correctedValue;
        brand.bonus1pc = corr.parsed;
      } else if (corr.slot === '2pc') {
        brand.bonus2pcRaw = corr.correctedValue;
        brand.bonus2pc = corr.parsed;
      } else if (corr.slot === '3pc') {
        brand.bonus3pcRaw = corr.correctedValue;
        brand.bonus3pc = corr.parsed;
      }
      brand.confidence = corr.confidence;
      brand.correctionNote = corr.reason;
    }
  }

  // 2. Gear sets: check if Ember Engine is present or add it
  for (const set of data.gearSets) {
    set.confidence = (set.name.toLowerCase().includes('murakami') || set.isPTS) ? '[SHEET]' : '[PDF]';
    set.normalizedMultiplierGroup = normalizeMultiplierGroup(set.multiplierGroup);
  }

  // Ensure Ember Engine has all verified fields
  let ember = data.gearSets.find(s => s.name.toLowerCase().includes('ember engine'));
  if (!ember) {
    const emberCorr = corrections.gearSetCorrections.find(c => c.name === 'Ember Engine');
    if (emberCorr) {
      data.gearSets.push({
        id: 'ember-engine',
        name: 'Ember Engine',
        isPTS: false,
        coreAttribute: emberCorr.coreAttribute,
        bonuses2pc: emberCorr.bonuses2pc,
        bonuses3pc: emberCorr.bonuses3pc,
        bonus2pcRaw: emberCorr.bonuses2pc[0].raw,
        bonus3pcRaw: emberCorr.bonuses3pc[0].raw,
        talent4pc: emberCorr.talent4pc,
        chestTalent: emberCorr.chestTalent,
        backpackTalent: emberCorr.backpackTalent,
        multiplierGroup: emberCorr.multiplierGroup,
        normalizedMultiplierGroup: normalizeMultiplierGroup(emberCorr.multiplierGroup),
        dropLocations: 'LZ / Targeted Loot / Red Horizon Season Caches',
        notes: emberCorr.notes,
        confidence: emberCorr.confidence
      });
    }
  } else {
    const emberCorr = corrections.gearSetCorrections.find(c => c.name === 'Ember Engine');
    if (emberCorr) {
      ember.coreAttribute = emberCorr.coreAttribute;
      ember.bonuses2pc = emberCorr.bonuses2pc;
      ember.bonuses3pc = emberCorr.bonuses3pc;
      ember.talent4pc = emberCorr.talent4pc;
      ember.chestTalent = emberCorr.chestTalent;
      ember.backpackTalent = emberCorr.backpackTalent;
      ember.confidence = emberCorr.confidence;
      ember.notes = emberCorr.notes;
    }
  }

  // 3. Named Gear & Exotics Additions
  for (const item of corrections.namedGearAdditions) {
    const exists = data.gearNamed.some(g => g.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      data.gearNamed.push({
        id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: item.name,
        slot: item.slot,
        brand: item.brand,
        isExotic: false,
        talent: item.talent,
        talentDesc: item.talentDesc,
        coreAttribute: item.coreAttribute,
        minor1: item.minor1,
        minor2: item.minor2,
        minor3: item.minor3,
        source: item.source,
        confidence: item.confidence,
        notes: 'Red Horizon named gear addition'
      });
    }
  }

  for (const item of corrections.exoticGearAdditions) {
    const exists = data.gearNamed.some(g => g.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      data.gearNamed.push({
        id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: item.name,
        slot: item.slot,
        brand: null,
        isExotic: true,
        talent: item.talent,
        talentDesc: item.talentDesc,
        coreAttribute: item.coreAttribute,
        minor1: item.minor1,
        minor2: item.minor2,
        minor3: item.minor3,
        source: item.source,
        confidence: item.confidence,
        notes: 'Red Horizon exotic chest'
      });
    }
  }

  // 4. Named Weapons & Exotics Additions
  for (const item of corrections.exoticWeaponAdditions) {
    const exists = data.weaponsNamed.some(w => w.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      data.weaponsNamed.push({
        id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: item.name,
        category: item.category,
        family: item.family,
        isExotic: true,
        talentOrPerk: item.talentOrPerk,
        exoticMods: item.exoticMods,
        source: item.source,
        confidence: item.confidence,
        notes: item.notes
      });
    }
  }

  for (const item of corrections.namedWeaponAdditions) {
    const exists = data.weaponsNamed.some(w => w.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      data.weaponsNamed.push({
        id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: item.name,
        category: item.category,
        family: item.family,
        isExotic: false,
        talentOrPerk: item.talentOrPerk,
        source: item.source,
        confidence: item.confidence,
        notes: 'Red Horizon named weapon addition'
      });
    }
  }

  // 5. Weapon Talents: Additions & Corrections
  for (const item of corrections.talentAdditions) {
    if (item.type === 'weapon') {
      const exists = data.talentsWeapon.some(t => t.name.toLowerCase() === item.name.toLowerCase());
      if (!exists) {
        data.talentsWeapon.push({
          id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: item.name,
          perfectName: item.perfectName,
          description: item.description,
          multiplierGroup: item.multiplierGroup,
          normalizedMultiplierGroup: normalizeMultiplierGroup(item.multiplierGroup),
          confidence: item.confidence
        });
      }
    }
  }

  for (const corr of corrections.talentCorrections) {
    if (corr.type === 'weapon') {
      const talent = data.talentsWeapon.find(t => t.name.toLowerCase() === corr.name.toLowerCase());
      if (talent) {
        talent.description = corr.newValue;
        talent.confidence = corr.confidence;
        talent.correctionReason = corr.reason;
      }
    }
  }

  // Normalize all talent multiplier groups
  for (const t of data.talentsWeapon) {
    t.normalizedMultiplierGroup = normalizeMultiplierGroup(t.multiplierGroup);
    if (!t.confidence) t.confidence = '[SHEET]';
  }
  for (const t of data.talentsGear) {
    t.normalizedMultiplierGroup = normalizeMultiplierGroup(t.multiplierGroup);
    if (!t.confidence) t.confidence = '[SHEET]';
  }

  // Attach weapon buffs and seasonal modifiers
  data.weaponBuffs = corrections.weaponBuffs;
  data.seasonalModifiers = corrections.seasonalModifiers;

  return data;
}
