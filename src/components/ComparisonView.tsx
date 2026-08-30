import React, { useState, useEffect } from 'react';
import { CandidateBuild } from '../lib/optimizer/types';
import { ComputedLoadoutStats, GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext, CoreType } from '../lib/calc/types';
import { loadLocalBuilds, SavedBuild } from '../lib/storage/build-storage';
import { ARCHETYPES } from '../lib/optimizer/archetypes';
import { runTwoTierOptimization } from '../lib/optimizer/engine';
import { calculateLoadout } from '../lib/calc/loadout-calculator';

interface Props {
  baselineStats: ComputedLoadoutStats;
  baselineName: string;
  baselineGear: Record<GearSlot, GearPieceInstance>;
  baselineWeapon: WeaponInstance;
  watch: WatchStats;
  specialization: string;
  context: CombatContext;
  comparisonBuilds: CandidateBuild[];
  onAddComparison: (candidate: CandidateBuild) => void;
  onRemoveComparison: (id: string) => void;
  onEquip: (build: CandidateBuild) => void;
  onClearAll: () => void;
}

function getCoreSplit(gear: Record<GearSlot, GearPieceInstance>): { red: number; blue: number; yellow: number } {
  let red = 0;
  let blue = 0;
  let yellow = 0;
  Object.values(gear || {}).forEach(p => {
    if (!p || !p.core) return;
    if (p.core.type === 'Weapon Damage') red++;
    else if (p.core.type === 'Armor') blue++;
    else if (p.core.type === 'Skill Tier') yellow++;
  });
  return { red, blue, yellow };
}

