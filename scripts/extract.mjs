import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

/**
 * Normalise string placeholder values to null.
 */
export function cleanStr(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (s === '' || s === '----' || s === '---' || s === '--' || s === '-' || s.toLowerCase() === 'none' || s === 'NaN' || s.toLowerCase() === 'n/a') {
    return null;
  }
  return s;
}

/**
 * Parse numeric percentage or number cleanly
 */
export function cleanNum(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const s = String(val).trim();
  if (s === '' || s === '----' || s === '-' || s.toLowerCase() === 'none' || s.toLowerCase() === 'n/a' || s === 'NaN') {
    return null;
  }
  const isPct = s.endsWith('%');
  const numStr = s.replace(/,/g, '').replace(/%/g, '').trim();
  const parsed = parseFloat(numStr);
  if (isNaN(parsed)) return null;
  return isPct ? parsed / 100 : parsed;
}

/**
 * Extract raw number magnitude from a string like "15% Reload Speed" -> 0.15, "170,000" -> 170000
 */
export function parseBonusString(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '-' || trimmed === '----') return null;

  // Format: "30%\nMMR Damage" or "15% Reload Speed" or "1 Skill Tier"
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  let value = null;
  let attribute = '';
  let unit = '';

  if (lines.length >= 2) {
    const valMatch = lines[0].match(/^([+-]?\d+(?:\.\d+)?)(%|\+)?/);
    if (valMatch) {
      value = parseFloat(valMatch[1]);
      unit = valMatch[2] || '';
      if (unit === '%') value = value / 100;
    }
    attribute = lines.slice(1).join(' ');
  } else {
    const single = lines[0];
    const match = single.match(/^([+-]?\d+(?:\.\d+)?)(%|\+)?\s*(.*)$/);
    if (match) {
      value = parseFloat(match[1]);
      unit = match[2] || '';
      if (unit === '%') value = value / 100;
      attribute = match[3];
    } else {
      attribute = single;
    }
  }

  return {
    raw: trimmed,
    value,
    unit,
    attribute: attribute.replace(/\s+/g, ' ').trim()
  };
}

/**
 * Parse multi-line set bonuses (e.g. 2pc with 2 bonuses)
 */
export function parseMultiBonusString(cellStr) {
  if (!cellStr) return [];
  const text = String(cellStr).trim();
  if (!text || text === '-' || text === '----') return [];

  // Split by double newline or blank lines
  const parts = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const results = [];
  for (const part of parts) {
    const parsed = parseBonusString(part);
    if (parsed) results.push(parsed);
  }
  return results;
}

/**
 * Parse mod slot raw string like "4\", "3!", "2$#", "4*"
 */
export function parseModSlots(rawStr) {
  if (!rawStr) return { count: 0, raw: null, missingSlots: [], hasLongRail: false, isLocked: false };
  const raw = String(rawStr).trim();
  const digitMatch = raw.match(/^(\d+)/);
  const count = digitMatch ? parseInt(digitMatch[1], 10) : 0;
  const missingSlots = [];
  if (raw.includes('!')) missingSlots.push('muzzle');
  if (raw.includes('#')) missingSlots.push('underbarrel');
  if (raw.includes('$')) missingSlots.push('magazine');
  if (raw.includes('&')) missingSlots.push('optics');
  const hasLongRail = raw.includes('\\');
  const isLocked = raw.includes('*');

  return {
    count,
    raw,
    missingSlots,
    hasLongRail,
    isLocked
  };
}

/**
 * Extract all data from the spreadsheet.
 */
