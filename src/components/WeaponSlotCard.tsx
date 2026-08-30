import React from 'react';
import { WeaponInstance, WeaponSlot } from '../lib/calc/types';
import { ConfidenceBadge } from './ConfidenceBadge';

import weaponsData from '../../data/weapons.json';
import weaponsNamedData from '../../data/weapons-named.json';
import weaponTalentsData from '../../data/talents-weapon.json';

const weapons = weaponsData as any[];
const namedWeapons = weaponsNamedData as any[];
const weaponTalents = (weaponTalentsData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));

const WEAPON_MINOR_OPTIONS: Array<{ name: string; cleanName: string; value: number; unit: string }> = [
  { name: 'Critical Hit Chance (9.5%)', cleanName: 'Critical Hit Chance', value: 0.095, unit: '%' },
  { name: 'Critical Hit Damage (10%)', cleanName: 'Critical Hit Damage', value: 0.10, unit: '%' },
  { name: 'Damage to Armor (6%)', cleanName: 'Damage to Armor', value: 0.06, unit: '%' },
  { name: 'Damage to Target Out of Cover (10%)', cleanName: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
  { name: 'Headshot Damage (10%)', cleanName: 'Headshot Damage', value: 0.10, unit: '%' },
  { name: 'Health Damage (9.5%)', cleanName: 'Health Damage', value: 0.095, unit: '%' },
  { name: 'Magazine Size (12.5%)', cleanName: 'Magazine Size', value: 0.125, unit: '%' },
  { name: 'Rate of Fire (5%)', cleanName: 'Rate of Fire', value: 0.05, unit: '%' },
  { name: 'Reload Speed (12%)', cleanName: 'Reload Speed', value: 0.12, unit: '%' }
].sort((a, b) => a.cleanName.localeCompare(b.cleanName));

interface Props {
  slot: WeaponSlot;
  weapon: WeaponInstance;
  onChange: (updated: WeaponInstance) => void;
  isActive: boolean;
  onSetActive: () => void;
}

function normalizeCategory(cat: string): string {
  const c = (cat || '').toUpperCase().trim();
  if (c.includes('ASSAULT')) return 'Assault Rifles';
  if (c.includes('SUBMACHINE') || c === 'SMG' || c.includes('SMG')) return 'Submachine Guns';
  if (c.includes('LIGHT MACHINE') || c === 'LMG' || c.includes('LMG')) return 'Light Machine Guns';
  if (c.includes('MARKSMAN')) return 'Marksman Rifles';
  if (c.includes('RIFLE')) return 'Rifles';
  if (c.includes('SHOTGUN')) return 'Shotguns';
  if (c.includes('PISTOL') || c.includes('SIDEARM') || c.includes('REVOLVER')) return 'Pistols';
  return 'Other';
}

const PRIMARY_SECONDARY_CATEGORIES = [
  'Assault Rifles',
  'Submachine Guns',
  'Light Machine Guns',
  'Rifles',
  'Marksman Rifles',
  'Shotguns'
];

const SIDEARM_CATEGORIES = [
  'Pistols'
];

function isCleanStandardWeapon(w: any): boolean {
  if (w.name.includes('(') || w.name.includes('Replica')) return false;
  if (namedWeapons.some(nw => nw.name.toLowerCase() === w.name.toLowerCase())) return false;
  return true;
}

function parseInnateHsd(category: string, rawHsd?: number): number {
  const norm = normalizeCategory(category);
  if (rawHsd !== undefined && rawHsd !== null && rawHsd > 0) {
    return rawHsd > 1 ? rawHsd / 100 : rawHsd;
  }
  if (norm === 'Marksman Rifles') return 1.37;
  if (norm === 'Rifles') return 0.60;
  if (norm === 'Pistols') return 1.00;
  if (norm === 'Shotguns') return 0.45;
  return 0.55;
}

export const WeaponSlotCard: React.FC<Props> = ({
  slot,
  weapon,
  onChange,
  isActive,
  onSetActive
}) => {
  const isExotic = !!weapon.isExotic;
  const isSidearmSlot = slot === 'sidearm';

  const handleWeaponSelect = (weaponName: string) => {
    // Check if exotic/named first
    const namedItem = namedWeapons.find(w => w.name === weaponName);
    if (namedItem) {
      const normCat = normalizeCategory(namedItem.category);
      const baseStats = weapons.find(w => w.family && namedItem.family && w.family.toLowerCase() === namedItem.family.toLowerCase())
        || weapons.find(w => normalizeCategory(w.category) === normCat)
        || weapons[0];

      const isExo = !!namedItem.isExotic;
      const innateHsd = parseInnateHsd(namedItem.category || baseStats.category, baseStats.innateHsd);

      onChange({
        slot,
        name: namedItem.name,
        category: namedItem.category || baseStats.category || (isSidearmSlot ? 'Pistol' : 'Assault Rifle'),
        baseDamage: baseStats.baseDamage || (isSidearmSlot ? 38000 : 48300),
        rpm: baseStats.rpm || (isSidearmSlot ? 310 : 800),
        magSize: baseStats.baseMagSize || (isSidearmSlot ? 15 : 30),
        reloadTime: baseStats.emptyReloadSecs || (isSidearmSlot ? 1.5 : 2.2),
        innateHsd,
        coreAttribute: { type: 'Weapon Damage', value: 0.15 },
        secondaryCoreAttribute: getSecondaryAttribute(namedItem.category || baseStats.category),
        minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
        talent: namedItem.talentOrPerk ? namedItem.talentOrPerk.split('\n')[0] : 'Custom Talent',
        isExotic: isExo
      });
      return;
    }

    // Standard weapon
    const std = weapons.find(w => w.name === weaponName);
    if (std) {
      const innateHsd = parseInnateHsd(std.category, std.innateHsd);
      onChange({
        slot,
        name: std.name,
        category: std.category || (isSidearmSlot ? 'Pistols' : 'Assault Rifles'),
        baseDamage: std.baseDamage || (isSidearmSlot ? 38000 : 50000),
        rpm: std.rpm || (isSidearmSlot ? 300 : 750),
        magSize: std.baseMagSize || (isSidearmSlot ? 15 : 30),
        reloadTime: std.emptyReloadSecs || (isSidearmSlot ? 1.5 : 2.0),
        innateHsd,
        coreAttribute: { type: 'Weapon Damage', value: 0.15 },
        secondaryCoreAttribute: getSecondaryAttribute(std.category),
        minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
        talent: isSidearmSlot ? 'In Sync' : 'Strained',
        isExotic: false
      });
    }
  };

  // 1. Exotics at the top, sorted A-Z (strict separation between sidearm and primary/secondary)
  const exoticWeapons = namedWeapons
    .filter(w => {
      if (!w.isExotic) return false;
      const isPistol = normalizeCategory(w.category) === 'Pistols';
      return isSidearmSlot ? isPistol : !isPistol;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // 2. Categories to display (Sidearm restricted to Pistols only, Prim/Sec restricted to long guns)
  const activeCategories = isSidearmSlot ? SIDEARM_CATEGORIES : PRIMARY_SECONDARY_CATEGORIES;

  return (
    <div
      className={`bg-shd-surface2 border p-3 clip-corner relative flex flex-col gap-2.5 shadow-md transition-colors ${
        isActive ? 'border-shd-orange ring-1 ring-shd-orange/50' : 'border-shd-border2'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-shd-border1 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSetActive}
            className={`px-2 py-0.5 text-xs font-heading font-bold uppercase tracking-wider clip-corner-sm transition-colors ${
              isActive ? 'bg-shd-orange text-shd-bg' : 'bg-shd-surface1 text-shd-textSecondary hover:text-white'
            }`}
          >
            {slot} {isActive ? '(ACTIVE)' : ''}
          </button>
          {isExotic ? (
            <span className="text-[10px] font-mono text-shd-exotic font-bold uppercase">EXOTIC</span>
          ) : (
            <ConfidenceBadge tag="[PDF]" />
          )}
        </div>

        <span className="text-[10px] font-mono text-shd-textMonoMuted truncate max-w-[90px]">{weapon.category}</span>
      </div>

      {/* Weapon Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
          Weapon Selection
        </label>
        <select
          value={weapon.name}
          onChange={(e) => handleWeaponSelect(e.target.value)}
          className={`bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2 py-1.5 focus:border-shd-orange outline-none clip-corner-sm truncate w-full ${
            isExotic ? 'text-shd-exotic font-semibold' : 'text-shd-textPrimary'
          }`}
        >
          {exoticWeapons.length > 0 && (
            <optgroup label={isSidearmSlot ? "★ Exotic Sidearms" : "★ Exotic Weapons"}>
              {exoticWeapons.map(w => (
                <option key={w.name} value={w.name}>
                  ★ {w.name} ({w.category || 'Exotic'})
                </option>
              ))}
            </optgroup>
          )}

          {activeCategories.map(categoryName => {
            const namedInCategory = namedWeapons
              .filter(w => !w.isExotic && normalizeCategory(w.category) === categoryName)
              .sort((a, b) => a.name.localeCompare(b.name));

            const standardInCategory = weapons
              .filter(w => normalizeCategory(w.category) === categoryName && isCleanStandardWeapon(w))
              .sort((a, b) => a.name.localeCompare(b.name));

            if (namedInCategory.length === 0 && standardInCategory.length === 0) return null;

            const displayLabel = categoryName === 'Pistols' ? 'Pistols & Sidearms' : categoryName;

            return (
              <optgroup key={categoryName} label={displayLabel}>
                {/* Named weapons at top of category (sorted A-Z) */}
                {namedInCategory.map(w => (
                  <option key={w.name} value={w.name}>
                    ◆ {w.name} (Named)
                  </option>
                ))}
                {/* Standard High-End weapons in category (sorted A-Z) */}
                {standardInCategory.map(w => (
                  <option key={w.name} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {/* Weapon Base Stats Bar */}
      <div className="grid grid-cols-4 gap-1 bg-shd-surface1 p-1.5 border border-shd-border1 text-center clip-corner-sm font-mono text-[10px]">
        <div>
          <div className="text-shd-textMonoMuted text-[9px]">RPM</div>
          <div className="text-shd-textPrimary font-semibold">{weapon.rpm}</div>
        </div>
        <div>
          <div className="text-shd-textMonoMuted text-[9px]">MAG</div>
          <div className="text-shd-textPrimary font-semibold">{weapon.magSize}</div>
        </div>
        <div>
          <div className="text-shd-textMonoMuted text-[9px]">RELOAD</div>
          <div className="text-shd-textPrimary font-semibold">{weapon.reloadTime}s</div>
        </div>
        <div>
          <div className="text-shd-textMonoMuted text-[9px]">HSD</div>
          <div className="text-shd-textPrimary font-semibold">{Math.round(weapon.innateHsd * 100)}%</div>
        </div>
      </div>

      {/* Fixed Secondary Attribute */}
      <div className="flex flex-col bg-shd-surface1 px-2 py-1.5 border border-shd-border1 clip-corner-sm text-xs font-mono">
        <span className="text-[10px] text-shd-textMonoMuted uppercase">Fixed Secondary:</span>
        <span className="text-shd-orange font-semibold truncate">
          +{weapon.secondaryCoreAttribute?.value * 100}% {weapon.secondaryCoreAttribute?.type}
        </span>
      </div>

      {/* Minor Attribute */}
      <div className="flex flex-col gap-1 bg-shd-surface1 px-2 py-1.5 border border-shd-border1 clip-corner-sm">
        <span className="text-[10px] font-mono text-shd-textMonoMuted uppercase">Minor Attribute:</span>
        <select
          value={weapon.minorAttribute ? `${weapon.minorAttribute.attribute} (${weapon.minorAttribute.value * 100}%)` : (weapon.minorAttribute?.attribute || 'Damage to Target Out of Cover (10%)')}
          disabled={isExotic}
          onChange={(e) => {
            const opt = WEAPON_MINOR_OPTIONS.find(o => o.name === e.target.value);
            if (opt) {
              onChange({
                ...weapon,
                minorAttribute: {
                  attribute: opt.name.split(' (')[0],
                  value: opt.value,
                  unit: opt.unit
                }
              });
            }
          }}
          className="bg-transparent text-[11px] font-mono text-shd-textSecondary outline-none w-full truncate"
        >
          {WEAPON_MINOR_OPTIONS.map(opt => (
            <option key={opt.name} value={opt.name} className="bg-shd-surface1">
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Talent */}
      <div className="flex flex-col gap-1 border-t border-shd-border1 pt-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-shd-textMonoMuted uppercase">
          <span>Weapon Talent</span>
          {isExotic && <span className="text-shd-exotic font-bold">EXOTIC PERK</span>}
        </div>

        {isExotic ? (
          <div className="text-xs font-sans text-shd-exotic bg-shd-surface1 p-1.5 border border-shd-border1 clip-corner-sm">
            <span className="font-semibold truncate block">{weapon.talent}</span>
          </div>
        ) : (
          <select
            value={weapon.talent || 'none'}
            onChange={(e) => onChange({ ...weapon, talent: e.target.value })}
            className="bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2 py-1.5 text-shd-textPrimary focus:border-shd-orange outline-none clip-corner-sm w-full truncate"
          >
            {weaponTalents.map(t => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.multiplierGroup || 'Utility'})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

function getSecondaryAttribute(category: string): { type: string; value: number } {
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('assault')) return { type: 'Health Damage', value: 0.21 };
  if (catLower.includes('lmg') || catLower.includes('light machine')) return { type: 'Damage to Target Out of Cover', value: 0.12 };
  if (catLower.includes('submachine') || catLower.includes('smg')) return { type: 'Critical Hit Chance', value: 0.21 };
  if (catLower.includes('shotgun')) return { type: 'Damage to Armor', value: 0.12 };
  if (catLower.includes('rifle') && !catLower.includes('marksman')) return { type: 'Critical Hit Damage', value: 0.17 };
  if (catLower.includes('marksman')) return { type: 'Headshot Damage', value: 1.11 };
  if (catLower.includes('pistol')) return { type: 'Damage to Armor', value: 0.10 };
  return { type: 'Damage to Target Out of Cover', value: 0.10 };
}
