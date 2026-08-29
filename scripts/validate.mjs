/**
 * Strict validator for Division Config dataset.
 * Fails loudly on any data anomaly or missing patch requirement.
 */

const ALLOWED_MULTIPLIER_GROUPS = new Set([
  'Weapon Damage',
  'Total Weapon Damage',
  'Critical Hit Chance',
  'Critical Hit Damage',
  'Critical Hit Chance / Damage',
  'Weapon Damage / Critical Hit Damage',
  'Critical Hit Damage / Rate of Fire',
  'Headshot Damage',
  'Skill Damage',
  'Total Skill Damage',
  'Skill Repair',
  'Total Skill Damage / Repair',
  'Total Weapon Damage / Skill Damage',
  'Total Weapon Damage / Amplifier',
  'Rate of Fire / Weapon Damage',
  'Status Effects',
  'Skill Damage / Status Effects',
  'Explosive Damage',
  'Amplifier',
  'Amplifier (Bullet)',
  'Amplifier (Armor Only)',
  'Amplifier (Pellet)',
  'Amplifier (Exponential)',
  'Amplifier (Red Flag)',
  'Separate Multiplier',
  'Special (Headhunter)',
  'Utility'
]);

export function validateDataset(data) {
  const errors = [];
  const warnings = [];

  function checkNaN(obj, path = '') {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'number') {
      if (isNaN(obj)) errors.push(`NaN numeric detected at: ${path}`);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, idx) => checkNaN(item, `${path}[${idx}]`));
    } else if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        checkNaN(v, path ? `${path}.${k}` : k);
      }
    }
  }

  // 1. Check for NaN across entire dataset
  checkNaN(data);

  // 2. Check 4 Brand Corrections
  const lengmo = data.brandSets.find(b => b.name.toLowerCase().includes('lengmo'));
  if (!lengmo || lengmo.bonus1pc?.value !== 0.15 || !lengmo.bonus1pcRaw.includes('15%')) {
    errors.push(`Lengmo 1pc brand correction missing or wrong (expected 15% Reload Speed, got ${lengmo?.bonus1pcRaw})`);
  }

  const chinaLight = data.brandSets.find(b => b.name.toLowerCase().includes('china light'));
  if (!chinaLight || chinaLight.bonus2pc?.value !== 0.20 || !chinaLight.bonus2pcRaw.includes('20%')) {
    errors.push(`China Light 2pc brand correction missing or wrong (expected 20% Status Effects, got ${chinaLight?.bonus2pcRaw})`);
  }

  const electrique = data.brandSets.find(b => b.name.toLowerCase().includes('electrique'));
  if (!electrique || !electrique.bonus2pcRaw.includes('Hazard Protection') || electrique.bonus2pc?.value !== 0.20) {
    errors.push(`Electrique 2pc brand correction missing or wrong (expected 20% Hazard Protection, got ${electrique?.bonus2pcRaw})`);
  }

  const tactical511 = data.brandSets.find(b => b.name.toLowerCase().includes('5.11'));
  if (!tactical511 || tactical511.bonus1pc?.value !== 0.12 || !tactical511.bonus1pcRaw.includes('12%')) {
    errors.push(`5.11 Tactical 1pc brand correction missing or wrong (expected 12% Protection from Elites, got ${tactical511?.bonus1pcRaw})`);
  }

  // 3. Check Gear Sets
  if (!data.gearSets || data.gearSets.length < 27) {
    errors.push(`Gear sets count is too low: expected at least 27, got ${data.gearSets?.length}`);
  }

  for (const set of data.gearSets) {
    if (!set.name) errors.push(`Gear set missing name: ${JSON.stringify(set)}`);
    if (!set.coreAttribute) errors.push(`Gear set "${set.name}" missing core attribute`);
    if (!set.bonuses2pc || set.bonuses2pc.length === 0) errors.push(`Gear set "${set.name}" missing 2pc bonus`);
    if (!set.bonuses3pc || set.bonuses3pc.length === 0) errors.push(`Gear set "${set.name}" missing 3pc bonus`);
    if (!set.talent4pc) errors.push(`Gear set "${set.name}" missing 4pc talent`);
    if (!set.chestTalent) errors.push(`Gear set "${set.name}" missing chest talent`);
    if (!set.backpackTalent) errors.push(`Gear set "${set.name}" missing backpack talent`);

    if (set.normalizedMultiplierGroup && !ALLOWED_MULTIPLIER_GROUPS.has(set.normalizedMultiplierGroup)) {
      errors.push(`Unmapped multiplier group on gear set "${set.name}": "${set.normalizedMultiplierGroup}"`);
    }
  }

  // Spot-check 3 gear sets against reference §4
  const tippingScales = data.gearSets.find(s => s.name === 'Tipping Scales');
  if (!tippingScales) {
    errors.push('Tipping Scales gear set missing');
  } else {
    if (!tippingScales.bonus2pcRaw?.toLowerCase().includes('mag') && !tippingScales.bonus3pcRaw?.toLowerCase().includes('mag')) {
      errors.push(`Tipping Scales missing 30% Mag Size bonus (got 2pc: ${tippingScales.bonus2pcRaw}, 3pc: ${tippingScales.bonus3pcRaw})`);
    }
    if (!tippingScales.talent4pc?.includes('Throttle Control')) {
      errors.push(`Tipping Scales 4pc talent expected Throttle Control, got ${tippingScales.talent4pc}`);
    }
    if (!tippingScales.chestTalent?.includes('Sustainability')) {
      errors.push(`Tipping Scales chest talent expected Sustainability, got ${tippingScales.chestTalent}`);
    }
    if (!tippingScales.backpackTalent?.includes('Snowball')) {
      errors.push(`Tipping Scales backpack talent expected Snowball, got ${tippingScales.backpackTalent}`);
    }
  }

  const striker = data.gearSets.find(s => s.name.includes("Striker"));
  if (!striker) {
    errors.push("Striker's Battlegear gear set missing");
  } else {
    if (!striker.talent4pc?.includes("Striker’s Gamble") && !striker.talent4pc?.includes("Striker's Gamble")) {
      errors.push(`Striker 4pc talent expected Striker's Gamble, got ${striker.talent4pc}`);
    }
    if (!striker.chestTalent?.includes("Press the Advantage")) {
      errors.push(`Striker chest talent expected Press the Advantage, got ${striker.chestTalent}`);
    }
    if (!striker.backpackTalent?.includes("Risk Management")) {
      errors.push(`Striker backpack talent expected Risk Management, got ${striker.backpackTalent}`);
    }
  }

  const eclipse = data.gearSets.find(s => s.name.includes("Eclipse Protocol"));
  if (!eclipse) {
    errors.push("Eclipse Protocol gear set missing");
  } else {
    if (!eclipse.talent4pc?.includes("Indirect Transmission")) {
      errors.push(`Eclipse 4pc talent expected Indirect Transmission, got ${eclipse.talent4pc}`);
    }
    if (!eclipse.backpackTalent?.includes("Symptom Aggravator")) {
      errors.push(`Eclipse backpack talent expected Symptom Aggravator, got ${eclipse.backpackTalent}`);
    }
  }

  // 4. Check Red Horizon Additions
  const requiredRedHorizon = [
    { type: 'exoticWeapon', name: 'Fafnir', list: data.weaponsNamed },
    { type: 'exoticGear', name: 'Iron Will', list: data.gearNamed },
    { type: 'namedGear', name: 'Trick Shot', list: data.gearNamed },
    { type: 'namedGear', name: 'Rushdown', list: data.gearNamed },
    { type: 'namedGear', name: 'Melon Baller', list: data.gearNamed },
    { type: 'namedGear', name: 'Keeper', list: data.gearNamed },
    { type: 'namedWeapon', name: 'Teapot', list: data.weaponsNamed },
    { type: 'namedWeapon', name: 'Steamer', list: data.weaponsNamed },
    { type: 'gearSet', name: 'Ember Engine', list: data.gearSets },
    { type: 'talent', name: 'Boiling Point', list: data.talentsWeapon }
  ];

  for (const item of requiredRedHorizon) {
    const found = item.list.some(x => x.name.toLowerCase().includes(item.name.toLowerCase()));
    if (!found) {
      errors.push(`Missing Red Horizon addition: ${item.type} "${item.name}"`);
    }
  }

  // Check Determined rework
  const determined = data.talentsWeapon.find(t => t.name.toLowerCase() === 'determined');
  if (!determined || !determined.description.includes('no longer chain')) {
    errors.push('Determined talent rework is missing or has old description');
  }

  // 5. Check Talents Multiplier Groups
  for (const t of data.talentsWeapon) {
    if (!ALLOWED_MULTIPLIER_GROUPS.has(t.normalizedMultiplierGroup)) {
      errors.push(`Unmapped multiplier group on weapon talent "${t.name}": "${t.normalizedMultiplierGroup}"`);
    }
  }
  for (const t of data.talentsGear) {
    if (!ALLOWED_MULTIPLIER_GROUPS.has(t.normalizedMultiplierGroup)) {
      errors.push(`Unmapped multiplier group on gear talent "${t.name}": "${t.normalizedMultiplierGroup}"`);
    }
  }

  // 6. Check Weapons
  if (!data.weapons || data.weapons.length < 300) {
    errors.push(`Weapons count too low: expected ~317, got ${data.weapons?.length}`);
  }

  // 7. Check Attribute Info Caps
  if (!data.attributes?.gearCore || data.attributes.gearCore.length === 0) {
    errors.push('Attribute info missing gearCore');
  }
  if (!data.attributes?.statusImmunities || data.attributes.statusImmunities.length === 0) {
    errors.push('Attribute info missing statusImmunities');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
