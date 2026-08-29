import React from 'react';
import { ComputedLoadoutStats } from '../lib/calc/types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  stats: ComputedLoadoutStats;
  onSendToAdvisor?: (statSummary: string) => void;
}

export const StatsPanel: React.FC<Props> = ({ stats, onSendToAdvisor }) => {
  const { groupBreakdown, warnings, itemisationErrors, activeBrandBonuses, activeSetBonuses } = stats;

  return (
    <div className="flex flex-col gap-3.5 bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg">
      {/* Top Banner: Damage Big Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
        <div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
            Sustained DPS
          </div>
          <div className="font-heading font-bold text-xl sm:text-2xl text-shd-orange tracking-tight">
            {Math.round(stats.sustainedDps).toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted">
            Cycle: {stats.groupBreakdown.magazineSizeMultiplier > 1 ? `Mag x${stats.groupBreakdown.magazineSizeMultiplier.toFixed(2)}` : 'Standard'}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
            Burst DPS
          </div>
          <div className="font-heading font-bold text-xl sm:text-2xl text-shd-textPrimary tracking-tight">
            {Math.round(stats.burstDps).toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted">
            RPS: {(stats.burstDps / (stats.expectedDamagePerShot || 1)).toFixed(1)}/s
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
            Expected Hit / Shot
          </div>
          <div className="font-heading font-bold text-xl sm:text-2xl text-emerald-400 tracking-tight">
            {Math.round(stats.expectedDamagePerShot).toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted">
            Crit: {Math.round(stats.effectiveCritHitDamage).toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted uppercase tracking-wider">
            Total Armor
          </div>
          <div className="font-heading font-bold text-xl sm:text-2xl text-shd-blueCore tracking-tight">
            {(stats.totalArmor / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] font-mono text-shd-textMonoMuted">
            Skill Tier: {stats.skillTier}
          </div>
        </div>
      </div>

      {/* Pestilence Plague Banner if active */}
      {stats.pestilencePlagueTickDamage && stats.pestilencePlagueTickDamage > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/60 p-2.5 clip-corner-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-heading font-bold text-amber-400">
              ☠️ PESTILENCE PLAGUE OF THE OUTCASTS (50 STACKS)
            </div>
            <div className="text-[11px] font-mono text-shd-textSecondary">
              Tick: <span className="text-white font-semibold">{Math.round(stats.pestilencePlagueTickDamage).toLocaleString()}</span> / sec (Total 10s: {Math.round(stats.pestilencePlagueTickDamage * 10).toLocaleString()})
            </div>
          </div>
          <ConfidenceBadge tag="[PDF]" />
        </div>
      )}

      {/* Critical Hit & Headshot Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-shd-surface2 p-2.5 border border-shd-border2 clip-corner-sm font-mono text-xs">
        <div>
          <span className="text-shd-textMonoMuted text-[10px]">CRIT CHANCE:</span>
          <div className={`font-bold ${groupBreakdown.critChance >= 0.60 ? 'text-amber-400' : 'text-shd-textPrimary'}`}>
            {(groupBreakdown.critChance * 100).toFixed(1)}% {groupBreakdown.critChance >= 0.60 && '(CAP)'}
          </div>
        </div>
        <div>
          <span className="text-shd-textMonoMuted text-[10px]">CRIT DAMAGE:</span>
          <div className="font-bold text-shd-textPrimary">
            +{(groupBreakdown.critDamage * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-shd-textMonoMuted text-[10px]">HEADSHOT DMG:</span>
          <div className="font-bold text-shd-textPrimary">
            +{(groupBreakdown.headshotDamage * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-shd-textMonoMuted text-[10px]">EFF. CRIT FACTOR:</span>
          <div className="font-bold text-emerald-400">
            {groupBreakdown.effectiveCritFactor.toFixed(3)}x
          </div>
        </div>
      </div>

      {/* Multiplier Groups Stacking Tree */}
      <div className="bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-shd-border1 pb-1.5">
          <span className="font-heading font-bold text-xs uppercase tracking-wider text-shd-textPrimary">
            Multiplier Group Mathematical Breakdown
          </span>
          <span className="text-[10px] font-mono text-shd-textMonoMuted">
            Groups Multiply · Intragroup Adds
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between bg-shd-surface1 px-2 py-1 clip-corner-sm">
            <span className="text-shd-textSecondary">1. All Weapon Damage (WD Sum):</span>
            <span className="text-shd-orange font-semibold">+{(groupBreakdown.weaponDamageSum * 100).toFixed(1)}% ({(1 + groupBreakdown.weaponDamageSum).toFixed(2)}x)</span>
          </div>

          <div className="flex items-center justify-between bg-shd-surface1 px-2 py-1 clip-corner-sm">
            <span className="text-shd-textSecondary">2. Total Weapon Damage (TWD Sum):</span>
            <span className="text-shd-orange font-semibold">+{(groupBreakdown.totalWeaponDamageSum * 100).toFixed(1)}% ({(1 + groupBreakdown.totalWeaponDamageSum).toFixed(2)}x)</span>
          </div>

          <div className="flex items-center justify-between bg-shd-surface1 px-2 py-1 clip-corner-sm">
            <span className="text-shd-textSecondary">3. Expected Critical Hit Term:</span>
            <span className="text-emerald-400 font-semibold">{groupBreakdown.effectiveCritFactor.toFixed(3)}x</span>
          </div>

          {groupBreakdown.amplifiers.length > 0 && (
            <div className="bg-shd-surface1 p-2 clip-corner-sm flex flex-col gap-1 border border-shd-border1">
              <span className="text-shd-orange text-[10px] font-bold uppercase">
                4. Independent Multiplicative Amplifiers ({groupBreakdown.totalAmplifierMultiplier.toFixed(3)}x Net):
              </span>
              {groupBreakdown.amplifiers.map((amp, idx) => (
                <div key={idx} className="flex items-center justify-between pl-2 text-[11px]">
                  <span className="text-shd-textSecondary">▸ {amp.source}:</span>
                  <span className="text-amber-400 font-bold">{amp.factor.toFixed(2)}x amp</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Brand & Gear Set Bonuses */}
      <div className="bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm flex flex-col gap-2">
        <span className="font-heading font-bold text-xs uppercase tracking-wider text-shd-textPrimary">
          Active Set & Brand Bonuses
        </span>

        <div className="space-y-2 text-xs">
          {activeSetBonuses.map((set, idx) => (
            <div key={idx} className="bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
              <div className="font-heading font-bold text-shd-gearSet flex items-center justify-between">
                <span>{set.setName} ({set.piecesCount}pc {set.effectivePiecesCount > set.piecesCount ? `→ ${set.effectivePiecesCount}pc NinjaBike` : ''})</span>
                <span className="text-[10px] font-mono text-emerald-400">TIER {set.tierUnlocked}</span>
              </div>
              <div className="text-[11px] font-mono text-shd-textSecondary mt-1">
                {set.bonuses.map((b, bi) => (
                  <div key={bi}>▸ {b.raw?.replace(/\n/g, ' ')}</div>
                ))}
                {set.talent && <div className="text-amber-300 font-semibold mt-1">4pc: {set.talent.split('\n')[0]}</div>}
              </div>
            </div>
          ))}

          {activeBrandBonuses.map((brand, idx) => (
            <div key={idx} className="bg-shd-surface1 p-2 border border-shd-border1 clip-corner-sm">
              <div className="font-heading font-bold text-shd-brand flex items-center justify-between">
                <span>{brand.setName} ({brand.piecesCount}pc {brand.effectivePiecesCount > brand.piecesCount ? `→ ${brand.effectivePiecesCount}pc NinjaBike` : ''})</span>
                <span className="text-[10px] font-mono text-purple-300">TIER {brand.tierUnlocked}</span>
              </div>
              <div className="text-[11px] font-mono text-shd-textSecondary mt-1">
                {brand.bonuses.map((b, bi) => (
                  <div key={bi}>▸ {b.raw?.replace(/\n/g, ' ')}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings & Legality Errors */}
      {(warnings.length > 0 || itemisationErrors.length > 0) && (
        <div className="bg-rose-950/20 border border-rose-800/60 p-3 clip-corner-sm flex flex-col gap-1.5">
          <div className="font-heading font-bold text-xs text-rose-400 uppercase">
            ⚠️ Diagnostic Warnings & Itemisation Legality
          </div>
          {itemisationErrors.map((err, idx) => (
            <div key={`err-${idx}`} className="text-xs font-mono text-rose-300">
              ✖ {err}
            </div>
          ))}
          {warnings.map((warn, idx) => (
            <div key={`warn-${idx}`} className="text-xs font-mono text-amber-300">
              • {warn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
