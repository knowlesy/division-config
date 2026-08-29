import React from 'react';
import { CandidateBuild } from '../lib/optimizer/types';
import { ComputedLoadoutStats } from '../lib/calc/types';

interface Props {
  baselineStats: ComputedLoadoutStats;
  baselineName: string;
  comparisonBuilds: CandidateBuild[];
  onRemoveComparison: (id: string) => void;
  onEquip: (build: CandidateBuild) => void;
  onClearAll: () => void;
}

export const ComparisonView: React.FC<Props> = ({
  baselineStats,
  baselineName,
  comparisonBuilds,
  onRemoveComparison,
  onEquip,
  onClearAll
}) => {
  if (comparisonBuilds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center bg-shd-surface1 border border-shd-border1 p-8 clip-corner">
        <div className="text-3xl text-shd-orange font-heading font-bold mb-2">⚖️ Build Comparison</div>
        <p className="text-sm font-mono text-shd-textSecondary max-w-md mx-auto">
          No builds currently staged for comparison. Use the <strong>+ Compare</strong> button in the Optimizer or Loadout Editor to compare builds side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 py-2">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-base text-shd-textPrimary uppercase tracking-wider">
          Side-by-Side Loadout & Multiplier Delta Comparison
        </h2>
        <button
          onClick={onClearAll}
          className="text-xs font-mono px-3 py-1.5 border border-shd-border3 hover:border-rose-500 text-shd-textSecondary hover:text-rose-400 clip-corner-sm transition-colors"
        >
          Clear Staged ({comparisonBuilds.length})
        </button>
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto bg-shd-surface1 border border-shd-border1 clip-corner p-4">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-shd-border2">
              <th className="p-2.5 text-shd-textMonoMuted uppercase text-[10px] w-48">Metric / Multiplier</th>
              <th className="p-2.5 bg-shd-surface2 font-heading font-bold text-shd-orange text-sm border-l border-shd-border2">
                [Active Baseline]<br />
                <span className="text-xs font-sans text-white font-normal">{baselineName}</span>
              </th>
              {comparisonBuilds.map(c => (
                <th key={c.id} className="p-2.5 bg-shd-surface2 font-heading font-bold text-shd-textPrimary text-sm border-l border-shd-border2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{c.name}</span>
                    <button
                      onClick={() => onRemoveComparison(c.id)}
                      className="text-shd-textMonoMuted hover:text-rose-400 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    onClick={() => onEquip(c)}
                    className="mt-1.5 w-full py-1 text-[10px] bg-shd-orange text-shd-bg font-bold clip-corner-sm hover:bg-shd-orangeLight transition-colors"
                  >
                    Equip Build
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-shd-border1">
            {/* Sustained DPS */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary font-semibold">Sustained DPS</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-shd-orange">
                {Math.round(baselineStats.sustainedDps).toLocaleString()}
              </td>
              {comparisonBuilds.map(c => {
                const delta = c.stats.sustainedDps - baselineStats.sustainedDps;
                const pct = (delta / (baselineStats.sustainedDps || 1)) * 100;
                return (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                    <div>{Math.round(c.stats.sustainedDps).toLocaleString()}</div>
                    <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {delta >= 0 ? '+' : ''}{pct.toFixed(1)}% ({delta >= 0 ? '+' : ''}{Math.round(delta).toLocaleString()})
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Expected Bullet Hit */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary font-semibold">Expected Bullet Hit</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-emerald-400">
                {Math.round(baselineStats.expectedDamagePerShot).toLocaleString()}
              </td>
              {comparisonBuilds.map(c => {
                const delta = c.stats.expectedDamagePerShot - baselineStats.expectedDamagePerShot;
                const pct = (delta / (baselineStats.expectedDamagePerShot || 1)) * 100;
                return (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                    <div>{Math.round(c.stats.expectedDamagePerShot).toLocaleString()}</div>
                    <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {delta >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Total Armor */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary font-semibold">Total Armor</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-shd-blueCore">
                {(baselineStats.totalArmor / 1000).toFixed(0)}k
              </td>
              {comparisonBuilds.map(c => {
                const delta = c.stats.totalArmor - baselineStats.totalArmor;
                return (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                    <div>{(c.stats.totalArmor / 1000).toFixed(0)}k</div>
                    <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {delta >= 0 ? '+' : ''}{(delta / 1000).toFixed(0)}k
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Skill Tier */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary font-semibold">Skill Tier</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-shd-yellowCore">
                Tier {baselineStats.skillTier}
              </td>
              {comparisonBuilds.map(c => (
                <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold text-shd-yellowCore">
                  Tier {c.stats.skillTier}
                </td>
              ))}
            </tr>

            {/* Crit Chance & Damage */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary">Crit Chance / Damage</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 text-shd-textSecondary">
                {(baselineStats.groupBreakdown.critChance * 100).toFixed(0)}% CHC · +{(baselineStats.groupBreakdown.critDamage * 100).toFixed(0)}% CHD
              </td>
              {comparisonBuilds.map(c => (
                <td key={c.id} className="p-2.5 border-l border-shd-border2 text-shd-textSecondary">
                  {(c.stats.groupBreakdown.critChance * 100).toFixed(0)}% CHC · +{(c.stats.groupBreakdown.critDamage * 100).toFixed(0)}% CHD
                </td>
              ))}
            </tr>

            {/* Multiplier Groups: WD Sum */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary">1. All Weapon Damage</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 text-shd-orange">
                +{(baselineStats.groupBreakdown.weaponDamageSum * 100).toFixed(0)}%
              </td>
              {comparisonBuilds.map(c => (
                <td key={c.id} className="p-2.5 border-l border-shd-border2 text-shd-orange">
                  +{(c.stats.groupBreakdown.weaponDamageSum * 100).toFixed(0)}%
                </td>
              ))}
            </tr>

            {/* Multiplier Groups: Independent Amplifiers */}
            <tr>
              <td className="p-2.5 text-shd-textSecondary">4. Total Amplifiers</td>
              <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 text-amber-400 font-bold">
                {baselineStats.groupBreakdown.totalAmplifierMultiplier.toFixed(2)}x
              </td>
              {comparisonBuilds.map(c => (
                <td key={c.id} className="p-2.5 border-l border-shd-border2 text-amber-400 font-bold">
                  {c.stats.groupBreakdown.totalAmplifierMultiplier.toFixed(2)}x
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
