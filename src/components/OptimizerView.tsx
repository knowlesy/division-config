import React, { useState, useEffect } from 'react';
import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext } from '../lib/calc/types';
import { ARCHETYPES, ArchetypeDefinition, ArchetypeFloors } from '../lib/optimizer/archetypes';
import { runTwoTierOptimization } from '../lib/optimizer/engine';
import { TwoTierResult, ShoppingListItem, WeaponShoppingItem } from '../lib/optimizer/cost-model';
import { CandidateBuild } from '../lib/optimizer/types';
import { ConfidenceBadge } from './ConfidenceBadge';

import { calculateLoadout } from '../lib/calc/loadout-calculator';

interface Props {
  currentGear: Record<GearSlot, GearPieceInstance>;
  activeWeapon: WeaponInstance;
  watch: WatchStats;
  specialization: string;
  context: CombatContext;
  onEquipCandidate: (candidate: CandidateBuild) => void;
  onAddToComparison: (candidate: CandidateBuild) => void;
  onSwitchToComparison?: () => void;
}

export const OptimizerView: React.FC<Props> = ({
  currentGear,
  activeWeapon,
  watch,
  specialization,
  context,
  onEquipCandidate,
  onAddToComparison,
  onSwitchToComparison
}) => {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('sustained_dps');
  const [isGroupMode, setIsGroupMode] = useState<boolean>(!context.isSolo);
  const [isFloorsExpanded, setIsFloorsExpanded] = useState<boolean>(false);
  const [customMinArmor, setCustomMinArmor] = useState<number>(0);
  const [customMinSkillTier, setCustomMinSkillTier] = useState<number>(0);
  const [customMinSkillHaste, setCustomMinSkillHaste] = useState<number>(0);
  const [customMinHazardProtection, setCustomMinHazardProtection] = useState<number>(0);

  const [result, setResult] = useState<TwoTierResult | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const archetypeList = Object.values(ARCHETYPES);
  const currentArchetype = ARCHETYPES[selectedArchetypeId] || ARCHETYPES['sustained_dps'];

  // Initialize floors when archetype changes
  useEffect(() => {
    if (currentArchetype.defaultFloors) {
      setCustomMinArmor(currentArchetype.defaultFloors.minArmor || 0);
      setCustomMinSkillTier(currentArchetype.defaultFloors.minSkillTier || 0);
      setCustomMinSkillHaste(currentArchetype.defaultFloors.minSkillHaste ? currentArchetype.defaultFloors.minSkillHaste * 100 : 0);
      setCustomMinHazardProtection(currentArchetype.defaultFloors.minHazardProtection ? currentArchetype.defaultFloors.minHazardProtection * 100 : 0);
    }
  }, [selectedArchetypeId]);

  // If in solo mode and selected archetype is group-only, fallback to sustained_dps
  useEffect(() => {
    if (!isGroupMode && currentArchetype.isGroupOnly) {
      setSelectedArchetypeId('sustained_dps');
    }
  }, [isGroupMode]);

  const handleRunOptimizer = () => {
    setIsSearching(true);
    setTimeout(() => {
      const customFloors: ArchetypeFloors = {};
      if (customMinArmor > 0) customFloors.minArmor = customMinArmor;
      if (customMinSkillTier > 0) customFloors.minSkillTier = customMinSkillTier;
      if (customMinSkillHaste > 0) customFloors.minSkillHaste = customMinSkillHaste / 100;
      if (customMinHazardProtection > 0) customFloors.minHazardProtection = customMinHazardProtection / 100;

      const optContext: CombatContext = {
        ...context,
        isSolo: !isGroupMode
      };

      const optResult = runTwoTierOptimization(activeWeapon, {
        archetypeId: selectedArchetypeId,
        customFloors,
        watch,
        specialization,
        context: optContext
      });

      setResult(optResult);
      setIsSearching(false);
    }, 150);
  };

  const handleEquipTier = (tierKey: 'practical' | 'ceiling') => {
    if (!result) return;
    const tierData = result[tierKey];
    const candidate: CandidateBuild = {
      id: `${result.archetype.id}-${tierKey}`,
      name: `${result.archetype.name} (${tierKey.toUpperCase()})`,
      gear: tierData.gear,
      weapon: activeWeapon,
      score: tierData.score,
      stats: tierData.stats,
      tradeoffAnalysis: [
        `${tierKey.toUpperCase()} build for ${result.archetype.name}`,
        result.gap.scoreDeltaHeadline,
        `Recommended Specialization: ${result.recommendedSpecialization.name}`
      ]
    };
    onEquipCandidate(candidate);
  };

  const handleCompareTier = (tierKey: 'practical' | 'ceiling') => {
    if (!result) return;
    const tierData = result[tierKey];
    const candidate: CandidateBuild = {
      id: `${result.archetype.id}-${tierKey}`,
      name: `${result.archetype.name} (${tierKey.toUpperCase()})`,
      gear: tierData.gear,
      weapon: activeWeapon,
      score: tierData.score,
      stats: tierData.stats,
      tradeoffAnalysis: [
        `${tierKey.toUpperCase()} build for ${result.archetype.name}`,
        result.gap.scoreDeltaHeadline,
        `Recommended Specialization: ${result.recommendedSpecialization.name}`
      ]
    };
    onAddToComparison(candidate);
  };

  return (
    <div className="w-full flex flex-col gap-5 max-w-7xl mx-auto py-2">
      {/* Controls Card */}
      <div className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-shd-border2 pb-2">
          <div>
            <h2 className="font-heading font-bold text-base text-shd-textPrimary uppercase tracking-wider flex items-center gap-2">
              <span className="text-shd-orange">🏗️</span> Two-Tier Archetype Build Solver
            </h2>
            <p className="text-xs font-mono text-shd-textMonoMuted mt-0.5">
              Objective-driven search over data · Practical vs Ceiling · Deterministic itemisation
            </p>
          </div>
          <ConfidenceBadge tag="[PDF]" />
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs font-mono">
          {/* Archetype Picker (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-2 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
            <label className="text-[10px] text-shd-textMonoMuted uppercase tracking-wider font-bold">
              1. Objective Archetype
            </label>
            <select
              value={selectedArchetypeId}
              onChange={(e) => setSelectedArchetypeId(e.target.value)}
              className="bg-shd-surface1 border border-shd-border3 p-2 text-xs font-sans text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
            >
              {archetypeList.map(a => {
                const disabled = !isGroupMode && a.isGroupOnly;
                return (
                  <option key={a.id} value={a.id} disabled={disabled}>
                    {a.name} {disabled ? '(Group Mode Only)' : ''}
                  </option>
                );
              })}
            </select>
            <div className="p-2 bg-shd-surface1/70 border border-shd-border3/40 clip-corner-sm text-xs font-sans text-shd-textSecondary leading-relaxed">
              <span className="text-shd-orange font-bold font-heading mr-1">ROLE:</span>
              {currentArchetype.description}
            </div>
          </div>

          {/* Mode & Floors Toggle (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3 bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm">
            <div>
              <label className="text-[10px] text-shd-textMonoMuted uppercase tracking-wider font-bold block mb-2">
                2. Combat Context & Party Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupMode(false)}
                  className={`py-2 px-3 text-xs font-heading font-bold uppercase tracking-wider clip-corner-sm transition-colors ${
                    !isGroupMode
                      ? 'bg-shd-orange text-shd-bg shadow'
                      : 'bg-shd-surface1 text-shd-textSecondary hover:text-white border border-shd-border3'
                  }`}
                >
                  Solo Mode
                </button>
                <button
                  type="button"
                  onClick={() => setIsGroupMode(true)}
                  className={`py-2 px-3 text-xs font-heading font-bold uppercase tracking-wider clip-corner-sm transition-colors ${
                    isGroupMode
                      ? 'bg-shd-orange text-shd-bg shadow'
                      : 'bg-shd-surface1 text-shd-textSecondary hover:text-white border border-shd-border3'
                  }`}
                >
                  Group Mode
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-shd-border3/40">
              <button
                type="button"
                onClick={() => setIsFloorsExpanded(!isFloorsExpanded)}
                className="text-[11px] text-shd-textSecondary hover:text-shd-orange flex items-center gap-1 font-mono transition-colors"
              >
                <span>{isFloorsExpanded ? '▼' : '▶'}</span>
                <span>Hard Floor Constraints ({isFloorsExpanded ? 'Hide' : 'Configure'})</span>
              </button>

              <button
                onClick={handleRunOptimizer}
                disabled={isSearching}
                className="px-5 py-2 bg-shd-orange text-shd-bg font-heading font-bold text-xs tracking-wider uppercase clip-corner hover:bg-shd-orangeLight transition-colors shadow-md disabled:opacity-50"
              >
                {isSearching ? 'Calculating...' : '⚡ Optimise'}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Floor Constraints Panel */}
        {isFloorsExpanded && (
          <div className="bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono animate-fadeIn">
            <div>
              <div className="flex justify-between text-[11px] text-shd-textSecondary mb-1">
                <span>Min Armour:</span>
                <span className="text-shd-blueCore font-bold">{customMinArmor === 0 ? 'None' : `${Math.round(customMinArmor / 1000)}k`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1746000"
                step="170000"
                value={customMinArmor}
                onChange={(e) => setCustomMinArmor(parseInt(e.target.value, 10))}
                className="w-full accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-shd-textSecondary mb-1">
                <span>Min Skill Tier:</span>
                <span className="text-shd-yellowCore font-bold">{customMinSkillTier === 0 ? 'None' : `Tier ${customMinSkillTier}`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={customMinSkillTier}
                onChange={(e) => setCustomMinSkillTier(parseInt(e.target.value, 10))}
                className="w-full accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-shd-textSecondary mb-1">
                <span>Min Skill Haste:</span>
                <span className="text-shd-textPrimary font-bold">{customMinSkillHaste === 0 ? 'None' : `${customMinSkillHaste}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={customMinSkillHaste}
                onChange={(e) => setCustomMinSkillHaste(parseInt(e.target.value, 10))}
                className="w-full accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-shd-textSecondary mb-1">
                <span>Min Hazard Protection:</span>
                <span className="text-shd-textPrimary font-bold">{customMinHazardProtection === 0 ? 'None' : `${customMinHazardProtection}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={customMinHazardProtection}
                onChange={(e) => setCustomMinHazardProtection(parseInt(e.target.value, 10))}
                className="w-full accent-shd-orange h-1.5 bg-shd-border2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Headline Gap Card */}
          <div className="bg-shd-surface1 border border-shd-orange/40 p-4 clip-corner shadow-lg flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-shd-border2 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-heading font-bold text-shd-orange px-2 py-0.5 bg-shd-orange/10 border border-shd-orange/30 clip-corner-sm">
                  DELTA SUMMARY
                </span>
                <h3 className="font-heading font-bold text-base text-shd-textPrimary">
                  {result.gap.scoreDeltaHeadline}
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-shd-textSecondary">
                <div>
                  <span className="text-shd-textMonoMuted">Farming cost:</span>{' '}
                  <span className="text-shd-orange font-bold">{result.gap.godRollPiecesNeeded} god-roll pieces</span>
                </div>
                <div>
                  <span className="text-shd-textMonoMuted">Recalibrations:</span>{' '}
                  <span className="text-white font-bold">{result.gap.recalibrationsRequired} cores</span>
                </div>
              </div>
            </div>

            {/* Specialization Recommendation Banner */}
            <div className="bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-heading font-bold px-2 py-0.5 uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 clip-corner-sm">
                  SPECIALIZATION
                </span>
                <span className="font-heading font-bold text-sm text-white">
                  {result.recommendedSpecialization.name}
                </span>
                <span className="text-xs text-shd-textMonoMuted hidden sm:inline">
                  — {result.recommendedSpecialization.rationale}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {result.recommendedSpecialization.perks.map((perk, pi) => (
                  <span
                    key={pi}
                    className="text-[10px] px-2 py-0.5 bg-shd-surface1 border border-shd-border3 text-shd-textSecondary clip-corner-sm flex items-center gap-1"
                  >
                    <span aria-hidden="true">✓</span>
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            </div>

            {result.gap.libraryBanksRequired.length > 0 && (
              <div className="text-xs font-mono text-shd-textSecondary flex items-center gap-1.5 pt-1">
                <span className="text-shd-textMonoMuted">Library banking needed:</span>
                <span className="text-amber-400 font-semibold">{result.gap.libraryBanksRequired.join(', ')}</span>
              </div>
            )}

            {!result.floorsSatisfied && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono clip-corner-sm mt-1 flex items-start gap-1.5">
                <span aria-hidden="true">⚠️</span>
                <span><span className="font-bold">Floor Shortfall:</span> {result.shortfallReason}. Showing closest achievable legal build.</span>
              </div>
            )}
          </div>

          {/* Active Loadout vs Optimized Recommendations Bar */}
          {(() => {
            const activeStats = calculateLoadout(currentGear, activeWeapon, watch, specialization, context);
            const pracDpsDelta = result.practical.stats.sustainedDps - activeStats.sustainedDps;
            const pracDpsPct = (pracDpsDelta / (activeStats.sustainedDps || 1)) * 100;
            const ceilDpsDelta = result.ceiling.stats.sustainedDps - activeStats.sustainedDps;
            const ceilDpsPct = (ceilDpsDelta / (activeStats.sustainedDps || 1)) * 100;

            return (
              <div className="bg-shd-surface1 border border-shd-border2 p-3.5 clip-corner shadow-md flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shd-border3/40 pb-2">
                  <span className="text-xs font-heading font-bold text-shd-orange uppercase flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>Active Loadout vs Optimized Recommendations</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleCompareTier('practical');
                      handleCompareTier('ceiling');
                      onSwitchToComparison?.();
                    }}
                    className="px-3 py-1 bg-shd-surface2 border border-shd-orange hover:bg-shd-orange hover:text-shd-bg text-shd-orange font-heading font-bold text-xs uppercase tracking-wider clip-corner-sm transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>⚖️ Stage Both & Open Comparison Matrix</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                  {/* Active Loadout */}
                  <div className="bg-shd-surface2 p-2.5 border border-shd-border3 clip-corner-sm">
                    <div className="text-[10px] text-shd-textMonoMuted uppercase font-bold">1. Active Baseline</div>
                    <div className="text-sm font-heading font-bold text-white mt-1">
                      {Math.round(activeStats.sustainedDps).toLocaleString()} <span className="text-[10px] text-shd-textSecondary font-mono font-normal">DPS</span>
                    </div>
                    <div className="text-[11px] text-shd-blueCore mt-0.5">
                      Armor: {(activeStats.totalArmor / 1000).toFixed(0)}k
                    </div>
                  </div>

                  {/* Practical */}
                  <div className="bg-shd-surface2 p-2.5 border border-shd-border3 clip-corner-sm">
                    <div className="text-[10px] text-shd-orange uppercase font-bold">2. Practical Recommendation</div>
                    <div className="text-sm font-heading font-bold text-shd-orange mt-1">
                      {Math.round(result.practical.stats.sustainedDps).toLocaleString()}
                      <span className={`text-xs ml-1.5 font-mono font-bold ${pracDpsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({pracDpsDelta >= 0 ? '+' : ''}{pracDpsPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-shd-textSecondary mt-0.5">
                      Armor: {(result.practical.stats.totalArmor / 1000).toFixed(0)}k ({result.practical.stats.totalArmor - activeStats.totalArmor >= 0 ? '+' : ''}{Math.round((result.practical.stats.totalArmor - activeStats.totalArmor) / 1000)}k)
                    </div>
                  </div>

                  {/* Ceiling */}
                  <div className="bg-shd-surface2 p-2.5 border border-shd-border3 clip-corner-sm">
                    <div className="text-[10px] text-amber-400 uppercase font-bold">3. Theoretical Ceiling</div>
                    <div className="text-sm font-heading font-bold text-amber-400 mt-1">
                      {Math.round(result.ceiling.stats.sustainedDps).toLocaleString()}
                      <span className={`text-xs ml-1.5 font-mono font-bold ${ceilDpsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({ceilDpsDelta >= 0 ? '+' : ''}{ceilDpsPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-shd-textSecondary mt-0.5">
                      Armor: {(result.ceiling.stats.totalArmor / 1000).toFixed(0)}k ({result.ceiling.stats.totalArmor - activeStats.totalArmor >= 0 ? '+' : ''}{Math.round((result.ceiling.stats.totalArmor - activeStats.totalArmor) / 1000)}k)
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Dual-Column Layout: PRACTICAL vs CEILING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column 1: PRACTICAL (Tier 1) */}
            <TierColumn
              title="PRACTICAL"
              subtitle="Realistic drop rolls · Strict single recalibration committed per piece"
              tag="TIER 1"
              stats={result.practical.stats}
              score={result.practical.score}
              shoppingList={result.practical.shoppingList}
              weapons={result.practical.weapons}
              runnerUp={result.practical.runnerUp}
              onEquip={() => handleEquipTier('practical')}
              onCompare={() => handleCompareTier('practical')}
              archetype={result.archetype}
            />

            {/* Column 2: CEILING (Tier 2) */}
            <TierColumn
              title="CEILING"
              subtitle="Max rolls · Minors allocated ideally · Core recalibration freed"
              tag="TIER 2"
              stats={result.ceiling.stats}
              score={result.ceiling.score}
              shoppingList={result.ceiling.shoppingList}
              weapons={result.ceiling.weapons}
              runnerUp={result.ceiling.runnerUp}
              onEquip={() => handleEquipTier('ceiling')}
              onCompare={() => handleCompareTier('ceiling')}
              archetype={result.archetype}
              isCeiling
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface TierColumnProps {
  title: string;
  subtitle: string;
  tag: string;
  stats: any;
  score: number;
  shoppingList: ShoppingListItem[];
  weapons: WeaponShoppingItem[];
  runnerUp?: { name: string; score: number; scoreDeltaPct: number };
  onEquip: () => void;
  onCompare: () => void;
  archetype: ArchetypeDefinition;
  isCeiling?: boolean;
}

const TierColumn: React.FC<TierColumnProps> = ({
  title,
  subtitle,
  tag,
  stats,
  shoppingList,
  weapons,
  runnerUp,
  onEquip,
  onCompare,
  isCeiling
}) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(true);

  return (
    <div className={`bg-shd-surface1 border ${isCeiling ? 'border-shd-orange/50' : 'border-shd-border1'} p-4 clip-corner shadow-lg flex flex-col gap-4`}>
      {/* Column Header */}
      <div className="flex flex-col gap-2 border-b border-shd-border2 pb-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-heading font-bold px-1.5 py-0.5 uppercase clip-corner-sm ${
                isCeiling ? 'bg-shd-orange text-shd-bg' : 'bg-shd-surface2 text-shd-textSecondary border border-shd-border3'
              }`}>
                {tag}
              </span>
              <h3 className="font-heading font-bold text-base text-shd-textPrimary uppercase tracking-wider">
                {title}
              </h3>
              {stats.confidenceFlags && stats.confidenceFlags.map((flag: string) => (
                <ConfidenceBadge key={flag} tag={flag} />
              ))}
            </div>
            <p className="text-[11px] font-mono text-shd-textMonoMuted mt-0.5">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCompare}
              className="px-3 py-1.5 text-xs font-heading font-semibold bg-shd-surface2 border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white clip-corner-sm transition-colors focus-visible:ring-2 focus-visible:ring-shd-orange outline-none"
            >
              + Compare
            </button>
            <button
              onClick={onEquip}
              className={`px-4 py-1.5 text-xs font-heading font-bold clip-corner-sm transition-colors focus-visible:ring-2 focus-visible:ring-shd-orange outline-none ${
                isCeiling
                  ? 'bg-shd-orange text-shd-bg hover:bg-shd-orangeLight'
                  : 'bg-shd-surface2 text-shd-textPrimary border border-shd-border3 hover:border-shd-orange'
              }`}
            >
              Equip
            </button>
          </div>
        </div>

        {/* Runner-up Candidate Margin (if present) */}
        {runnerUp && (
          <div className="text-[11px] font-mono text-shd-textSecondary flex items-center gap-1.5 pt-1 border-t border-shd-border3/40">
            <span className="text-shd-textMonoMuted">Runner-up:</span>
            <span className="text-white font-medium">{runnerUp.name}</span>
            <span className="text-amber-400 font-semibold">(-{runnerUp.scoreDeltaPct.toFixed(1)}% vs Winner)</span>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-4 gap-2 bg-shd-surface2 p-2.5 border border-shd-border2 clip-corner-sm font-mono text-xs text-center">
        <div>
          <div className="text-[9px] text-shd-textMonoMuted uppercase">Armour</div>
          <div className="font-bold text-shd-blueCore text-sm">{Math.round(stats.totalArmor / 1000)}k</div>
        </div>
        <div>
          <div className="text-[9px] text-shd-textMonoMuted uppercase">Skill Tier</div>
          <div className="font-bold text-shd-yellowCore text-sm">{stats.skillTier}</div>
        </div>
        <div>
          <div className="text-[9px] text-shd-textMonoMuted uppercase">Sustain DPS</div>
          <div className="font-bold text-shd-orange text-sm">{Math.round(stats.sustainedDps / 1000)}k</div>
        </div>
        <div>
          <div className="text-[9px] text-shd-textMonoMuted uppercase">Repair / Status</div>
          <div className="font-bold text-emerald-400 text-sm">
            +{Math.round((stats.groupBreakdown?.skillRepairSum || stats.groupBreakdown?.statusEffectsSum || 0) * 100)}%
          </div>
        </div>
      </div>

      {/* Multiplier-Group Breakdown (Criterion 7) */}
      <div className="bg-shd-surface2 p-3 border border-shd-border2 clip-corner-sm flex flex-col gap-2 font-mono text-xs">
        <button
          onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
          className="flex items-center justify-between text-shd-textSecondary hover:text-white transition-colors text-left focus-visible:ring-2 focus-visible:ring-shd-orange outline-none"
        >
          <span className="text-[11px] font-heading font-bold uppercase text-shd-orange tracking-wider flex items-center gap-1.5">
            <span aria-hidden="true">📊</span>
            <span>MULTIPLIER GROUP BREAKDOWN</span>
            <span className="text-[9px] font-normal text-shd-textMonoMuted">(Additive vs Multiplicative Math)</span>
          </span>
          <span className="text-shd-textMonoMuted text-xs" aria-hidden="true">{isBreakdownOpen ? '▲' : '▼'}</span>
        </button>

        {isBreakdownOpen && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-shd-border3/60">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-shd-textMonoMuted block">Weapon Dmg Sum:</span>
                <span className="text-shd-redCore font-bold">+{Math.round((stats.groupBreakdown?.weaponDamageSum || 0) * 100)}%</span>
              </div>
              <div>
                <span className="text-shd-textMonoMuted block">Total Weapon Dmg:</span>
                <span className="text-amber-300 font-bold">+{Math.round((stats.groupBreakdown?.totalWeaponDamageSum || 0) * 100)}%</span>
              </div>
              <div>
                <span className="text-shd-textMonoMuted block">Crit Chance / Dmg:</span>
                <span className="text-shd-textPrimary font-bold">
                  {Math.round(stats.critChance * 100)}%{stats.critChance >= 0.60 ? ' [CAP]' : ''} / +{Math.round(stats.critDamage * 100)}%
                </span>
              </div>
              <div>
                <span className="text-shd-textMonoMuted block">Headshot Dmg:</span>
                <span className="text-shd-textPrimary font-bold">+{Math.round(stats.headshotDamage * 100)}%</span>
              </div>
              <div>
                <span className="text-shd-textMonoMuted block">Skill Dmg / Tier:</span>
                <span className="text-shd-yellowCore font-bold">+{Math.round((stats.groupBreakdown?.skillDamageSum || 0) * 100)}% (ST{stats.skillTier})</span>
              </div>
              <div>
                <span className="text-shd-textMonoMuted block">DtOOC / DtA:</span>
                <span className="text-emerald-400 font-bold">
                  +{Math.round(((stats.multipliers?.dtOOC || 1.0) - 1.0) * 100)}% / +{Math.round(((stats.multipliers?.dta || 1.0) - 1.0) * 100)}%
                </span>
              </div>
            </div>

            {/* Amplifiers (Separate Multiplicative Terms) */}
            {stats.independentAmplifiers && stats.independentAmplifiers.length > 0 && (
              <div className="pt-1.5 border-t border-shd-border3/40">
                <span className="text-[10px] uppercase font-bold text-amber-300 block mb-1">
                  Multiplicative Amplifiers (Independent Terms):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.independentAmplifiers.map((amp: any, ai: number) => (
                    <span
                      key={ai}
                      className="text-[10px] px-2 py-0.5 bg-shd-surface1 border border-amber-500/40 text-amber-200 clip-corner-sm"
                    >
                      ×(1 + {Math.round(amp.value * 100)}%) <span className="text-shd-textMonoMuted font-normal">{amp.source}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Brand & Gear Set Bonuses */}
            {((stats.activeSetBonuses && stats.activeSetBonuses.length > 0) || (stats.activeBrandBonuses && stats.activeBrandBonuses.length > 0)) && (
              <div className="pt-1.5 border-t border-shd-border3/40">
                <span className="text-[10px] uppercase font-bold text-shd-textSecondary block mb-1">
                  Active Set & Brand Thresholds:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.activeSetBonuses?.map((sb: any, sbi: number) => (
                    <span key={sbi} className="text-[10px] px-1.5 py-0.5 bg-shd-surface1 border border-teal-500/40 text-teal-300 clip-corner-sm">
                      {sb.name} ({sb.count}pc: {sb.activeTalents?.join(', ') || 'Active'})
                    </span>
                  ))}
                  {stats.activeBrandBonuses?.map((bb: any, bbi: number) => (
                    <span key={bbi} className="text-[10px] px-1.5 py-0.5 bg-shd-surface1 border border-shd-border3 text-shd-textSecondary clip-corner-sm">
                      {bb.brandName} ({bb.count}pc)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* In-Game Mismatch Notes & Traps Warnings */}
            {stats.warnings && stats.warnings.length > 0 && (
              <div className="pt-1.5 flex flex-col gap-1 border-t border-shd-border3/40">
                {stats.warnings.map((w: string, wi: number) => (
                  <div key={wi} className="text-[10px] text-amber-300 flex items-start gap-1">
                    <span aria-hidden="true">⚠️</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weapons Shopping List (3 Slots) */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[11px] font-heading font-bold uppercase tracking-wider text-shd-orange flex items-center justify-between border-b border-shd-border3 pb-1">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">🔫</span>
            <span>WEAPONS (3 SLOTS)</span>
          </span>
          <span className="text-[10px] font-mono text-shd-textMonoMuted font-normal">Primary · Secondary · Sidearm</span>
        </h4>

        {weapons.map((w) => (
          <div
            key={w.slot}
            className="bg-shd-surface2/80 border border-shd-border2 p-2.5 clip-corner-sm flex flex-col gap-1.5 font-mono text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-bold text-shd-orange px-1.5 py-0.2 bg-shd-orange/10 clip-corner-sm">
                  {w.slot}
                </span>
                <span className="font-bold text-shd-textPrimary">{w.name}</span>
                <span className="text-[10px] text-shd-textMonoMuted">({w.category})</span>
              </div>
              <span className="text-[10px] text-shd-textMonoMuted">{w.source}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-shd-textSecondary">
              <span className="text-shd-redCore font-medium">Core: {w.coreAttribute}</span>
              <span className="text-shd-textPrimary">3rd Minor: <span className="text-emerald-400 font-semibold">{w.minorAttribute}</span></span>
              <span className="text-amber-300 font-medium">Talent: {w.talent}</span>
            </div>

            <div className="bg-shd-surface1 p-1.5 border border-shd-border3/60 clip-corner-sm text-[11px] text-shd-textPrimary flex items-start gap-1.5">
              <span className="text-shd-orange font-bold">RECAL:</span>
              <span className="text-white font-medium">{w.recalibrationInstruction}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Armour Shopping List (6 Slots) */}
      <div className="flex flex-col gap-2">
        <h4 className="text-[11px] font-heading font-bold uppercase tracking-wider text-shd-textSecondary flex items-center justify-between border-b border-shd-border3 pb-1">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">🛡️</span>
            <span>ARMOUR GEAR (6 SLOTS)</span>
          </span>
          <span className="text-[10px] font-mono text-shd-textMonoMuted font-normal">Mask · BP · Chest · Gloves · Holster · Knees</span>
        </h4>

        {shoppingList.map((item) => {
          return (
            <div
              key={item.slot}
              className="bg-shd-surface2/70 border border-shd-border2 p-2.5 clip-corner-sm flex flex-col gap-1.5 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold text-shd-orange px-1.5 py-0.2 bg-shd-orange/10 clip-corner-sm">
                    {item.slot}
                  </span>
                  <span className="font-bold text-shd-textPrimary">{item.itemName}</span>
                </div>
                <span className="text-[10px] text-shd-textMonoMuted">{item.source}</span>
              </div>

              {/* Core & Minors */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-shd-textSecondary">
                <span className={`font-semibold ${
                  item.coreType === 'Armor' ? 'text-shd-blueCore' : (item.coreType === 'Skill Tier' ? 'text-shd-yellowCore' : 'text-shd-redCore')
                }`}>
                  Core: {item.coreType} {item.isCoreRecalibrated ? '(Recalibrated)' : '(Natural)'}
                </span>

                {item.minors.map((m, idx) => (
                  <span key={idx} className="text-shd-textPrimary">
                    {m.attribute}: <span className="font-bold text-shd-orange">{m.valueFormatted}</span> {m.isLocked ? <span aria-hidden="true">🔒</span> : ''}
                  </span>
                ))}

                {item.mod && (
                  <span className="text-sky-300">
                    Mod: {item.mod.attribute} ({item.mod.valueFormatted})
                  </span>
                )}

                {item.talent && (
                  <span className="text-amber-300">
                    Talent: {item.talent.name} {item.talent.isLocked ? <span aria-hidden="true">🔒</span> : ''}
                  </span>
                )}
              </div>

              {/* Actionable Recalibration Decision */}
              <div className="bg-shd-surface1 p-1.5 border border-shd-border3/60 clip-corner-sm text-[11px] text-shd-textPrimary flex items-start gap-1.5">
                <span className="text-shd-orange font-bold">RECAL:</span>
                <span className="text-white font-medium">{item.recalibrationInstruction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