export const ComparisonView: React.FC<Props> = ({
  baselineStats,
  baselineName,
  baselineGear,
  baselineWeapon,
  watch,
  specialization,
  context,
  comparisonBuilds,
  onAddComparison,
  onRemoveComparison,
  onEquip,
  onClearAll
}) => {
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('');

  useEffect(() => {
    setSavedBuilds(loadLocalBuilds());
  }, []);

  const handleAddSaved = (id: string) => {
    if (!id) return;
    const b = savedBuilds.find(s => s.id === id);
    if (!b) return;

    const stats = calculateLoadout(
      b.gear,
      b.weapon,
      b.watch || watch,
      b.specialization || specialization,
      b.context || context
    );

    onAddComparison({
      id: `saved-${b.id}`,
      name: b.name,
      gear: b.gear,
      weapon: b.weapon,
      score: Math.round(stats.sustainedDps),
      stats,
      tradeoffAnalysis: [b.description || 'Saved custom build']
    });
    setSelectedSavedId('');
  };

  const handleAddArchetype = (archId: string) => {
    if (!archId) return;
    const opt = runTwoTierOptimization(baselineWeapon, {
      archetypeId: archId,
      watch,
      specialization,
      context
    });

    onAddComparison({
      id: `arch-${archId}-practical-${Date.now()}`,
      name: `${opt.archetype.name} (Practical)`,
      gear: opt.practical.gear,
      weapon: baselineWeapon,
      score: opt.practical.score,
      stats: opt.practical.stats,
      tradeoffAnalysis: [opt.gap.scoreDeltaHeadline, `Recommended Spec: ${opt.recommendedSpecialization.name}`]
    });
    setSelectedArchetypeId('');
  };

  const baselineCores = getCoreSplit(baselineGear);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 py-2">
      {/* Top Bar: Controls and Staging Dropdowns */}
      <div className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-base text-shd-textPrimary uppercase tracking-wider flex items-center gap-2">
            <span className="text-shd-orange">⚖️</span>
            <span>Side-by-Side Loadout & Delta Comparison</span>
          </h2>
          <p className="text-xs font-mono text-shd-textSecondary mt-0.5">
            Compare your active build against optimal archetypes, saved loadouts, and tweak variations.
          </p>
        </div>

        {/* Quick Add Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {savedBuilds.length > 0 && (
            <select
              value={selectedSavedId}
              onChange={(e) => handleAddSaved(e.target.value)}
              className="bg-shd-surface2 border border-shd-border3 hover:border-shd-orange px-2.5 py-1.5 text-xs font-mono text-amber-300 outline-none clip-corner-sm cursor-pointer"
            >
              <option value="">+ Add Saved Build ▾</option>
              {savedBuilds.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <select
            value={selectedArchetypeId}
            onChange={(e) => handleAddArchetype(e.target.value)}
            className="bg-shd-surface2 border border-shd-border3 hover:border-shd-orange px-2.5 py-1.5 text-xs font-mono text-shd-orange outline-none clip-corner-sm cursor-pointer"
          >
            <option value="">+ Add Optimal Archetype ▾</option>
            {Object.values(ARCHETYPES).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {comparisonBuilds.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs font-mono px-3 py-1.5 border border-shd-border3 hover:border-rose-500 text-shd-textSecondary hover:text-rose-400 clip-corner-sm transition-colors"
            >
              Clear Matrix ({comparisonBuilds.length})
            </button>
          )}
        </div>
      </div>

      {comparisonBuilds.length === 0 ? (
        <div className="max-w-4xl mx-auto py-12 text-center bg-shd-surface1 border border-shd-border1 p-8 clip-corner shadow-lg w-full">
          <div className="text-3xl text-shd-orange font-heading font-bold mb-2">⚖️ No Builds Staged</div>
          <p className="text-sm font-mono text-shd-textSecondary max-w-md mx-auto mb-6">
            Stage any of your <strong>Saved Builds</strong> or <strong>Optimal Archetypes</strong> to compare performance, core distributions, and piece-by-piece gear differences.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => handleAddArchetype('reactive_bruiser')}
              className="px-4 py-2 bg-shd-surface2 border border-shd-orange text-shd-orange hover:bg-shd-orange hover:text-shd-bg font-heading font-bold text-xs uppercase tracking-wider clip-corner-sm transition-colors shadow-sm"
            >
              + Compare vs Reactive Bruiser (Brawler)
            </button>
            <button
              type="button"
              onClick={() => handleAddArchetype('sustained_dps')}
              className="px-4 py-2 bg-shd-surface2 border border-shd-border3 hover:border-shd-orange text-white font-heading font-bold text-xs uppercase tracking-wider clip-corner-sm transition-colors shadow-sm"
            >
              + Compare vs Sustained DPS (Striker)
            </button>
          </div>
        </div>
      ) : (
        /* Comparison Grid Table */
        <div className="overflow-x-auto bg-shd-surface1 border border-shd-border1 clip-corner p-4 shadow-lg">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-shd-border2">
                <th className="p-2.5 text-shd-textMonoMuted uppercase text-[10px] w-48">Metric / Gear Slot</th>
                <th className="p-2.5 bg-shd-surface2 font-heading font-bold text-shd-orange text-sm border-l border-shd-border2 min-w-[220px]">
                  <div className="text-[10px] font-mono text-shd-textMonoMuted uppercase">Active Baseline</div>
                  <div className="text-xs font-sans text-white font-bold truncate">{baselineName}</div>
                </th>
                {comparisonBuilds.map(c => (
                  <th key={c.id} className="p-2.5 bg-shd-surface2 font-heading font-bold text-shd-textPrimary text-sm border-l border-shd-border2 min-w-[220px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-sans text-shd-orange font-bold">{c.name}</span>
                      <button
                        onClick={() => onRemoveComparison(c.id)}
                        className="text-shd-textMonoMuted hover:text-rose-400 text-xs px-1"
                        title="Remove from comparison"
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      onClick={() => onEquip(c)}
                      className="mt-1.5 w-full py-1 text-[10px] bg-shd-orange text-shd-bg font-bold clip-corner-sm hover:bg-shd-orangeLight transition-colors"
                    >
                      ⚡ Equip This Build
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-shd-border1">
              {/* SECTION: COMBAT PERFORMANCE */}
              <tr className="bg-shd-surface2/60">
                <td colSpan={comparisonBuilds.length + 2} className="p-2 text-[10px] font-heading font-bold text-shd-orange uppercase tracking-wider">
                  🔥 Combat Damage & Survivability
                </td>
              </tr>

              {/* Sustained DPS */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary font-semibold">Sustained DPS</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-shd-orange">
                  {Math.round(baselineStats.sustainedDps).toLocaleString()}
                </td>
                {comparisonBuilds.map(c => {
                  const delta = (c.stats?.sustainedDps || 0) - baselineStats.sustainedDps;
                  const pct = (delta / (baselineStats.sustainedDps || 1)) * 100;
                  return (
                    <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                      <div>{Math.round(c.stats?.sustainedDps || 0).toLocaleString()}</div>
                      <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {delta >= 0 ? '+' : ''}{pct.toFixed(1)}% ({delta >= 0 ? '+' : ''}{Math.round(delta / 1000)}k)
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Burst DPS */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary font-semibold">Burst DPS</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-white">
                  {Math.round(baselineStats.burstDps).toLocaleString()}
                </td>
                {comparisonBuilds.map(c => {
                  const delta = (c.stats?.burstDps || 0) - baselineStats.burstDps;
                  const pct = (delta / (baselineStats.burstDps || 1)) * 100;
                  return (
                    <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                      <div>{Math.round(c.stats?.burstDps || 0).toLocaleString()}</div>
                      <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {delta >= 0 ? '+' : ''}{pct.toFixed(1)}%
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
                  const delta = (c.stats?.expectedDamagePerShot || 0) - baselineStats.expectedDamagePerShot;
                  const pct = (delta / (baselineStats.expectedDamagePerShot || 1)) * 100;
                  return (
                    <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                      <div>{Math.round(c.stats?.expectedDamagePerShot || 0).toLocaleString()}</div>
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
                  const delta = (c.stats?.totalArmor || 0) - baselineStats.totalArmor;
                  return (
                    <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold">
                      <div>{((c.stats?.totalArmor || 0) / 1000).toFixed(0)}k</div>
                      <div className={`text-[10px] ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {delta >= 0 ? '+' : ''}{(delta / 1000).toFixed(0)}k
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Core Color Distribution */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Core Split</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2">
                  <span className="text-shd-redCore font-bold">{baselineCores.red}R</span> / <span className="text-shd-blueCore font-bold">{baselineCores.blue}B</span> / <span className="text-shd-yellowCore font-bold">{baselineCores.yellow}Y</span>
                </td>
                {comparisonBuilds.map(c => {
                  const split = getCoreSplit(c.gear);
                  return (
                    <td key={c.id} className="p-2.5 border-l border-shd-border2">
                      <span className="text-shd-redCore font-bold">{split.red}R</span> / <span className="text-shd-blueCore font-bold">{split.blue}B</span> / <span className="text-shd-yellowCore font-bold">{split.yellow}Y</span>
                    </td>
                  );
                })}
              </tr>

              {/* Crit Chance & Damage */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Crit Stats</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 text-shd-textSecondary">
                  {Math.round((baselineStats.groupBreakdown?.critChance || 0) * 100)}% CHC · +{Math.round((baselineStats.groupBreakdown?.critDamage || 0) * 100)}% CHD
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 text-shd-textSecondary">
                    {Math.round((c.stats?.groupBreakdown?.critChance || 0) * 100)}% CHC · +{Math.round((c.stats?.groupBreakdown?.critDamage || 0) * 100)}% CHD
                  </td>
                ))}
              </tr>

              {/* SECTION: PIECE-BY-PIECE GEAR LAYOUT */}
              <tr className="bg-shd-surface2/60">
                <td colSpan={comparisonBuilds.length + 2} className="p-2 text-[10px] font-heading font-bold text-shd-orange uppercase tracking-wider">
                  🛡️ Gear Items & Talents
                </td>
              </tr>

              {/* Primary Weapon */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Weapon</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 font-bold text-white truncate">
                  {baselineWeapon?.name || 'Primary Weapon'}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 font-bold text-white truncate">
                    {c.weapon?.name || baselineWeapon?.name || 'Primary'}
                  </td>
                ))}
              </tr>

              {/* Mask */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Mask</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 truncate">
                  {baselineGear.mask?.name || 'Empty'}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 truncate">
                    {c.gear?.mask?.name || 'Empty'}
                  </td>
                ))}
              </tr>

              {/* Chest */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Chest</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 truncate">
                  {baselineGear.chest?.name || 'Empty'}
                  {baselineGear.chest?.talent && <span className="text-shd-orange block text-[10px]">[{baselineGear.chest.talent}]</span>}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 truncate">
                    {c.gear?.chest?.name || 'Empty'}
                    {c.gear?.chest?.talent && <span className="text-shd-orange block text-[10px]">[{c.gear.chest.talent}]</span>}
                  </td>
                ))}
              </tr>

              {/* Backpack */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Backpack</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 truncate">
                  {baselineGear.backpack?.name || 'Empty'}
                  {baselineGear.backpack?.talent && <span className="text-shd-orange block text-[10px]">[{baselineGear.backpack.talent}]</span>}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 truncate">
                    {c.gear?.backpack?.name || 'Empty'}
                    {c.gear?.backpack?.talent && <span className="text-shd-orange block text-[10px]">[{c.gear.backpack.talent}]</span>}
                  </td>
                ))}
              </tr>

              {/* Gloves */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Gloves</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 truncate">
                  {baselineGear.gloves?.name || 'Empty'}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 truncate">
                    {c.gear?.gloves?.name || 'Empty'}
                  </td>
                ))}
              </tr>

              {/* Holster */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Holster</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 truncate">
                  {baselineGear.holster?.name || 'Empty'}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 truncate">
                    {c.gear?.holster?.name || 'Empty'}
                  </td>
                ))}
              </tr>

              {/* Kneepads */}
              <tr>
                <td className="p-2.5 text-shd-textSecondary">Kneepads</td>
                <td className="p-2.5 bg-shd-surface2/40 border-l border-shd-border2 truncate">
                  {baselineGear.kneepads?.name || 'Empty'}
                </td>
                {comparisonBuilds.map(c => (
                  <td key={c.id} className="p-2.5 border-l border-shd-border2 truncate">
                    {c.gear?.kneepads?.name || 'Empty'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
