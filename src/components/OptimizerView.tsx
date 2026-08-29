import React, { useState } from 'react';
import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext } from '../lib/calc/types';
import { OptimizationObjective, OptimizerConstraints, CandidateBuild } from '../lib/optimizer/types';
import { runOptimization } from '../lib/optimizer/engine';
import { ConfidenceBadge } from './ConfidenceBadge';

import gearSetsData from '../../data/gear-sets.json';
import gearNamedData from '../../data/gear-named.json';

const gearSets = gearSetsData as any[];
const namedGear = gearNamedData as any[];

interface Props {
  currentGear: Record<GearSlot, GearPieceInstance>;
  activeWeapon: WeaponInstance;
  watch: WatchStats;
  specialization: string;
  context: CombatContext;
  onEquipCandidate: (candidate: CandidateBuild) => void;
  onAddToComparison: (candidate: CandidateBuild) => void;
}

export const OptimizerView: React.FC<Props> = ({
  currentGear,
  activeWeapon,
  watch,
  specialization,
  context,
  onEquipCandidate,
  onAddToComparison
}) => {
  const [objective, setObjective] = useState<OptimizationObjective>('max_sustained_dps');
  const [minArmor, setMinArmor] = useState<number>(0);
  const [minSkillTier, setMinSkillTier] = useState<number>(0);
  const [requiredGearSetId, setRequiredGearSetId] = useState<string>('');
  const [requiredExoticId, setRequiredExoticId] = useState<string>('');
  const [results, setResults] = useState<CandidateBuild[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleRunOptimizer = () => {
    setIsSearching(true);
    setTimeout(() => {
      const constraints: OptimizerConstraints = {};
      if (minArmor > 0) constraints.minArmor = minArmor;
      if (minSkillTier > 0) constraints.minSkillTier = minSkillTier;
      if (requiredGearSetId) constraints.requiredGearSetId = requiredGearSetId;
      if (requiredExoticId) constraints.requiredExoticId = requiredExoticId;

      const topCandidates = runOptimization(
        currentGear,
        activeWeapon,
        objective,
        constraints,
        watch,
        specialization,
        context
      );
      setResults(topCandidates);
      setIsSearching(false);
    }, 150);
  };

  return (
    <div className="w-full flex flex-col gap-5 max-w-7xl mx-auto py-2">
      {/* Controls Card */}
      <div className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-shd-border2 pb-2">
          <div>
            <h2 className="font-heading font-bold text-base text-shd-textPrimary uppercase tracking-wider flex items-center gap-2">
              <span className="text-shd-orange">⚡</span> Division 2 Multiplier-Aware Optimizer
            </h2>
            <p className="text-xs font-mono text-shd-textMonoMuted mt-0.5">
              Constraint-based pruning engine · Evaluates multiplier group interactions & independent amplifier terms
            </p>
          </div>
          <ConfidenceBadge tag="[PDF]" />
        </div>

        {/* Objective & Constraints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Column 1: Objective */}
          <div className="flex flex-col gap-1.5 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
            <label className="text-[10px] text-shd-textMonoMuted uppercase tracking-wider font-bold">
              1. Optimization Objective
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as OptimizationObjective)}
              className="bg-shd-surface1 border border-shd-border3 p-2 text-xs font-sans text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
            >
              <option value="max_sustained_dps">Max Sustained DPS (Cycle & Reloads)</option>
              <option value="max_burst_dps">Max Burst DPS</option>
              <option value="max_bullet_hit">Max Single-Bullet Expected Hit</option>
              <option value="max_plague_damage">Max Pestilence Plague Tick Damage</option>
              <option value="max_status_effects">Max Status Effects Duration & Spread</option>
              <option value="max_skill_damage">Max Skill Damage</option>
              <option value="max_armor_dps">Max Survivability & DPS Balance</option>
            </select>
            <p className="text-[11px] text-shd-textSecondary mt-1 leading-relaxed">
              Target weapon: <span className="text-shd-orange font-bold">{activeWeapon.name}</span> ({activeWeapon.category})
            </p>
          </div>

          {/* Column 2: Hard Floor Constraints */}
          <div className="flex flex-col gap-2 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
            <label className="text-[10px] text-shd-textMonoMuted uppercase tracking-wider font-bold">
              2. Core Attribute Floors
            </label>

            <div>
              <div className="flex justify-between text-[11px] text-shd-textSecondary">
                <span>Minimum Total Armor:</span>
                <span className="text-shd-blueCore font-bold">{minArmor === 0 ? 'Any' : `${(minArmor / 1000).toFixed(0)}k`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1746000"
                step="170000"
                value={minArmor}
                onChange={(e) => setMinArmor(parseInt(e.target.value, 10))}
                className="w-full accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-shd-textSecondary">
                <span>Minimum Skill Tier:</span>
                <span className="text-shd-yellowCore font-bold">{minSkillTier === 0 ? 'Any' : `Tier ${minSkillTier}`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={minSkillTier}
                onChange={(e) => setMinSkillTier(parseInt(e.target.value, 10))}
                className="w-full accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Column 3: Fixed Pieces / Required Sets */}
          <div className="flex flex-col gap-2 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
            <label className="text-[10px] text-shd-textMonoMuted uppercase tracking-wider font-bold">
              3. Required Gear Set / Exotic
            </label>

            <select
              value={requiredGearSetId}
              onChange={(e) => setRequiredGearSetId(e.target.value)}
              className="bg-shd-surface1 border border-shd-border3 p-1.5 text-xs font-sans text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
            >
              <option value="">Any Gear Set / High-End</option>
              {gearSets.map(s => (
                <option key={s.id} value={s.id}>Must Include: {s.name} (4pc)</option>
              ))}
            </select>

            <select
              value={requiredExoticId}
              onChange={(e) => setRequiredExoticId(e.target.value)}
              className="bg-shd-surface1 border border-shd-border3 p-1.5 text-xs font-sans text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
            >
              <option value="">Any Exotic Piece</option>
              {namedGear.filter(g => g.isExotic).map(g => (
                <option key={g.id} value={g.id}>Must Include: {g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleRunOptimizer}
            disabled={isSearching}
            className="px-6 py-2.5 bg-shd-orange text-shd-bg font-heading font-bold text-sm tracking-wider uppercase clip-corner hover:bg-shd-orangeLight transition-colors shadow-md disabled:opacity-50"
          >
            {isSearching ? 'Computing Multiplier Permutations...' : '⚡ Run Build Optimizer'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-shd-textPrimary">
              Top Ranked Builds ({results.length} Candidates Found)
            </h3>
            <span className="text-xs font-mono text-shd-textMonoMuted">
              Ranked by {objective.replace(/_/g, ' ')}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="bg-shd-surface1 border border-shd-border2 p-6 text-center text-shd-textSecondary font-mono text-sm clip-corner">
              No builds matched the specified core attribute floors and required sets. Try lowering the Armor or Skill Tier requirement.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((candidate, rank) => (
                <div
                  key={candidate.id}
                  className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg flex flex-col gap-3"
                >
                  {/* Candidate Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shd-border2 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-shd-orange text-shd-bg font-heading font-bold text-xs clip-corner-sm">
                        #{rank + 1}
                      </span>
                      <h4 className="font-heading font-bold text-base text-shd-textPrimary">
                        {candidate.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddToComparison(candidate)}
                        className="px-3 py-1.5 text-xs font-heading font-semibold bg-shd-surface2 border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white clip-corner-sm transition-colors"
                      >
                        + Compare
                      </button>
                      <button
                        onClick={() => onEquipCandidate(candidate)}
                        className="px-4 py-1.5 text-xs font-heading font-bold bg-shd-orange text-shd-bg clip-corner-sm hover:bg-shd-orangeLight transition-colors"
                      >
                        Equip Build
                      </button>
                    </div>
                  </div>

                  {/* Candidate Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-shd-surface2 p-2.5 border border-shd-border2 clip-corner-sm font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-shd-textMonoMuted uppercase">Sustained DPS</span>
                      <div className="font-bold text-shd-orange text-base">
                        {Math.round(candidate.stats.sustainedDps).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-shd-textMonoMuted uppercase">Expected Hit</span>
                      <div className="font-bold text-emerald-400 text-base">
                        {Math.round(candidate.stats.expectedDamagePerShot).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-shd-textMonoMuted uppercase">Total Armor</span>
                      <div className="font-bold text-shd-blueCore text-base">
                        {(candidate.stats.totalArmor / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-shd-textMonoMuted uppercase">Crit Rate / Term</span>
                      <div className="font-bold text-shd-textPrimary text-base">
                        {(candidate.stats.groupBreakdown.critChance * 100).toFixed(0)}% CHC · {candidate.stats.groupBreakdown.effectiveCritFactor.toFixed(2)}x
                      </div>
                    </div>
                  </div>

                  {/* Tradeoff Explanation in Plain English */}
                  <div className="bg-shd-surface2/60 p-3 border border-shd-border2 clip-corner-sm flex flex-col gap-1.5">
                    <span className="font-heading font-bold text-xs uppercase text-amber-400">
                      Why this build ranks #{rank + 1} & Trade-off Analysis:
                    </span>
                    <ul className="space-y-1 text-xs font-mono text-shd-textSecondary">
                      {candidate.tradeoffAnalysis.map((note, ni) => (
                        <li key={ni} className="flex items-start gap-1.5">
                          <span className="text-shd-orange">▸</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Gear Layout Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[11px] font-mono">
                    {Object.entries(candidate.gear).map(([slot, piece]) => (
                      <div key={slot} className="bg-shd-surface2 p-2 border border-shd-border1 clip-corner-sm">
                        <div className="text-[9px] uppercase text-shd-orange font-bold">{slot}</div>
                        <div className="font-semibold text-shd-textPrimary truncate">{piece.name}</div>
                        <div className="text-[10px] text-shd-textMonoMuted">{piece.core.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
