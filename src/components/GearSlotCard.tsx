import React from 'react';
import { GearSlot, GearPieceInstance, CoreType, AttributeRoll } from '../lib/calc/types';
import { ConfidenceBadge } from './ConfidenceBadge';

import brandSetsData from '../../data/brand-sets.json';
import gearSetsData from '../../data/gear-sets.json';
import gearNamedData from '../../data/gear-named.json';
import gearTalentsData from '../../data/talents-gear.json';

const brandSets = (brandSetsData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));
const gearSets = (gearSetsData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));
const namedGear = (gearNamedData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));
const gearTalents = (gearTalentsData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));

const MINOR_OPTIONS: Array<{ name: string; value: number; unit: string; group: string }> = [
  { name: 'Armor Regen', value: 4925, unit: '/s', group: 'Defensive' },
  { name: 'Critical Hit Chance', value: 0.06, unit: '%', group: 'Offensive' },
  { name: 'Critical Hit Damage', value: 0.12, unit: '%', group: 'Offensive' },
  { name: 'Explosive Resistance', value: 0.10, unit: '%', group: 'Defensive' },
  { name: 'Hazard Protection', value: 0.10, unit: '%', group: 'Defensive' },
  { name: 'Headshot Damage', value: 0.10, unit: '%', group: 'Offensive' },
  { name: 'Health', value: 18935, unit: '', group: 'Defensive' },
  { name: 'Repair Skills', value: 0.20, unit: '%', group: 'Skill' },
  { name: 'Skill Damage', value: 0.10, unit: '%', group: 'Skill' },
  { name: 'Skill Haste', value: 0.12, unit: '%', group: 'Skill' },
  { name: 'Status Effects', value: 0.10, unit: '%', group: 'Skill' },
  { name: 'Weapon Handling', value: 0.08, unit: '%', group: 'Offensive' }
].sort((a, b) => a.name.localeCompare(b.name));

const MOD_OPTIONS: Array<{ name: string; cleanName: string; value: number; unit: string }> = [
  { name: 'Armor on Kill (18.9k)', cleanName: 'Armor on Kill', value: 18935, unit: '' },
  { name: 'Critical Hit Chance (6%)', cleanName: 'Critical Hit Chance', value: 0.06, unit: '%' },
  { name: 'Critical Hit Damage (12%)', cleanName: 'Critical Hit Damage', value: 0.12, unit: '%' },
  { name: 'Headshot Damage (10%)', cleanName: 'Headshot Damage', value: 0.10, unit: '%' },
  { name: 'Incoming Repairs (20%)', cleanName: 'Incoming Repairs', value: 0.20, unit: '%' },
  { name: 'Protection from Elites (13%)', cleanName: 'Protection from Elites', value: 0.13, unit: '%' },
  { name: 'Repair Skills (20%)', cleanName: 'Repair Skills', value: 0.20, unit: '%' },
  { name: 'Skill Duration (10%)', cleanName: 'Skill Duration', value: 0.10, unit: '%' },
  { name: 'Skill Haste (12%)', cleanName: 'Skill Haste', value: 0.12, unit: '%' }
].sort((a, b) => a.cleanName.localeCompare(b.cleanName));

interface Props {
  slot: GearSlot;
  piece: GearPieceInstance;
  onChange: (updated: GearPieceInstance) => void;
  onAlignSet?: (setId: string, setName: string) => void;
}

