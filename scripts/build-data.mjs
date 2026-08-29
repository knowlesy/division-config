import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { runExtract } from './extract.mjs';
import { applyOverlay } from './overlay.mjs';
import { validateDataset } from './validate.mjs';

function computeHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function buildData() {
  const rootDir = process.cwd();
  const spreadsheetPath = path.resolve(rootDir, 'Division 2 Gear Spreadsheet.xlsx');
  const referenceDocPath = path.resolve(rootDir, 'D2_Build_Reference_Y8S3.md');
  const correctionsPath = path.resolve(rootDir, 'data/corrections.json');
  const outputDir = path.resolve(rootDir, 'data');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('--- Step 1: Extracting Spreadsheet ---');
  const extracted = runExtract(spreadsheetPath);

  console.log('--- Step 2: Applying Overlay & Patch Corrections ---');
  const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
  const finalData = applyOverlay(extracted, corrections);

  console.log('--- Step 3: Validating Dataset ---');
  const valResult = validateDataset(finalData);

  if (!valResult.valid) {
    console.error('❌ Data validation FAILED with the following errors:');
    valResult.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('✅ Data validation PASSED successfully!');

  // Canonical Multiplier Groups definition
  const multiplierGroups = [
    {
      id: 'weapon-damage',
      name: 'Weapon Damage',
      type: 'additive',
      description: 'Increases all weapon damage or weapon-type specific damage. Additive within group.'
    },
    {
      id: 'total-weapon-damage',
      name: 'Total Weapon Damage',
      type: 'additive',
      description: 'Increases total weapon damage. Additive with other Total Weapon Damage bonuses, multiplicative with Weapon Damage.'
    },
    {
      id: 'critical-hit-chance',
      name: 'Critical Hit Chance',
      type: 'stat',
      cap: 0.60,
      description: 'Probability of landing a critical hit. Hard capped at 60%.'
    },
    {
      id: 'critical-hit-damage',
      name: 'Critical Hit Damage',
      type: 'additive',
      description: 'Multiplier applied on critical hits. Additive with other CHD bonuses.'
    },
    {
      id: 'headshot-damage',
      name: 'Headshot Damage',
      type: 'additive',
      description: 'Multiplier applied on headshots. Additive with weapon innate HSD and other HSD bonuses.'
    },
    {
      id: 'skill-damage',
      name: 'Skill Damage',
      type: 'additive',
      description: 'Increases base skill damage. Additive within group.'
    },
    {
      id: 'total-skill-damage',
      name: 'Total Skill Damage',
      type: 'additive',
      description: 'Increases total skill damage. Multiplicative with Skill Damage.'
    },
    {
      id: 'skill-repair',
      name: 'Skill Repair',
      type: 'additive',
      description: 'Increases healing and repair skill effectiveness.'
    },
    {
      id: 'status-effects',
      name: 'Status Effects',
      type: 'additive',
      description: 'Increases status effect duration and tick damage.'
    },
    {
      id: 'rate-of-fire',
      name: 'Rate of Fire',
      type: 'multiplicative_stat',
      description: 'Increases weapon rounds per minute (RPM).'
    },
    {
      id: 'amplifier',
      name: 'Amplifier',
      type: 'multiplicative_independent',
      description: 'NEVER additive with anything, including other amplifiers. Each amplifier is an independent multiplicative term.'
    },
    {
      id: 'utility',
      name: 'Utility',
      type: 'utility',
      description: 'Provides non-damage utility such as cooldown reduction, armor repair, or ammo management.'
    }
  ];

  // Metadata
  const meta = {
    appName: 'Division Config',
    patch: 'Y8S3 / TU30 / 2.34',
    generatedAt: new Date().toISOString(),
    spreadsheetHash: computeHash(spreadsheetPath),
    referenceDocHash: computeHash(referenceDocPath),
    correctionsHash: computeHash(correctionsPath),
    counts: {
      weapons: finalData.weapons.length,
      weaponsNamedAndExotic: finalData.weaponsNamed.length,
      gearSets: finalData.gearSets.length,
      brandSets: finalData.brandSets.length,
      gearNamedAndExotic: finalData.gearNamed.length,
      weaponTalents: finalData.talentsWeapon.length,
      gearTalents: finalData.talentsGear.length,
      weaponMods: finalData.modsWeapon.length,
      skills: finalData.skills.length,
      specializations: finalData.specializations.length
    },
    credits: {
      spreadsheetAuthors: ['Azurmen', 'Bend3n', 'Gingerbeard_x', 'Maplestruck', 'Saint Landwalker'],
      community: '#build-advice on the Division 2 Discord'
    }
  };

  console.log('--- Step 4: Emitting Data Files ---');
  writeJson(path.join(outputDir, 'weapons.json'), finalData.weapons);
  writeJson(path.join(outputDir, 'weapons-named.json'), finalData.weaponsNamed);
  writeJson(path.join(outputDir, 'gear-sets.json'), finalData.gearSets);
  writeJson(path.join(outputDir, 'brand-sets.json'), finalData.brandSets);
  writeJson(path.join(outputDir, 'gear-named.json'), finalData.gearNamed);
  writeJson(path.join(outputDir, 'talents-weapon.json'), finalData.talentsWeapon);
  writeJson(path.join(outputDir, 'talents-gear.json'), finalData.talentsGear);
  writeJson(path.join(outputDir, 'mods-weapon.json'), finalData.modsWeapon);
  writeJson(path.join(outputDir, 'skills.json'), finalData.skills);
  writeJson(path.join(outputDir, 'specializations.json'), finalData.specializations);
  writeJson(path.join(outputDir, 'attributes.json'), finalData.attributes);
  writeJson(path.join(outputDir, 'multiplier-groups.json'), multiplierGroups);
  writeJson(path.join(outputDir, 'meta.json'), meta);

  // Generate Schema Documentation
  const schemaMd = `# Division Config Data Schema (Y8S3 / TU30 / 2.34)

Generated: ${meta.generatedAt}
Spreadsheet Hash: \`${meta.spreadsheetHash}\`
Reference Doc Hash: \`${meta.referenceDocHash}\`

## Overview of Data Files

| File | Item Count | Source Tab / Document | Description |
|---|---|---|---|
| \`weapons.json\` | ${meta.counts.weapons} | \`Weapons\` | Full weapon statistics (base damage, RPM, burst/sustain DPS, reload time, mod slots, innate HSD). |
| \`weapons-named.json\` | ${meta.counts.weaponsNamedAndExotic} | \`Weapons Named + Exotics\` + Reference §6 | Named and Exotic weapons with fixed talents, exotic mods, and drop sources. |
| \`gear-sets.json\` | ${meta.counts.gearSets} | \`Gearsets\` + Reference §4, §6 | All 28 gear sets including 2pc, 3pc, 4pc talents, chest & backpack talents, and multiplier groups. |
| \`brand-sets.json\` | ${meta.counts.brandSets} | \`Brandsets\` + Reference §2, §5 | All 37 brand sets with corrected 1pc, 2pc, 3pc bonuses. |
| \`gear-named.json\` | ${meta.counts.gearNamedAndExotic} | \`Gear Named + Exotics\` + Reference §6 | Named and Exotic gear pieces per slot with perfect talents and core/minor attributes. |
| \`talents-weapon.json\` | ${meta.counts.weaponTalents} | \`Weapon Talents\` + Reference §6, §8 | Weapon talents with perfect variants, multiplier groups, and Y8S3 reworks. |
| \`talents-gear.json\` | ${meta.counts.gearTalents} | \`Gear Talents\` + Reference §8 | Chest and Backpack talents with multiplier groups and PvP modifiers. |
| \`mods-weapon.json\` | ${meta.counts.weaponMods} | \`Weapon Mods\` | Weapon optics, magazine, muzzle, and underbarrel mods with bonuses, penalties, and unlock sources. |
| \`skills.json\` | ${meta.counts.skills} | \`Skill List\` + \`Skill Info\` | 14 skill platforms and variants with tier 0–6 stats and overcharge effects. |
| \`specializations.json\` | ${meta.counts.specializations} | \`Specializations\` | All 6 specialization trees and universal passives. |
| \`attributes.json\` | — | \`Attribute Info\` + Reference §7 | Attribute caps, prototype maxima, gear mod pools, watch maxima, and status immunity thresholds. |
| \`multiplier-groups.json\` | ${multiplierGroups.length} | Reference §3 | Multiplier group definitions and damage stacking rules. |
| \`meta.json\` | — | Pipeline Metadata | Build timestamps, file hashes, record counts, and author attributions. |

## Multiplier Groups Model

- **Within same group**: Additive ($1 + \\sum \\text{bonuses}$)
- **Across different groups**: Multiplicative ($\\prod \\text{groups}$)
- **Amplifiers**: Independent multiplicative terms ($\\prod (1 + \\text{amp})$)
`;

  fs.writeFileSync(path.join(outputDir, 'schema.md'), schemaMd, 'utf8');
  console.log('✅ Generated data/schema.md and all JSON datasets in /data/');
}

buildData();