export function extractDataFromSpreadsheet(wb) {
  const extracted = {};

  // 1. Weapons
  {
    const sheet = wb.Sheets['Weapons'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const weapons = [];
    let currentCategory = null;
    let currentFamily = null;

    // Side table: columns 15-17 (Weapon Type, Fixed Second Attribute, Innate HSD)
    const weaponTypeDefaults = {};
    for (let r = 1; r <= 7; r++) {
      const row = rows[r];
      if (row && row[15]) {
        const typeName = cleanStr(row[15]);
        const fixedAttr = cleanStr(row[16]);
        const innateHsd = cleanNum(row[17]);
        if (typeName) {
          weaponTypeDefaults[typeName] = {
            weaponType: typeName,
            fixedSecondAttribute: fixedAttr,
            innateHsdMultiplier: innateHsd
          };
        }
      }
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (cleanStr(row[0])) currentCategory = cleanStr(row[0]);
      if (cleanStr(row[1])) currentFamily = cleanStr(row[1]);

      const name = cleanStr(row[2]);
      if (!name) continue;

      const rpm = cleanNum(row[3]);
      const baseMag = cleanNum(row[4]);
      const moddedMag = cleanNum(row[5]);
      const reloadTime = cleanNum(row[6]);
      const baseDamage = cleanNum(row[7]);
      const burstDps = cleanNum(row[8]);
      const sustainDps = cleanNum(row[9]);
      const totalMag = cleanNum(row[10]);
      const moddedSustainDps = cleanNum(row[11]);
      const optimalRange = cleanNum(row[12]);
      const modSlots = parseModSlots(row[13]);
      const hsd = cleanNum(row[14]);

      weapons.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        category: currentCategory,
        family: currentFamily,
        rpm,
        baseMagSize: baseMag,
        moddedMagSize: moddedMag,
        emptyReloadSecs: reloadTime,
        baseDamage,
        burstDps,
        sustainDps,
        totalMag,
        moddedSustainDps,
        optimalRange,
        modSlots,
        innateHsd: hsd
      });
    }

    extracted.weapons = weapons;
    extracted.weaponTypeDefaults = weaponTypeDefaults;
  }

  // 2. Weapons Named + Exotics
  {
    const sheet = wb.Sheets['Weapons Named + Exotics'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const namedWeapons = [];
    let currentCategory = null;
    let inExotics = false;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (r >= 99) inExotics = true;
      if (cleanStr(row[0])) currentCategory = cleanStr(row[0]);

      if (!inExotics) {
        const family = cleanStr(row[1]);
        const name = cleanStr(row[2]);
        if (!name) continue;

        const talentOrPerk = cleanStr(row[4]);
        const exoticMods = cleanStr(row[5]);
        const minor = cleanStr(row[6]);
        const released = cleanStr(row[7]);
        const dropLocation = cleanStr(row[8]);
        const notes = cleanStr(row[9]);

        namedWeapons.push({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          category: currentCategory,
          family,
          isExotic: false,
          talentOrPerk,
          exoticMods,
          minor,
          released,
          dropLocation,
          notes
        });
      } else {
        // Exotics
        const nameCol = cleanStr(row[2]);
        const talentCol = cleanStr(row[4]);
        const family = cleanStr(row[1]);
        const exoticMods = cleanStr(row[5]);
        const minor = cleanStr(row[6]);
        const released = cleanStr(row[7]);
        const dropLocation = cleanStr(row[8]);
        const notes = cleanStr(row[9]);

        if (nameCol && talentCol) {
          namedWeapons.push({
            id: nameCol.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: nameCol.replace(/\n\s*\(PTS\)/i, '').trim(),
            category: currentCategory,
            family,
            isExotic: true,
            talentOrPerk: talentCol,
            exoticMods,
            minor,
            released,
            dropLocation,
            notes
          });
        } else if (talentCol && (!nameCol || nameCol === '')) {
          const nextRow = rows[r + 1];
          const nextName = nextRow ? cleanStr(nextRow[2]) : null;
          if (nextName) {
            namedWeapons.push({
              id: nextName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: nextName.replace(/\n\s*\(PTS\)/i, '').trim(),
              category: currentCategory,
              family,
              isExotic: true,
              talentOrPerk: talentCol,
              exoticMods,
              minor,
              released,
              dropLocation,
              notes
            });
            r++;
          }
        }
      }
    }

    extracted.weaponsNamed = namedWeapons;
  }

  // 3. Weapon Talents
  {
    const sheet = wb.Sheets['Weapon Talents'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const talents = [];
    let currentWeaponClass = 'ALL';

    const weaponClasses = new Set(['RIFLES', 'ASSAULT RIFLES', 'MARKSMAN RIFLES', 'SUBMACHINE GUNS', 'LIGHT MACHINE GUNS', 'SHOTGUNS', 'PISTOLS']);

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      const col0 = cleanStr(row[0]);
      const name = cleanStr(row[1]);
      const perfectName = cleanStr(row[2]);
      const description = cleanStr(row[3]);
      const multiplierGroup = cleanStr(row[4]);
      const notes = cleanStr(row[6]);

      if (name && weaponClasses.has(name.toUpperCase()) && !description) {
        currentWeaponClass = name;
        continue;
      }

      if (!name) continue;

      talents.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        weaponClass: currentWeaponClass,
        perfectName,
        description,
        multiplierGroup,
        notes
      });
    }

    extracted.talentsWeapon = talents;
  }

  // 4. Gearsets
  {
    const sheet = wb.Sheets['Gearsets'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const gearsets = [];
    let currentDataRows = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      const col0 = cleanStr(row[0]);
      if (col0 && col0 !== 'Name') {
        const rawName = col0;
        const name = rawName.replace(/\n\s*\(PTS\)/i, '').replace(/\n\s*\(Dark Zone Exclusive\)/i, '').trim();
        const isPTS = rawName.toLowerCase().includes('(pts)');
        const isDZ = rawName.toLowerCase().includes('dark zone');

        const mainRow = currentDataRows[0] || row;
        const coreAttribute = cleanStr(mainRow[1]) || cleanStr(row[1]);
        const bonus2pcRaw = cleanStr(mainRow[2]);
        const bonus3pcRaw = cleanStr(mainRow[3]);
        const talent4pc = cleanStr(mainRow[4]);
        const chestTalent = cleanStr(mainRow[5]);
        const backpackTalent = cleanStr(mainRow[6]);
        const multiplierGroup = cleanStr(mainRow[7]);
        const dropLocations = cleanStr(mainRow[8]) || (isDZ ? 'DZ only, Seasonal Caches' : 'LZ and DZ');
        const notes = cleanStr(mainRow[9]);

        gearsets.push({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          isPTS,
          isDZ,
          coreAttribute: coreAttribute ? coreAttribute.replace(/\n/g, ' ').trim() : 'Weapon Damage',
          bonuses2pc: parseMultiBonusString(bonus2pcRaw),
          bonuses3pc: parseMultiBonusString(bonus3pcRaw),
          bonus2pcRaw,
          bonus3pcRaw,
          talent4pc,
          chestTalent,
          backpackTalent,
          multiplierGroup,
          dropLocations,
          notes
        });

        currentDataRows = [];
      } else {
        currentDataRows.push(row);
      }
    }

    extracted.gearSets = gearsets;
  }

  // 5. Brandsets
  {
    const sheet = wb.Sheets['Brandsets'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const brands = [];
    let currentCoreCat = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (cleanStr(row[0])) currentCoreCat = cleanStr(row[0]);
      const name = cleanStr(row[2]);
      if (!name) continue;

      const coreAttribute = cleanStr(row[3]) || currentCoreCat;
      const bonus1pcRaw = cleanStr(row[4]);
      const bonus2pcRaw = cleanStr(row[5]);
      const bonus3pcRaw = cleanStr(row[6]);
      const released = cleanStr(row[7]);

      brands.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        coreAttribute: coreAttribute ? coreAttribute.replace(/\n/g, ' ').trim() : 'Weapon Damage',
        bonus1pc: parseBonusString(bonus1pcRaw),
        bonus2pc: parseBonusString(bonus2pcRaw),
        bonus3pc: parseBonusString(bonus3pcRaw),
        bonus1pcRaw,
        bonus2pcRaw,
        bonus3pcRaw,
        released
      });
    }

    extracted.brandSets = brands;
  }

  // 6. Gear Named + Exotics
  {
    const sheet = wb.Sheets['Gear Named + Exotics'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const gearNamed = [];
    let currentSlot = null;
    let inExotics = false;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (row[1] === 'EXOTICS' || (row[0] && String(row[0]).includes('EXOTICS'))) {
        inExotics = true;
        continue;
      }
      if (cleanStr(row[0])) currentSlot = cleanStr(row[0]);

      if (!inExotics) {
        const brandOrKind = cleanStr(row[2]);
        const released = cleanStr(row[3]);
        const name = cleanStr(row[4]);
        if (!name) continue;

        const talent = cleanStr(row[6]);
        const talentDesc = cleanStr(row[7]);
        const coreAttr = cleanStr(row[8]);
        const minor1 = cleanStr(row[9]);
        const minor2 = cleanStr(row[10]);
        const minor3 = cleanStr(row[11]);
        const source = cleanStr(row[12]);
        const notes = cleanStr(row[13]);

        gearNamed.push({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name,
          slot: currentSlot,
          brand: brandOrKind,
          isExotic: false,
          released,
          talent,
          talentDesc,
          coreAttribute: coreAttr,
          minor1,
          minor2,
          minor3,
          source,
          notes
        });
      } else {
        const nameCol = cleanStr(row[4]);
        const talentCol = cleanStr(row[6]);
        const talentDesc = cleanStr(row[7]);
        const coreAttr = cleanStr(row[8]);
        const minor1 = cleanStr(row[9]);
        const minor2 = cleanStr(row[10]);
        const minor3 = cleanStr(row[11]);
        const source = cleanStr(row[12]);
        const notes = cleanStr(row[13]);

        if (nameCol && talentCol) {
          gearNamed.push({
            id: nameCol.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: nameCol.replace(/\n/g, ' ').trim(),
            slot: currentSlot,
            brand: null,
            isExotic: true,
            talent: talentCol,
            talentDesc,
            coreAttribute: coreAttr,
            minor1,
            minor2,
            minor3,
            source,
            notes
          });
        } else if (talentCol && (!nameCol || nameCol === '')) {
          const nextRow = rows[r + 1];
          const nextName = nextRow ? cleanStr(nextRow[4]) : null;
          if (nextName) {
            gearNamed.push({
              id: nextName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: nextName.replace(/\n/g, ' ').trim(),
              slot: currentSlot,
              brand: null,
              isExotic: true,
              talent: talentCol,
              talentDesc,
              coreAttribute: coreAttr,
              minor1,
              minor2,
              minor3,
              source,
              notes
            });
            r++;
          }
        }
      }
    }

    extracted.gearNamed = gearNamed;
  }

  // 7. Gear Talents
  {
    const sheet = wb.Sheets['Gear Talents'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const talents = [];
    let currentSlotType = 'Chest';

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (cleanStr(row[0])) {
        const slotText = cleanStr(row[0]).toLowerCase();
        if (slotText.includes('backpack')) currentSlotType = 'Backpack';
        else if (slotText.includes('chest')) currentSlotType = 'Chest';
      }

      const category = cleanStr(row[1]);
      const name = cleanStr(row[3]);
      if (!name) continue;

      const perfectName = cleanStr(row[4]);
      const description = cleanStr(row[5]);
      const multiplierGroup = cleanStr(row[6]);
      const pvpModifier = cleanStr(row[7]);
      const notes = cleanStr(row[9]);
      const pvpDesc = cleanStr(row[10]);

      talents.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        slot: currentSlotType,
        category,
        perfectName,
        description,
        multiplierGroup,
        pvpModifier,
        notes,
        pvpDesc
      });
    }

    extracted.talentsGear = talents;
  }

  // 8. Attribute Info
  {
    const sheet = wb.Sheets['Attribute Info'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const weaponCore = [];
    const weaponSecondaryFixed = [];
    const weaponMinors = [];
    const gearCore = [];
    const gearMinorsOffensive = [];
    const gearMinorsDefensive = [];
    const gearMinorsSkill = [];
    const gearModsOffensive = [];
    const gearModsDefensive = [];
    const gearModsSkill = [];
    const watchMaxima = [];
    const statusImmunities = [];

    let currentSlot = null;
    let currentGroup = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (cleanStr(row[0])) currentSlot = cleanStr(row[0]);
      if (cleanStr(row[1])) currentGroup = cleanStr(row[1]);

      const attrName = cleanStr(row[2]);
      const maxVal = cleanNum(row[4]);
      const protoMaxVal = cleanNum(row[5]);
      const rawMax = cleanStr(row[4]);

      const statusName = cleanStr(row[7]);
      const statusThreshold = cleanNum(row[8]);
      if (statusName && statusThreshold !== null && !statusName.startsWith('*')) {
        statusImmunities.push({
          status: statusName,
          thresholdPct: statusThreshold
        });
      }

      if (!attrName) continue;

      const entry = {
        name: attrName,
        max: maxVal,
        protoMax: protoMaxVal,
        rawMax
      };

      const groupLower = (currentGroup || '').toLowerCase();
      const slotLower = (currentSlot || '').toLowerCase();

      if (slotLower.includes('weapon')) {
        if (groupLower.includes('core')) weaponCore.push(entry);
        else if (groupLower.includes('fixed') || groupLower.includes('secondary')) weaponSecondaryFixed.push(entry);
        else if (groupLower.includes('minor')) weaponMinors.push(entry);
      } else if (slotLower.includes('gear') && !slotLower.includes('mods')) {
        if (groupLower.includes('core')) gearCore.push(entry);
        else if (groupLower.includes('offensive')) gearMinorsOffensive.push(entry);
        else if (groupLower.includes('defensive')) gearMinorsDefensive.push(entry);
        else if (groupLower.includes('skill')) gearMinorsSkill.push(entry);
      } else if (slotLower.includes('mods')) {
        if (groupLower.includes('offensive')) gearModsOffensive.push(entry);
        else if (groupLower.includes('defensive')) gearModsDefensive.push(entry);
        else if (groupLower.includes('skill')) gearModsSkill.push(entry);
      } else if (slotLower.includes('watch')) {
        watchMaxima.push({
          group: currentGroup,
          ...entry
        });
      }
    }

    extracted.attributes = {
      weaponCore,
      weaponSecondaryFixed,
      weaponMinors,
      gearCore,
      gearMinorsOffensive,
      gearMinorsDefensive,
      gearMinorsSkill,
      gearModsOffensive,
      gearModsDefensive,
      gearModsSkill,
      watchMaxima,
      statusImmunities
    };
  }

  // 9. Weapon Mods
  {
    const sheet = wb.Sheets['Weapon Mods'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const mods = [];
    let currentType = null;
    let currentSlot = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (cleanStr(row[0])) currentType = cleanStr(row[0]);
      if (cleanStr(row[1])) currentSlot = cleanStr(row[1]);

      const name = cleanStr(row[2]);
      if (!name) continue;

      const bonusRaw = cleanStr(row[3]);
      const penaltyRaw = cleanStr(row[4]);
      const source = cleanStr(row[5]);

      mods.push({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        type: currentType,
        slot: currentSlot,
        bonusRaw,
        bonus: parseBonusString(bonusRaw),
        penaltyRaw,
        penalty: parseBonusString(penaltyRaw),
        source
      });
    }

    extracted.modsWeapon = mods;
  }

  // 10. Skill List & Skill Info
  {
    const sheet = wb.Sheets['Skill List'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const skills = [];
    let currentSkillName = null;
    let currentVariantName = null;
    let currentVariantObj = null;
    let currentSkillObj = null;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.some(c => c !== null && String(c).trim() !== '')) continue;

      if (row[2] && String(row[2]).includes('Quick Links')) continue;
      if (row[2] && String(row[2]).startsWith('▶')) continue;

      const skillCol = cleanStr(row[0]);
      const variantCol = cleanStr(row[1]);
      const statName = cleanStr(row[2]);

      if (skillCol) {
        currentSkillName = skillCol.replace(/^[▶\s]+/, '').trim();
        currentSkillObj = {
          name: currentSkillName,
          variants: []
        };
        skills.push(currentSkillObj);
      }

      if (variantCol && currentSkillObj) {
        currentVariantName = variantCol.trim();
        currentVariantObj = {
          name: currentVariantName,
          stats: []
        };
        currentSkillObj.variants.push(currentVariantObj);
      }

      if (statName && currentVariantObj) {
        currentVariantObj.stats.push({
          stat: statName,
          tier0: cleanStr(row[3]),
          tier1: cleanStr(row[4]),
          tier2: cleanStr(row[5]),
          tier3: cleanStr(row[6]),
          tier4: cleanStr(row[7]),
          tier5: cleanStr(row[8]),
          tier6: cleanStr(row[9]),
          overchargeStats: cleanStr(row[10]),
          overchargeEffects: cleanStr(row[11]),
          expertise: cleanStr(row[12])
        });
      }
    }

    extracted.skills = skills;
  }

  // 11. Specializations
  {
    const sheet = wb.Sheets['Specializations'];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
    const specs = [
      { name: 'Universal', passives: [] },
      { name: 'Sharpshooter', nodes: [] },
      { name: 'Survivalist', nodes: [] },
      { name: 'Technician', nodes: [] },
      { name: 'Gunner', nodes: [] },
      { name: 'Demolitionist', nodes: [] },
      { name: 'Firewall', nodes: [] }
    ];

    for (let r = 1; r <= 9; r++) {
      const row = rows[r];
      if (row && row[2]) {
        specs[0].passives.push({
          name: cleanStr(row[2]),
          effect: cleanStr(row[3])
        });
      }
    }

    for (let r = 1; r <= 15; r++) {
      const row = rows[r];
      if (row && row[6]) {
        specs[1].nodes.push({ category: cleanStr(row[4]), name: cleanStr(row[6]), description: cleanStr(row[7]) });
      }
      if (row && row[10]) {
        specs[2].nodes.push({ category: cleanStr(row[8]), name: cleanStr(row[10]), description: cleanStr(row[11]) });
      }
    }

    for (let r = 17; r <= 32; r++) {
      const row = rows[r];
      if (row && row[6]) {
        specs[3].nodes.push({ category: cleanStr(row[4]), name: cleanStr(row[6]), description: cleanStr(row[7]) });
      }
      if (row && row[10]) {
        specs[4].nodes.push({ category: cleanStr(row[8]), name: cleanStr(row[10]), description: cleanStr(row[11]) });
      }
    }

    for (let r = 34; r <= 48; r++) {
      const row = rows[r];
      if (row && row[6]) {
        specs[5].nodes.push({ category: cleanStr(row[4]), name: cleanStr(row[6]), description: cleanStr(row[7]) });
      }
      if (row && row[10]) {
        specs[6].nodes.push({ category: cleanStr(row[8]), name: cleanStr(row[10]), description: cleanStr(row[11]) });
      }
    }

    extracted.specializations = specs;
  }

  return extracted;
}

export function runExtract(filePath) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  return extractDataFromSpreadsheet(wb);
}
