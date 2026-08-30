import React, { useState, useEffect } from 'react';
import { GearSlot } from '../lib/calc/types';
import gearSetsData from '../../data/gear-sets.json';

const gearSets = (gearSetsData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));

const ALL_SLOTS: { slot: GearSlot; label: string }[] = [
  { slot: 'mask', label: 'Mask' },
  { slot: 'backpack', label: 'Backpack' },
  { slot: 'chest', label: 'Chest' },
  { slot: 'gloves', label: 'Gloves' },
  { slot: 'holster', label: 'Holster' },
  { slot: 'kneepads', label: 'Kneepads' }
];

interface Props {
  isOpen: boolean;
  initialSetId?: string;
  onClose: () => void;
  onConfirm: (setId: string, selectedSlots: GearSlot[]) => void;
}

export const AlignGearSetModal: React.FC<Props> = ({
  isOpen,
  initialSetId,
  onClose,
  onConfirm
}) => {
  const [selectedSetId, setSelectedSetId] = useState(initialSetId || gearSets[0]?.id || 'striker');
  const [selectedSlots, setSelectedSlots] = useState<Record<GearSlot, boolean>>({
    mask: true,
    backpack: false,
    chest: false,
    gloves: true,
    holster: true,
    kneepads: true
  });

  useEffect(() => {
    if (initialSetId) {
      setSelectedSetId(initialSetId);
    }
  }, [initialSetId, isOpen]);

  if (!isOpen) return null;

  const currentSet = gearSets.find(s => s.id === selectedSetId) || gearSets[0];

  const handleToggleSlot = (slot: GearSlot) => {
    setSelectedSlots(prev => ({
      ...prev,
      [slot]: !prev[slot]
    }));
  };

  const handleSelect4pc = () => {
    setSelectedSlots({
      mask: true,
      backpack: false,
      chest: false,
      gloves: true,
      holster: true,
      kneepads: true
    });
  };

  const handleSelectAll = () => {
    setSelectedSlots({
      mask: true,
      backpack: true,
      chest: true,
      gloves: true,
      holster: true,
      kneepads: true
    });
  };

  const handleClearAll = () => {
    setSelectedSlots({
      mask: false,
      backpack: false,
      chest: false,
      gloves: false,
      holster: false,
      kneepads: false
    });
  };

  const activeSlots = (Object.keys(selectedSlots) as GearSlot[]).filter(s => selectedSlots[s]);

  const handleApply = () => {
    if (activeSlots.length === 0) return;
    onConfirm(selectedSetId, activeSlots);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-shd-surface1 border border-shd-border2 max-w-md w-full p-6 clip-corner shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shd-border1 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-shd-orange font-heading font-bold text-lg">⚡ ALIGN GEAR SET</span>
          </div>
          <button
            onClick={onClose}
            className="text-shd-textMonoMuted hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-950/40 border border-amber-600/70 p-3 clip-corner-sm flex items-start gap-2.5">
          <span className="text-amber-400 text-base shrink-0 mt-0.5">⚠️</span>
          <div className="text-xs font-mono text-amber-200 leading-relaxed">
            <strong className="text-amber-400 font-bold block mb-1">WARNING: OVERWRITING CHECKED SLOTS</strong>
            Checked items will be replaced with <strong>{currentSet?.name}</strong> pieces (native core and brand bonus).
          </div>
        </div>

        {/* Gear Set Selection */}
        <div className="flex flex-col gap-1.5 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
          <label className="text-xs font-heading font-bold text-shd-textPrimary uppercase">
            1. Select Gear Set to Align:
          </label>
          <select
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
            className="bg-shd-surface1 border border-shd-border3 p-2 text-xs font-sans text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm w-full"
          >
            {gearSets.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.coreAttribute})
              </option>
            ))}
          </select>
        </div>

        {/* Checkbox Selection for all 6 Gear Items */}
        <div className="flex flex-col gap-2.5 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-heading font-bold text-shd-textPrimary uppercase">
              2. Select Items to Update ({activeSlots.length}/6):
            </label>
            <div className="flex gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={handleSelect4pc}
                className="px-1.5 py-0.5 bg-shd-surface1 border border-shd-border3 hover:border-shd-orange text-shd-orange clip-corner-sm transition-colors"
              >
                4pc Standard
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-1.5 py-0.5 bg-shd-surface1 border border-shd-border3 hover:border-white text-shd-textSecondary hover:text-white clip-corner-sm transition-colors"
              >
                All 6
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-1.5 py-0.5 bg-shd-surface1 border border-shd-border3 hover:border-rose-500 text-shd-textMonoMuted hover:text-rose-400 clip-corner-sm transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {ALL_SLOTS.map(({ slot, label }) => {
              const isChecked = selectedSlots[slot];
              return (
                <label
                  key={slot}
                  className={`flex items-center gap-2 p-2 clip-corner-sm border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-shd-surface1 border-shd-orange text-white'
                      : 'bg-shd-surface1/60 border-shd-border3 text-shd-textMonoMuted hover:border-shd-border2 hover:text-shd-textSecondary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleSlot(slot)}
                    className="accent-shd-orange h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold uppercase">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-shd-border1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono border border-shd-border3 text-shd-textSecondary hover:text-white clip-corner-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={activeSlots.length === 0}
            className="px-6 py-2 text-xs font-heading font-bold bg-shd-orange text-shd-bg clip-corner-sm hover:bg-shd-orangeLight transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply ({activeSlots.length} items)
          </button>
        </div>
      </div>
    </div>
  );
};
