import React from 'react';
import { CombatContext } from '../lib/calc/types';

interface Props {
  context: CombatContext;
  onChange: (updated: CombatContext) => void;
  onLoadPreset: (presetKey: 'buildA' | 'buildB' | 'buildB2' | 'buildC' | 'buildD') => void;
}

export const CombatContextBar: React.FC<Props> = ({ context, onChange, onLoadPreset }) => {
  return (
    <div className="w-full bg-shd-surface2 border border-shd-border2 p-3 clip-corner flex flex-col gap-3 shadow-md">
      {/* Top row: Presets & Context Modes */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shd-border1 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider mr-1">
            Reference Presets:
          </span>
          <button
            onClick={() => onLoadPreset('buildA')}
            className="px-2.5 py-1 text-[11px] font-heading font-semibold bg-shd-surface1 border border-shd-border3 hover:border-shd-orange text-shd-textPrimary clip-corner-sm transition-colors"
          >
            A. Pestilence DPS
          </button>
          <button
            onClick={() => onLoadPreset('buildB')}
            className="px-2.5 py-1 text-[11px] font-heading font-semibold bg-shd-surface1 border border-shd-border3 hover:border-shd-orange text-shd-textPrimary clip-corner-sm transition-colors"
          >
            B. Control Group (Courier)
          </button>
          <button
            onClick={() => onLoadPreset('buildB2')}
            className="px-2.5 py-1 text-[11px] font-heading font-semibold bg-shd-surface1 border border-shd-border3 hover:border-shd-orange text-shd-textPrimary clip-corner-sm transition-colors"
          >
            B2. Control Solo (Symptom)
          </button>
          <button
            onClick={() => onLoadPreset('buildC')}
            className="px-2.5 py-1 text-[11px] font-heading font-semibold bg-shd-surface1 border border-shd-border3 hover:border-shd-orange text-shd-textPrimary clip-corner-sm transition-colors"
          >
            C. Support 3-Man
          </button>
          <button
            onClick={() => onLoadPreset('buildD')}
            className="px-2.5 py-1 text-[11px] font-heading font-semibold bg-shd-surface1 border border-shd-border3 hover:border-shd-orange text-shd-textPrimary clip-corner-sm transition-colors"
          >
            D. True Patriot (Red Flag)
          </button>
        </div>

        {/* Solo vs Group Toggle */}
        <div className="flex items-center bg-shd-surface1 p-0.5 border border-shd-border3 clip-corner-sm text-xs font-mono">
          <button
            onClick={() => onChange({ ...context, isSolo: true })}
            className={`px-2.5 py-0.5 clip-corner-sm transition-colors ${
              context.isSolo ? 'bg-shd-orange text-shd-bg font-bold' : 'text-shd-textSecondary hover:text-white'
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => onChange({ ...context, isSolo: false })}
            className={`px-2.5 py-0.5 clip-corner-sm transition-colors ${
              !context.isSolo ? 'bg-shd-orange text-shd-bg font-bold' : 'text-shd-textSecondary hover:text-white'
            }`}
          >
            Group (3-Man / Raid)
          </button>
        </div>
      </div>

      {/* Combat Condition Toggles & Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Distance Band */}
        <div className="flex flex-col gap-1 bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
          <div className="flex items-center justify-between text-[10px] text-shd-textMonoMuted uppercase">
            <span>Engagement Distance</span>
            <span className="text-shd-orange font-bold">{context.distanceMeters}m</span>
          </div>
          <div className="flex gap-1">
            {[
              { label: '0-15m (Close)', val: 10 },
              { label: '15-25m (Mid)', val: 20 },
              { label: '25m+ (Long)', val: 30 }
            ].map(d => (
              <button
                key={d.val}
                onClick={() => onChange({ ...context, distanceMeters: d.val })}
                className={`flex-1 py-1 text-[10px] border clip-corner-sm transition-colors ${
                  context.distanceMeters === d.val
                    ? 'border-shd-orange bg-shd-surface3 text-shd-orange font-bold'
                    : 'border-shd-border2 text-shd-textSecondary hover:border-shd-border3'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target States */}
        <div className="flex flex-col gap-1 bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
          <span className="text-[10px] text-shd-textMonoMuted uppercase">Target Condition</span>
          <div className="flex flex-wrap gap-2 pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-shd-textSecondary">
              <input
                type="checkbox"
                checked={context.isEnemyOutOfCover !== false}
                onChange={(e) => onChange({ ...context, isEnemyOutOfCover: e.target.checked })}
                className="accent-shd-orange"
              />
              Out of Cover
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-shd-textSecondary">
              <input
                type="checkbox"
                checked={!!context.isEnemyPulsed}
                onChange={(e) => onChange({ ...context, isEnemyPulsed: e.target.checked })}
                className="accent-shd-orange"
              />
              Pulsed
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-shd-textSecondary">
              <input
                type="checkbox"
                checked={!!context.isEnemyStatusAffected}
                onChange={(e) => onChange({ ...context, isEnemyStatusAffected: e.target.checked })}
                className="accent-shd-orange"
              />
              Status Affected
            </label>
          </div>
        </div>

        {/* Gear Set Stacks: Throttle / Striker */}
        <div className="flex flex-col gap-1 bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
          <div className="flex items-center justify-between text-[10px] text-shd-textMonoMuted uppercase">
            <span>Throttle Control Stacks</span>
            <span className="text-shd-orange font-bold">{context.throttleControlStacks ?? 75} / 75</span>
          </div>
          <input
            type="range"
            min="0"
            max="75"
            value={context.throttleControlStacks ?? 75}
            onChange={(e) => onChange({ ...context, throttleControlStacks: parseInt(e.target.value, 10) })}
            className="accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1 bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
          <div className="flex items-center justify-between text-[10px] text-shd-textMonoMuted uppercase">
            <span>Striker / Heartbreaker Stacks</span>
            <span className="text-shd-orange font-bold">{context.strikerStacks ?? 100}</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={context.strikerStacks ?? 100}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChange({ ...context, strikerStacks: val, heartstopperStacks: Math.min(100, val) });
            }}
            className="accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
