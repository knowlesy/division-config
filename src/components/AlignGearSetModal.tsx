import React, { useState, useEffect } from 'react';
import gearSetsData from '../../data/gear-sets.json';

const gearSets = (gearSetsData as any[]).slice().sort((a, b) => a.name.localeCompare(b.name));

interface Props {
  isOpen: boolean;
  initialSetId?: string;
  onClose: () => void;
  onConfirm: (setId: string, mode: '4pc' | '6pc') => void;
}

export const AlignGearSetModal: React.FC<Props> = ({
  isOpen,
  initialSetId,
  onClose,
  onConfirm
}) => {
  const [selectedSetId, setSelectedSetId] = useState(initialSetId || gearSets[0]?.id || 'striker');
  const [alignMode, setAlignMode] = useState<'4pc' | '6pc'>('4pc');

  useEffect(() => {
    if (initialSetId) {
      setSelectedSetId(initialSetId);
    }
  }, [initialSetId, isOpen]);

  if (!isOpen) return null;

  const currentSet = gearSets.find(s => s.id === selectedSetId) || gearSets[0];

  const handleConfirm = () => {
    onConfirm(selectedSetId, alignMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-shd-surface1 border border-shd-border2 max-w-lg w-full p-6 clip-corner shadow-2xl flex flex-col gap-4">
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
            <strong className="text-amber-400 font-bold block mb-1">WARNING: OVERWRITING LOADOUT PIECES</strong>
            Aligning this gear set will replace your existing gear pieces across the selected slots with <strong>{currentSet?.name}</strong> pieces (resetting their attributes, cores, and brands).
          </div>
        </div>

        {/* Gear Set Selection */}
        <div className="flex flex-col gap-1.5 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
          <label className="text-xs font-heading font-bold text-shd-textPrimary uppercase">
            Select Gear Set to Align:
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

        {/* Alignment Mode Selection */}
        <div className="flex flex-col gap-2 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
          <label className="text-xs font-heading font-bold text-shd-textPrimary uppercase">
            Choose Alignment Mode:
          </label>

          <label className="flex items-start gap-2.5 p-2 bg-shd-surface1 border border-shd-border3/60 clip-corner-sm cursor-pointer hover:border-shd-orange/60 transition-colors">
            <input
              type="radio"
              name="alignMode"
              checked={alignMode === '4pc'}
              onChange={() => setAlignMode('4pc')}
              className="mt-0.5 accent-shd-orange"
            />
            <div className="text-xs font-mono">
              <span className="font-bold text-shd-orange block">4-Piece Standard (Mask, Holster, Gloves, Kneepads)</span>
              <span className="text-[11px] text-shd-textSecondary block mt-0.5">
                Recommended in Division 2: Activates the 4pc set talent while preserving your Chest & Backpack for brand talents or Exotics.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-2 bg-shd-surface1 border border-shd-border3/60 clip-corner-sm cursor-pointer hover:border-shd-orange/60 transition-colors">
            <input
              type="radio"
              name="alignMode"
              checked={alignMode === '6pc'}
              onChange={() => setAlignMode('6pc')}
              className="mt-0.5 accent-shd-orange"
            />
            <div className="text-xs font-mono">
              <span className="font-bold text-white block">Full 6-Piece Set (All 6 Slots)</span>
              <span className="text-[11px] text-shd-textSecondary block mt-0.5">
                Replaces all 6 armour slots with {currentSet?.name} pieces (includes Chest & Backpack Set Talents).
              </span>
            </div>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-shd-border1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono border border-shd-border3 text-shd-textSecondary hover:text-white clip-corner-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-heading font-bold bg-shd-orange text-shd-bg clip-corner-sm hover:bg-shd-orangeLight transition-colors shadow-lg"
          >
            Confirm & Align Set
          </button>
        </div>
      </div>
    </div>
  );
};