function getNativeCore(piece: GearPieceInstance): CoreType | null {
  if (piece.kind === 'gear-set') {
    const set = gearSets.find(s => s.id === piece.brandOrSetId);
    if (!set) return null;
    return set.coreAttribute?.includes('Armor') ? 'Armor' : (set.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage');
  }
  if (piece.kind === 'brand') {
    const brand = brandSets.find(b => b.id === piece.brandOrSetId);
    if (!brand) return null;
    return brand.coreAttribute?.includes('Armor') ? 'Armor' : (brand.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage');
  }
  if (piece.kind === 'named') {
    const item = namedGear.find(i => i.name === piece.name);
    if (!item) return null;
    return item.coreAttribute?.includes('Armor') ? 'Armor' : (item.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage');
  }
  return null;
}

export const GearSlotCard: React.FC<Props> = ({ slot, piece, onChange, onAlignSet }) => {
  const isChest = slot === 'chest';
  const isBackpack = slot === 'backpack';
  const hasModSlot = ['mask', 'chest', 'backpack'].includes(slot) || piece.kind === 'improvised';

  // Available named items / exotics for this slot, sorted A-Z
  const slotNamedItems = namedGear
    .filter(g => g.slot?.toLowerCase().includes(slot.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const availableChestTalents = gearTalents
    .filter(t => t.slot === 'Chest')
    .sort((a, b) => a.name.localeCompare(b.name));

  const availableBackpackTalents = gearTalents
    .filter(t => t.slot === 'Backpack')
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleKindChange = (newKind: GearPieceInstance['kind']) => {
    if (newKind === 'brand') {
      const defaultBrand = brandSets[0];
      onChange({
        slot,
        kind: 'brand',
        name: `${defaultBrand.name} ${slot.toUpperCase()}`,
        brandOrSetId: defaultBrand.id,
        core: { type: defaultBrand.coreAttribute?.includes('Armor') ? 'Armor' : (defaultBrand.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'), value: defaultBrand.coreAttribute?.includes('Armor') ? 170000 : (defaultBrand.coreAttribute?.includes('Skill') ? 1 : 0.15) },
        minors: [
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
          { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
        ],
        modSlot: hasModSlot ? { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } : null,
        talent: isChest ? 'Obliterate' : (isBackpack ? 'Vigilance' : null)
      });
    } else if (newKind === 'gear-set') {
      const defaultSet = gearSets[0];
      onChange({
        slot,
        kind: 'gear-set',
        name: `${defaultSet.name} ${slot.toUpperCase()}`,
        brandOrSetId: defaultSet.id,
        core: { type: defaultSet.coreAttribute?.includes('Armor') ? 'Armor' : (defaultSet.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage'), value: defaultSet.coreAttribute?.includes('Armor') ? 170000 : (defaultSet.coreAttribute?.includes('Skill') ? 1 : 0.15) },
        minors: [
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
        ],
        modSlot: hasModSlot ? { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } : null,
        talent: isChest ? defaultSet.chestTalent : (isBackpack ? defaultSet.backpackTalent : null)
      });
    } else if (newKind === 'exotic') {
      const exoticItem = slotNamedItems.find(i => i.isExotic) || {
        name: slot === 'mask' ? "Coyote's Mask" : (slot === 'gloves' ? 'Overdogs' : `${slot.toUpperCase()} Exotic`),
        id: slot === 'mask' ? 'coyotes-mask' : (slot === 'gloves' ? 'overdogs' : 'exotic'),
        coreAttribute: 'Weapon Damage'
      };
      onChange({
        slot,
        kind: 'exotic',
        name: exoticItem.name,
        brandOrSetId: exoticItem.id || exoticItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
          { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
        ],
        modSlot: hasModSlot ? { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } : null
      });
    } else if (newKind === 'named') {
      const namedItem = slotNamedItems.find(i => !i.isExotic) || slotNamedItems[0];
      onChange({
        slot,
        kind: 'named',
        name: namedItem ? namedItem.name : `Named ${slot.toUpperCase()}`,
        brandOrSetId: namedItem?.brand ? namedItem.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') : brandSets[0].id,
        core: { type: 'Weapon Damage', value: 0.15 },
        minors: [
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
          { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
        ],
        modSlot: hasModSlot ? { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } : null,
        talent: namedItem?.talent || null
      });
    }
  };

  const handleBrandOrSetChange = (id: string) => {
    if (piece.kind === 'brand') {
      const brand = brandSets.find(b => b.id === id);
      if (brand) {
        onChange({
          ...piece,
          name: `${brand.name} ${slot.toUpperCase()}`,
          brandOrSetId: brand.id
        });
      }
    } else if (piece.kind === 'gear-set') {
      const set = gearSets.find(s => s.id === id);
      if (set) {
        const nativeCoreType: CoreType = set.coreAttribute?.includes('Armor') ? 'Armor' : (set.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage');
        const currentCoreType = piece.core.isRecalibrated ? piece.core.type : nativeCoreType;
        onChange({
          ...piece,
          name: `${set.name} ${slot.toUpperCase()}`,
          brandOrSetId: set.id,
          core: {
            type: currentCoreType,
            value: currentCoreType === 'Armor' ? 170000 : (currentCoreType === 'Skill Tier' ? 1 : 0.15),
            isRecalibrated: currentCoreType !== nativeCoreType
          },
          talent: isChest ? set.chestTalent : (isBackpack ? set.backpackTalent : null)
        });
      }
    }
  };

  // Recalibration count on this piece
  let recalCount = 0;
  if (piece.core.isRecalibrated) recalCount++;
  piece.minors.forEach(m => { if (m.isRecalibrated) recalCount++; });
  if (piece.isTalentRecalibrated) recalCount++;

  return (
    <div className="bg-shd-surface2 border border-shd-border2 p-3 clip-corner relative flex flex-col gap-2.5 shadow-md">
      {/* Header: Slot and Kind */}
      <div className="flex items-center justify-between border-b border-shd-border1 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-shd-orange">
            {slot}
          </span>
          <ConfidenceBadge tag={piece.kind === 'gear-set' ? '[PDF]' : '[PDF]'} />
        </div>

        {/* Piece Type Selector */}
        <select
          value={piece.kind}
          onChange={(e) => handleKindChange(e.target.value as any)}
          className="bg-shd-surface1 border border-shd-border3 text-[11px] font-mono px-2 py-0.5 text-shd-textSecondary focus:border-shd-orange outline-none clip-corner-sm"
        >
          <option value="brand">Brand (High-End)</option>
          <option value="gear-set">Gear Set Piece</option>
          <option value="named">Named Gear</option>
          <option value="exotic">Exotic Piece</option>
        </select>
      </div>

      {/* Item Picker */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
          {piece.kind === 'gear-set' ? 'Gear Set' : (piece.kind === 'brand' ? 'Brand Set' : 'Item Selection')}
        </label>

        {piece.kind === 'brand' && (
          <select
            value={piece.brandOrSetId}
            onChange={(e) => handleBrandOrSetChange(e.target.value)}
            className="bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2 py-1.5 text-shd-textPrimary focus:border-shd-orange outline-none clip-corner-sm truncate w-full"
          >
            {brandSets.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.bonus1pcRaw?.replace(/\n/g, ' ')})
              </option>
            ))}
          </select>
        )}

        {piece.kind === 'gear-set' && (
          <div className="flex items-center gap-1.5">
            <select
              value={piece.brandOrSetId}
              onChange={(e) => handleBrandOrSetChange(e.target.value)}
              className="bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2 py-1.5 text-shd-textPrimary focus:border-shd-orange outline-none clip-corner-sm truncate flex-1"
            >
              {gearSets.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.coreAttribute})
                </option>
              ))}
            </select>
            {onAlignSet && (
              <button
                type="button"
                onClick={() => {
                  const set = gearSets.find(s => s.id === piece.brandOrSetId);
                  onAlignSet(piece.brandOrSetId, set?.name || 'Gear Set');
                }}
                className="px-2 py-1.5 text-[10px] font-heading font-bold uppercase tracking-wider bg-shd-surface1 hover:bg-shd-orange hover:text-shd-bg text-shd-orange border border-shd-orange/60 clip-corner-sm transition-colors shrink-0"
                title={`Align 4pc ${gearSets.find(s => s.id === piece.brandOrSetId)?.name || 'Gear Set'} across slots`}
              >
                ⚡ Align
              </button>
            )}
          </div>
        )}

        {piece.kind === 'named' && (
          <select
            value={piece.name}
            onChange={(e) => {
              const item = slotNamedItems.find(i => i.name === e.target.value);
              if (item) {
                onChange({
                  ...piece,
                  name: item.name,
                  brandOrSetId: item.brand ? item.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') : brandSets[0].id,
                  talent: item.talent || piece.talent
                });
              }
            }}
            className="bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2 py-1.5 text-shd-named focus:border-shd-orange outline-none clip-corner-sm truncate w-full"
          >
            {slotNamedItems.filter(i => !i.isExotic).map(i => (
              <option key={i.id} value={i.name}>
                {i.name} ({i.brand || 'Named'})
              </option>
            ))}
          </select>
        )}

        {piece.kind === 'exotic' && (
          <select
            value={piece.name}
            onChange={(e) => {
              const item = slotNamedItems.find(i => i.name === e.target.value);
              if (item) {
                onChange({
                  ...piece,
                  name: item.name,
                  brandOrSetId: item.id || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                });
              }
            }}
            className="bg-shd-surface1 border border-shd-border3 text-xs font-sans px-2 py-1.5 text-shd-exotic font-semibold focus:border-shd-orange outline-none clip-corner-sm truncate w-full"
          >
            {slotNamedItems.filter(i => i.isExotic).length > 0 ? (
              slotNamedItems.filter(i => i.isExotic).map(i => (
                <option key={i.id} value={i.name}>{i.name} [Exotic]</option>
              ))
            ) : (
              <option value={piece.name}>{piece.name} [Exotic]</option>
            )}
          </select>
        )}
      </div>

      {/* Core Attribute */}
      <div className="flex items-center justify-between gap-1.5 bg-shd-surface1 p-1.5 border border-shd-border1 clip-corner-sm">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              piece.core.type === 'Weapon Damage'
                ? 'bg-shd-redCore'
                : piece.core.type === 'Armor'
                ? 'bg-shd-blueCore'
                : 'bg-shd-yellowCore'
            }`}
          />
          <select
            value={piece.core.type}
            disabled={piece.kind === 'exotic'}
            onChange={(e) => {
              const t = e.target.value as CoreType;
              const nativeCore = getNativeCore(piece);
              const isDifferentFromNative = nativeCore ? t !== nativeCore : false;
              onChange({
                ...piece,
                core: {
                  type: t,
                  value: t === 'Armor' ? 170000 : (t === 'Skill Tier' ? 1 : 0.15),
                  isRecalibrated: isDifferentFromNative
                }
              });
            }}
            className={`bg-transparent text-xs font-mono outline-none truncate w-full ${
              piece.kind === 'exotic' ? 'text-shd-textSecondary cursor-not-allowed' : 'text-shd-textPrimary cursor-pointer'
            }`}
          >
            <option value="Weapon Damage" className="bg-shd-surface1">+15.0% Weapon Damage</option>
            <option value="Armor" className="bg-shd-surface1">+170,000 Armor</option>
            <option value="Skill Tier" className="bg-shd-surface1">+1 Skill Tier</option>
          </select>
        </div>

        {piece.kind !== 'exotic' && (
          <label className="flex items-center gap-1 text-[10px] font-mono text-shd-textMonoMuted cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={!!piece.core.isRecalibrated}
              onChange={(e) => {
                onChange({
                  ...piece,
                  core: { ...piece.core, isRecalibrated: e.target.checked }
                });
              }}
              className="accent-shd-orange"
            />
            Recal
          </label>
        )}
      </div>

      {/* Minor Attributes */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-shd-textMonoMuted uppercase">
          <span>Minor Attributes</span>
          {piece.kind === 'gear-set' && (
            <span className="text-amber-400 font-semibold text-[9px]">1-Minor Budget</span>
          )}
        </div>

        {piece.minors.map((minor, idx) => (
          <div key={idx} className="flex items-center justify-between gap-1.5 bg-shd-surface1 px-2 py-1 border border-shd-border1 clip-corner-sm">
            <select
              value={minor.attribute}
              disabled={piece.kind === 'exotic'}
              onChange={(e) => {
                const opt = MINOR_OPTIONS.find(o => o.name === e.target.value);
                if (opt) {
                  const newMinors = [...piece.minors];
                  newMinors[idx] = {
                    attribute: opt.name,
                    value: opt.value,
                    unit: opt.unit,
                    isRecalibrated: minor.isRecalibrated
                  };
                  onChange({ ...piece, minors: newMinors });
                }
              }}
              className="bg-transparent text-[11px] font-mono text-shd-textSecondary outline-none flex-1 truncate"
            >
              {MINOR_OPTIONS.map(opt => (
                <option key={opt.name} value={opt.name} className="bg-shd-surface1">
                  +{opt.value > 1 ? opt.value.toLocaleString() : (opt.value * 100).toFixed(0) + '%'} {opt.name}
                </option>
              ))}
            </select>

            {piece.kind !== 'exotic' && (
              <label className="flex items-center gap-1 text-[10px] font-mono text-shd-textMonoMuted cursor-pointer shrink-0 ml-1">
                <input
                  type="checkbox"
                  checked={!!minor.isRecalibrated}
                  onChange={(e) => {
                    const newMinors = [...piece.minors];
                    newMinors[idx] = { ...minor, isRecalibrated: e.target.checked };
                    onChange({ ...piece, minors: newMinors });
                  }}
                  className="accent-shd-orange"
                />
                Recal
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Mod Slot (if eligible) */}
      {hasModSlot && (
        <div className="flex items-center justify-between gap-2 bg-shd-surface1/60 px-2 py-1 border border-dashed border-shd-border2 clip-corner-sm">
          <span className="text-[10px] font-mono text-shd-textMonoMuted uppercase shrink-0">Mod:</span>
          <select
            value={piece.modSlot?.attribute ? `${piece.modSlot.attribute} (${piece.modSlot.value * 100}%)` : (piece.modSlot?.attribute || 'none')}
            onChange={(e) => {
              const opt = MOD_OPTIONS.find(o => o.name === e.target.value);
              onChange({
                ...piece,
                modSlot: opt ? { attribute: opt.name.split(' (')[0], value: opt.value, unit: opt.unit } : null
              });
            }}
            className="bg-transparent text-[11px] font-mono text-shd-textSecondary outline-none flex-1 text-right truncate"
          >
            <option value="none" className="bg-shd-surface1">Empty Slot</option>
            {MOD_OPTIONS.map(opt => (
              <option key={opt.name} value={opt.name} className="bg-shd-surface1">
                {opt.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Talent (Chest & Backpack) */}
      {(isChest || isBackpack) && (
        <div className="flex flex-col gap-1 border-t border-shd-border1 pt-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-shd-textMonoMuted uppercase">
            <span>{isChest ? 'Chest Talent' : 'Backpack Talent'}</span>
            {piece.kind === 'gear-set' && <span className="text-emerald-400 font-bold">SET TALENT</span>}
          </div>

          {piece.kind === 'gear-set' ? (
            <div className="text-xs font-sans text-shd-textSecondary bg-shd-surface1 p-1.5 border border-shd-border1 clip-corner-sm">
              <span className="font-semibold text-shd-gearSet truncate block">{piece.talent || 'Set Talent'}</span>
            </div>
          ) : piece.kind === 'named' ? (
            <div className="text-xs font-sans text-shd-named bg-shd-surface1 p-1.5 border border-shd-border1 clip-corner-sm flex items-center justify-between">
              <span className="font-semibold truncate">{piece.talent || 'Perfect Talent'}</span>
              <span className="text-[10px] font-mono text-amber-500 shrink-0 ml-1">LOCKED</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 bg-shd-surface1 px-2 py-1 border border-shd-border1 clip-corner-sm">
              <select
                value={piece.talent || 'none'}
                onChange={(e) => onChange({ ...piece, talent: e.target.value === 'none' ? null : e.target.value })}
                className="bg-transparent text-xs font-sans text-shd-textPrimary outline-none flex-1 truncate"
              >
                <option value="none" className="bg-shd-surface1">No Talent</option>
                {(isChest ? availableChestTalents : availableBackpackTalents).map(t => (
                  <option key={t.name} value={t.name} className="bg-shd-surface1">
                    {t.name} ({t.multiplierGroup || 'Utility'})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[10px] font-mono text-shd-textMonoMuted cursor-pointer shrink-0 ml-1">
                <input
                  type="checkbox"
                  checked={!!piece.isTalentRecalibrated}
                  onChange={(e) => onChange({ ...piece, isTalentRecalibrated: e.target.checked })}
                  className="accent-shd-orange"
                />
                Recal
              </label>
            </div>
          )}
        </div>
      )}

      {/* Recalibration Warning */}
      {recalCount > 1 && (
        <div className="text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800 px-2 py-1 clip-corner-sm">
          ⚠️ {recalCount} recalibrations (max 1 permitted)
        </div>
      )}
    </div>
  );
};
