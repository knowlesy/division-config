import React, { useState, useMemo } from 'react';
import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext } from '../lib/calc/types';
import { generateLoadoutTweaks, TweakSuggestion } from '../lib/optimizer/tweak-engine';
import { CandidateBuild } from '../lib/optimizer/types';

interface Props {
  isOpen: boolean;
  gear: Record<GearSlot, GearPieceInstance>;
  weapon: WeaponInstance;
  watch: WatchStats;
  specialization: string;
  context: CombatContext;
  onClose: () => void;
  onApplyTweak: (modifiedGear: Record<GearSlot, GearPieceInstance>, modifiedWeapon?: WeaponInstance, title?: string) => void;
  onAddToComparison?: (candidate: CandidateBuild) => void;
}

export const TweakAdvisorModal: React.FC<Props> = ({
  isOpen,
  gear,
  weapon,
  watch,
  specialization,
  context,
  onClose,
  onApplyTweak,
  onAddToComparison
}) => {
  const [filter, setFilter] = useState<'all' | 'dps' | 'survivability' | 'cap-fix' | 'combo'>('all');

  const tweaks = useMemo(() => {
    if (!isOpen) return [];
    return generateLoadoutTweaks(gear, weapon, watch, specialization, context);
  }, [isOpen, gear, weapon, watch, specialization, context]);

  if (!isOpen) return null;

  const filteredTweaks = tweaks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'dps') return t.category === 'dps' || (t.deltaSustainedDpsPct > 0 && t.category !== 'cap-fix');
    if (filter === 'survivability') return t.category === 'survivability' || t.deltaArmor > 0;
    if (filter === 'cap-fix') return t.category === 'cap-fix';
    if (filter === 'combo') return t.category === 'combo';
    return true;
  });

  const handleApply = (tweak: TweakSuggestion) => {
    onApplyTweak(tweak.modifiedGear, tweak.modifiedWeapon, tweak.title);
    onClose();
  };

  const handleCompare = (tweak: TweakSuggestion) => {
    if (onAddToComparison) {
      onAddToComparison({
        id: `tweak-${tweak.id}-${Date.now()}`,
        name: tweak.title,
        gear: tweak.modifiedGear,
        weapon: tweak.modifiedWeapon || weapon,
        score: Math.round(tweak.deltaSustainedDps),
        stats: {} as any,
        tradeoffAnalysis: [tweak.actionText, tweak.whyExplanation]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-shd-surface1 border border-shd-border1 max-w-4xl w-full p-5 clip-corner shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shd-border2 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-shd-orange font-heading font-bold text-lg flex items-center gap-1.5">
                <span>💡</span>
                <span>TWEAK MY LOADOUT</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-shd-surface2 border border-shd-border3 text-shd-textSecondary clip-corner-sm">
                Incremental Multiplier Tuning
              </span>
            </div>
            <p className="text-xs font-mono text-shd-textSecondary mt-0.5">
              Live mathematical analysis of 1-step and 2-step micro-changes to boost your active build's DPS or survivability.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-shd-textMonoMuted hover:text-white font-mono text-base p-1"
          >
            ✕
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-shd-border3/60 pb-2.5 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 clip-corner-sm transition-colors ${
              filter === 'all'
                ? 'bg-shd-orange text-shd-bg font-bold'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            All Suggestions ({tweaks.length})
          </button>
          <button
            onClick={() => setFilter('dps')}
            className={`px-3 py-1 clip-corner-sm transition-colors ${
              filter === 'dps'
                ? 'bg-shd-orange text-shd-bg font-bold'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            ⚡ DPS Upgrades ({tweaks.filter(t => t.category === 'dps' || t.deltaSustainedDpsPct > 0).length})
          </button>
          <button
            onClick={() => setFilter('survivability')}
            className={`px-3 py-1 clip-corner-sm transition-colors ${
              filter === 'survivability'
                ? 'bg-shd-orange text-shd-bg font-bold'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            🛡️ Armor & Survival ({tweaks.filter(t => t.category === 'survivability' || t.deltaArmor > 0).length})
          </button>
          <button
            onClick={() => setFilter('cap-fix')}
            className={`px-3 py-1 clip-corner-sm transition-colors ${
              filter === 'cap-fix'
                ? 'bg-shd-orange text-shd-bg font-bold'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            🎯 Stat Cap Fixes ({tweaks.filter(t => t.category === 'cap-fix').length})
          </button>
          <button
            onClick={() => setFilter('combo')}
            className={`px-3 py-1 clip-corner-sm transition-colors ${
              filter === 'combo'
                ? 'bg-shd-orange text-shd-bg font-bold'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            🔥 2-Step Combos ({tweaks.filter(t => t.category === 'combo').length})
          </button>
        </div>

        {/* Suggestion Cards Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {filteredTweaks.length === 0 ? (
            <div className="bg-shd-surface2 border border-shd-border2 p-8 text-center text-shd-textSecondary font-mono text-sm clip-corner">
              ✓ No tweaks found in this category. Your current active configuration is well-tuned!
            </div>
          ) : (
            filteredTweaks.map(tweak => {
              const dpsColor = tweak.deltaSustainedDpsPct > 0 ? 'text-emerald-400 font-bold' : (tweak.deltaSustainedDpsPct < 0 ? 'text-rose-400' : 'text-shd-textSecondary');
              const armorColor = tweak.deltaArmor > 0 ? 'text-shd-blueCore font-bold' : (tweak.deltaArmor < 0 ? 'text-rose-400' : 'text-shd-textSecondary');

              return (
                <div
                  key={tweak.id}
                  className="bg-shd-surface2 border border-shd-border2 hover:border-shd-orange/60 p-4 clip-corner-sm flex flex-col gap-2.5 transition-all shadow-md"
                >
                  {/* Card Top: Category Badge & Title */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shd-border3/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-heading font-bold px-2 py-0.5 uppercase clip-corner-sm ${
                        tweak.badgeColor === 'orange' ? 'bg-shd-orange text-shd-bg' :
                        tweak.badgeColor === 'blue' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                        tweak.badgeColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        tweak.badgeColor === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {tweak.categoryLabel}
                      </span>
                      <h4 className="font-heading font-bold text-sm text-shd-textPrimary">
                        {tweak.title}
                      </h4>
                    </div>

                    {/* Delta Numbers */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div>
                        <span className="text-shd-textMonoMuted text-[10px] uppercase mr-1">DPS:</span>
                        <span className={dpsColor}>
                          {tweak.deltaSustainedDpsPct >= 0 ? '+' : ''}{tweak.deltaSustainedDpsPct.toFixed(1)}%
                          <span className="text-[10px] opacity-80 font-normal ml-1">
                            ({tweak.deltaSustainedDps >= 0 ? '+' : ''}{Math.round(tweak.deltaSustainedDps / 1000)}k)
                          </span>
                        </span>
                      </div>

                      <div>
                        <span className="text-shd-textMonoMuted text-[10px] uppercase mr-1">Armor:</span>
                        <span className={armorColor}>
                          {tweak.deltaArmor >= 0 ? '+' : ''}{Math.round(tweak.deltaArmor / 1000)}k
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Steps */}
                  <div className="bg-shd-surface1 p-2.5 border border-shd-border3/60 clip-corner-sm text-xs font-mono text-shd-textPrimary">
                    <span className="text-shd-orange font-bold font-heading mr-1.5 uppercase">Action:</span>
                    <span className="whitespace-pre-line">{tweak.actionText}</span>
                  </div>

                  {/* Why Explanation */}
                  <p className="text-xs font-sans text-shd-textSecondary leading-relaxed">
                    {tweak.whyExplanation}
                  </p>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-shd-border3/40">
                    {onAddToComparison && (
                      <button
                        type="button"
                        onClick={() => handleCompare(tweak)}
                        className="px-3 py-1 text-xs font-mono border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white bg-shd-surface1 clip-corner-sm transition-colors"
                      >
                        + Compare Delta
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApply(tweak)}
                      className="px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider bg-shd-orange hover:bg-shd-orangeLight text-shd-bg clip-corner-sm transition-colors shadow-md flex items-center gap-1.5"
                    >
                      <span>⚡ Apply Tweak</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-shd-border2 text-[11px] font-mono text-shd-textMonoMuted">
          <span>Clicking "Apply Tweak" updates your active loadout and recalculates all damage numbers.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono border border-shd-border3 text-shd-textSecondary hover:text-white clip-corner-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
