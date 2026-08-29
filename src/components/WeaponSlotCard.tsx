import React from 'react';
import { WeaponInstance, WeaponSlot } from '../lib/calc/types';
import { ConfidenceBadge } from './ConfidenceBadge';

import weaponsData from '../../data/weapons.json';
import weaponsNamedData from '../../data/weapons-named.json';
import weaponTalentsData from '../../data/talents-weapon.json';

const weapons = weaponsData as any[];
const namedWeapons = weaponsNamedData as any[];
const weaponTalents = weaponTalentsData as any[];

const WEAPON_MINOR_OPTIONS: Array<{ name: string; value: number; unit: string }> = [
  { name: 'Damage to Target Out of Cover (10%)', value: 0.10, unit: '%' },
  { name: 'Damage to Armor (6%)', value: 0.06, unit: '%' },
  { name: 'Critical Hit Chance (9.5%)', value: 0.095, unit: '%' },
  { name: 'Critical Hit Damage (10%)', value: 0.10, unit: '%' },
  { name: 'Headshot Damage (10%)', value: 0.10, unit: '%' },
  { name: 'Rate of Fire (5%)', value: 0.05, unit: '%' },
  { name: 'Magazine Size (12.5%)', value: 0.125, unit: '%' },
  { name: 'Reload Speed (12%)', value: 0.12, unit: '%' },
  { name: 'Health Damage (9.5%)', value: 0.095, unit: '%' }
];

interface Props {
  slot: WeaponSlot;
  weapon: WeaponInstance;
  onChange: (updated: WeaponInstance) => void;
  isActive: boolean;
  onSetActive: () => void;
}

export const WeaponSlotCard: React.FC<Props> = ({
  slot,
  weapon,
  onChange,
  isActive,
  onSetActive
}) => {
  const isExotic = !!weapon.isExotic;

  const handleWeaponSelect = (weaponName: string) => {
    // Check if exotic/named first
    const namedItem = namedWeapons.find(w => w.name === weaponName);
    if (namedItem) {
      const baseStats = weapons.find(w => w.category === namedItem.category || w.family === namedItem.family) || weapons[0];
      const isExo = !!namedItem.isExotic;
      onChange({
        slot,
        name: namedItem.name,
        category: namedItem.category || baseStats.category || 'Assault Rifle',
        baseDamage: baseStats.baseDamage || 48300,
        rpm: baseStats.rpm || 800,
        magSize: baseStats.baseMagSize || 30,
        reloadTime: baseStats.emptyReloadSecs || 2.2,
        innateHsd: baseStats.innateHsd || 0.55,
        coreAttribute: { type: 'Weapon Damage', value: 0.15 },
        secondaryCoreAttribute: getSecondaryAttribute(namedItem.category || baseStats.category),
        minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
        talent: namedItem.talentOrPerk || 'Custom Talent',
        isExotic: isExo
      });
      return;
    }

    // Standard weapon
    const std = weapons.find(w => w.name === weaponName);
    if (std) {
      onChange({
        slot,
        name: std.name,
        category: std.category || 'Assault Rifle',
        baseDamage: std.baseDamage || 50000,
        rpm: std.rpm || 750,
        magSize: std.baseMagSize || 30,
        reloadTime: std.emptyReloadSecs || 2.0,
        innateHsd: std.innateHsd || 0.55,
        coreAttribute: { type: 'Weapon Damage', value: 0.15 },
        secondaryCoreAttribute: getSecondaryAttribute(std.category),
        minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
        talent: 'Strained',
        isExotic: false
      });
    }
  };

  return (
    <div
      className={`bg-shd-surface2 border p-3.5 clip-corner relative flex flex-col gap-2.5 shadow-md transition-colors ${
        isActive ? 'border-shd-orange ring-1 ring-shd-orange/50' : 'border-shd-border2'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-shd-border1 pb-2">
        <div className="flex items-center gap-2">
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

        <span className="text-[11px] font-mono text-shd-textMonoMuted">{weapon.category}</span>
      </div>

      {/* Weapon Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
          Weapon Selection
        </label>
        <select
          value={weapon.name}
          onChange={(e) => handleWeaponSelect(e.target.value)}
          className={`bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2.5 py-1.5 focus:border-shd-orange outline-none clip-corner-sm ${
            isExotic ? 'text-shd-exotic font-semibold' : 'text-shd-textPrimary'
          }`}
        >
          <optgroup label="Exotic Weapons">
            {namedWeapons.filter(w => w.isExotic).map(w => (
              <option key={w.name} value={w.name}>★ {w.name} ({w.category || 'Exotic'})</option>
            ))}
          </optgroup>
          <optgroup label="Named Weapons">
            {namedWeapons.filter(w => !w.isExotic).map(w => (
              <option key={w.name} value={w.name}>◆ {w.name} ({w.category || 'Named'})</option>
            ))}
          </optgroup>
          <optgroup label="Standard High-End Weapons">
            {weapons.slice(0, 80).map(w => (
              <option key={w.name} value={w.name}>{w.name} ({w.category})</option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Weapon Base Stats Bar */}
      <div className="grid grid-cols-4 gap-1 bg-shd-surface1 p-2 border border-shd-border1 text-center clip-corner-sm font-mono text-[10px]">
        <div>
          <div className="text-shd-textMonoMuted">RPM</div>
          <div className="text-shd-textPrimary font-semibold">{weapon.rpm}</div>
        </div>
        <div>
          <div className="text-shd-textMonoMuted">MAG</div>
          <div className="text-shd-textPrimary font-semibold">{weapon.magSize}</div>
        </div>
        <div>
          <div className="text-shd-textMonoMuted">RELOAD</div>
          <div className="text-shd-textPrimary font-semibold">{weapon.reloadTime}s</div>
        </div>
        <div>
          <div className="text-shd-textMonoMuted">HSD</div>
          <div className="text-shd-textPrimary font-semibold">{Math.round(weapon.innateHsd * 100)}%</div>
        </div>
      </div>

      {/* Fixed Secondary Attribute */}
      <div className="flex items-center justify-between bg-shd-surface1 px-2 py-1 border border-shd-border1 clip-corner-sm text-xs font-mono">
        <span className="text-shd-textMonoMuted">Secondary:</span>
        <span className="text-shd-orange">
          +{weapon.secondaryCoreAttribute?.value * 100}% {weapon.secondaryCoreAttribute?.type}
        </span>
      </div>

      {/* Minor Attribute */}
      <div className="flex items-center justify-between gap-1 bg-shd-surface1 px-2 py-1 border border-shd-border1 clip-corner-sm">
        <span className="text-[10px] font-mono text-shd-textMonoMuted">Minor:</span>
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
          className="bg-transparent text-[11px] font-mono text-shd-textSecondary outline-none flex-1 text-right"
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
          <div className="text-xs font-sans text-shd-exotic bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
            <span className="font-semibold">{weapon.talent}</span>
          </div>
        ) : (
          <select
            value={weapon.talent || 'none'}
            onChange={(e) => onChange({ ...weapon, talent: e.target.value })}
            className="bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2.5 py-1.5 text-shd-textPrimary focus:border-shd-orange outline-none clip-corner-sm"
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
  return { type: 'Damage to Target Out of Cover', value: 0.10 };
}
