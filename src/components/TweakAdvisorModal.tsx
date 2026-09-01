import React, { useState, useMemo } from 'react';
import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext } from '../lib/calc/types';
import { generateLoadoutTweaks, generateTweakPackages, TweakSuggestion, TweakPackage } from '../lib/optimizer/tweak-engine';
import { CandidateBuild } from '../lib/optimizer/types';

interface Props {
  isOpen: boolean;
  gear: Record<GearSlot, GearPieceInstance>;
  weapon: WeaponInstance;
  secondaryWeapon?: WeaponInstance;
  sidearm?: WeaponInstance;
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
  secondaryWeapon,
  sidearm,
  watch,
  specialization,
  context,
  onClose,
  onApplyTweak,
  onAddToComparison
}) => {
  const [viewMode, setViewMode] = useState<'individual' | 'packages'>('packages');
  const [filter, setFilter] = useState<'all' | 'dps' | 'survivability' | 'cap-fix' | 'combo'>('all');
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  const tweaks = useMemo(() => {
    if (!isOpen) return [];
    return generateLoadoutTweaks(gear, weapon, watch, specialization, context);
  }, [isOpen, gear, weapon, watch, specialization, context]);

  const packages = useMemo(() => {
    if (!isOpen || tweaks.length === 0) return [];
    return generateTweakPackages(gear, weapon, tweaks, watch, specialization, context);
  }, [isOpen, tweaks, gear, weapon, watch, specialization, context]);

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

  const handleApplyPackage = (pkg: TweakPackage) => {
    onApplyTweak(pkg.mergedGear, pkg.mergedWeapon, pkg.goalLabel);
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

  const handleComparePackage = (pkg: TweakPackage) => {
    if (onAddToComparison) {
      onAddToComparison({
        id: `pkg-${pkg.id}-${Date.now()}`,
        name: pkg.goalLabel,
        gear: pkg.mergedGear,
        weapon: pkg.mergedWeapon || weapon,
        score: Math.round(pkg.deltaSustainedDps),
        stats: {} as any,
        tradeoffAnalysis: [
          pkg.description,
          `Includes: ${pkg.includedTweaks.map(t => t.title).join(' + ')}`
        ]
      });
    }
  };

  const renderDeltaBadge = (dpsPct: number, dps: number, armor: number) => {
    const dpsColor = dpsPct > 0 ? 'text-emerald-400 font-bold' : (dpsPct < 0 ? 'text-rose-400' : 'text-shd-textSecondary');
    const armorColor = armor > 0 ? 'text-shd-blueCore font-bold' : (armor < 0 ? 'text-rose-400' : 'text-shd-textSecondary');
    return (
      <div className="flex items-center gap-3 text-xs font-mono">
        <div>
          <span className="text-shd-textMonoMuted text-[10px] uppercase mr-1">DPS:</span>
          <span className={dpsColor}>
            {dpsPct >= 0 ? '+' : ''}{dpsPct.toFixed(1)}%
            <span className="text-[10px] opacity-80 font-normal ml-1">
              ({dps >= 0 ? '+' : ''}{Math.round(dps / 1000)}k)
            </span>
          </span>
        </div>
        <div>
          <span className="text-shd-textMonoMuted text-[10px] uppercase mr-1">Armor:</span>
          <span className={armorColor}>
            {armor >= 0 ? '+' : ''}{Math.round(armor / 1000)}k
          </span>
        </div>
      </div>
    );
  };

  /** Render a weapon change pill showing what changed */
  const renderWeaponChange = (modifiedWeapon?: WeaponInstance) => {
    if (!modifiedWeapon) return null;
    const talentChanged = modifiedWeapon.talent !== weapon.talent;
    const minorChanged = modifiedWeapon.minorAttribute?.attribute !== weapon.minorAttribute?.attribute;
    const nameChanged = modifiedWeapon.name !== weapon.name;

    return (
      <div className="bg-shd-surface1 border border-amber-500/30 p-2 clip-corner-sm text-xs font-mono mt-1">
        <span className="text-amber-400 font-heading font-bold text-[10px] uppercase mr-1.5">🔫 Weapon:</span>
        {nameChanged ? (
          <span className="text-shd-textPrimary">
            <span className="text-rose-400 line-through opacity-70">{weapon.name}</span>
            <span className="text-shd-textMonoMuted mx-1">→</span>
            <span className="text-emerald-400">{modifiedWeapon.name}</span>
          </span>
        ) : (
          <span className="text-shd-textSecondary">{weapon.name}</span>
        )}
        {talentChanged && (
          <span className="ml-2">
            <span className="text-shd-textMonoMuted">Talent: </span>
            <span className="text-rose-400 line-through opacity-70">{weapon.talent}</span>
            <span className="text-shd-textMonoMuted mx-1">→</span>
            <span className="text-emerald-400">{modifiedWeapon.talent}</span>
          </span>
        )}
        {minorChanged && (
          <span className="ml-2">
            <span className="text-shd-textMonoMuted">3rd: </span>
            <span className="text-rose-400 line-through opacity-70">{weapon.minorAttribute?.attribute || '—'}</span>
            <span className="text-shd-textMonoMuted mx-1">→</span>
            <span className="text-emerald-400">{modifiedWeapon.minorAttribute?.attribute}</span>
          </span>
        )}
      </div>
    );
  };

  /** Render count of weapon changes in a package */
  const countWeaponChangesInPackage = (pkg: TweakPackage): number => {
    return pkg.includedTweaks.filter(t => !!t.modifiedWeapon).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-shd-surface1 border border-shd-border1 max-w-4xl w-full p-5 clip-corner shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shd-border2 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-shd-orange font-heading font-bold text-lg flex items-center gap-1.5">
                <span>⚡</span>
                <span>LOADOUT OPTIMISER</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-shd-surface2 border border-shd-border3 text-shd-textSecondary clip-corner-sm">
                Gear & Weapon Micro-Tuning
              </span>
            </div>
            <p className="text-xs font-mono text-shd-textSecondary mt-0.5">
              Analyses gear attributes, talents, weapon rolls and weapon talents to find improvements.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-shd-textMonoMuted hover:text-white font-mono text-base p-1"
          >
            ✕
          </button>
        </div>

        {/* Equipped Weapons Summary Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-shd-surface2 border border-shd-border3/60 p-2.5 clip-corner-sm text-[11px] font-mono">
          <span className="text-shd-textMonoMuted uppercase font-heading font-bold text-[10px]">Weapons:</span>
          <span className="text-shd-textPrimary">
            🔫 <span className="text-shd-orange">{weapon.name}</span>
            <span className="text-shd-textMonoMuted ml-1">({weapon.talent || '—'})</span>
            {weapon.minorAttribute && <span className="text-shd-textMonoMuted ml-1">• {weapon.minorAttribute.attribute}</span>}
          </span>
          {secondaryWeapon && (
            <span className="text-shd-textSecondary border-l border-shd-border3 pl-3">
              🔫 {secondaryWeapon.name}
              <span className="text-shd-textMonoMuted ml-1">({secondaryWeapon.talent || '—'})</span>
            </span>
          )}
          {sidearm && (
            <span className="text-shd-textSecondary border-l border-shd-border3 pl-3">
              🔫 {sidearm.name}
              <span className="text-shd-textMonoMuted ml-1">({sidearm.talent || '—'})</span>
            </span>
          )}
        </div>

        {/* Top-Level View Toggle: Packages / Individual */}
        <div className="flex items-center gap-2 border-b border-shd-border3/60 pb-2.5">
          <button
            onClick={() => setViewMode('packages')}
            className={`px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider clip-corner-sm transition-colors ${
              viewMode === 'packages'
                ? 'bg-shd-orange text-shd-bg'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            📦 Packages ({packages.length})
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider clip-corner-sm transition-colors ${
              viewMode === 'individual'
                ? 'bg-shd-orange text-shd-bg'
                : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
            }`}
          >
            🔧 Individual ({tweaks.length})
          </button>
        </div>

        {/* ═══════ PACKAGES VIEW ═══════ */}
        {viewMode === 'packages' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {packages.length === 0 ? (
              <div className="bg-shd-surface2 border border-shd-border2 p-8 text-center text-shd-textSecondary font-mono text-sm clip-corner">
                ✓ No grouped packages available — your build is already well-optimised, or individual tweaks don't combine without conflicts.
              </div>
            ) : (
              packages.map(pkg => {
                const isExpanded = expandedPkg === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className="bg-shd-surface2 border border-shd-border2 hover:border-shd-orange/60 clip-corner-sm flex flex-col transition-all shadow-lg"
                  >
                    {/* Package Header */}
                    <div className="p-4 flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shd-border3/40 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-heading font-bold px-2 py-0.5 uppercase clip-corner-sm ${
                            pkg.badgeColor === 'orange' ? 'bg-shd-orange text-shd-bg' :
                            pkg.badgeColor === 'blue' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                            pkg.badgeColor === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {pkg.goalIcon} {pkg.goalLabel}
                          </span>
                          <span className="text-[10px] font-mono text-shd-textMonoMuted">
                            {pkg.includedTweaks.length} changes combined
                            {countWeaponChangesInPackage(pkg) > 0 && (
                              <span className="text-amber-400 ml-1.5">
                                (incl. {countWeaponChangesInPackage(pkg)} weapon {countWeaponChangesInPackage(pkg) === 1 ? 'change' : 'changes'})
                              </span>
                            )}
                          </span>
                        </div>
                        {renderDeltaBadge(pkg.deltaSustainedDpsPct, pkg.deltaSustainedDps, pkg.deltaArmor)}
                      </div>

                      <p className="text-xs font-sans text-shd-textSecondary leading-relaxed">
                        {pkg.description}
                      </p>

                      {/* Package weapon change summary */}
                      {pkg.mergedWeapon && renderWeaponChange(pkg.mergedWeapon)}

                      {/* Expand/Collapse to see individual tweaks */}
                      <button
                        type="button"
                        onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                        className="text-left text-[11px] font-mono text-shd-orange hover:text-shd-orangeLight transition-colors flex items-center gap-1"
                      >
                        <span>{isExpanded ? '▾' : '▸'}</span>
                        <span>{isExpanded ? 'Hide' : 'Show'} included changes ({pkg.includedTweaks.length})</span>
                      </button>

                      {/* Expanded: Itemised list */}
                      {isExpanded && (
                        <div className="mt-1 space-y-1.5 border-l-2 border-shd-orange/40 pl-3">
                          {pkg.includedTweaks.map((t, idx) => (
                            <div key={t.id} className="bg-shd-surface1 border border-shd-border3/60 p-2.5 clip-corner-sm">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-shd-orange font-heading font-bold text-[10px]">{idx + 1}.</span>
                                  <span className="text-xs font-heading font-bold text-shd-textPrimary">{t.title}</span>
                                  {t.modifiedWeapon && <span className="text-amber-400 text-[9px] font-mono px-1 py-0.5 bg-amber-500/10 border border-amber-500/30 clip-corner-sm">🔫 WEAPON</span>}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono">
                                  <span className={t.deltaSustainedDpsPct > 0 ? 'text-emerald-400' : (t.deltaSustainedDpsPct < 0 ? 'text-rose-400' : 'text-shd-textMonoMuted')}>
                                    DPS: {t.deltaSustainedDpsPct >= 0 ? '+' : ''}{t.deltaSustainedDpsPct.toFixed(1)}%
                                  </span>
                                  <span className={t.deltaArmor > 0 ? 'text-shd-blueCore' : (t.deltaArmor < 0 ? 'text-rose-400' : 'text-shd-textMonoMuted')}>
                                    Armor: {t.deltaArmor >= 0 ? '+' : ''}{Math.round(t.deltaArmor / 1000)}k
                                  </span>
                                </div>
                              </div>
                              <p className="text-[10px] font-mono text-shd-textMonoMuted mt-1 whitespace-pre-line">{t.actionText}</p>
                              {t.modifiedWeapon && renderWeaponChange(t.modifiedWeapon)}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Package Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-shd-border3/40">
                        {onAddToComparison && (
                          <button
                            type="button"
                            onClick={() => handleComparePackage(pkg)}
                            className="px-3 py-1 text-xs font-mono border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white bg-shd-surface1 clip-corner-sm transition-colors"
                          >
                            + Compare Package
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleApplyPackage(pkg)}
                          className="px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider bg-shd-orange hover:bg-shd-orangeLight text-shd-bg clip-corner-sm transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>⚡ Apply All {pkg.includedTweaks.length} Changes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══════ INDIVIDUAL VIEW ═══════ */}
        {viewMode === 'individual' && (
          <>
            {/* Filter Navigation */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-shd-border3/60 pb-2.5 text-xs font-mono -mt-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 clip-corner-sm transition-colors ${
                  filter === 'all'
                    ? 'bg-shd-orange text-shd-bg font-bold'
                    : 'bg-shd-surface2 text-shd-textSecondary hover:text-white border border-shd-border3'
                }`}
              >
                All Optimisations ({tweaks.length})
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
                filteredTweaks.map(tweak => (
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
                      {renderDeltaBadge(tweak.deltaSustainedDpsPct, tweak.deltaSustainedDps, tweak.deltaArmor)}
                    </div>

                    {/* Action Steps */}
                    <div className="bg-shd-surface1 p-2.5 border border-shd-border3/60 clip-corner-sm text-xs font-mono text-shd-textPrimary">
                      <span className="text-shd-orange font-bold font-heading mr-1.5 uppercase">Action:</span>
                      <span className="whitespace-pre-line">{tweak.actionText}</span>
                    </div>

                    {/* Weapon Change Detail */}
                    {tweak.modifiedWeapon && renderWeaponChange(tweak.modifiedWeapon)}

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
                        className="px-4 py-1.5 text-xs font-heading font-bold uppercase tracking-wider bg-shd-orange hover:bg-shd-orangeLight text-shd-bg clip-corner-sm transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>⚡ Apply Optimisation</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-shd-border2 text-[11px] font-mono text-shd-textMonoMuted">
          <span>
            {viewMode === 'packages'
              ? 'Packages combine non-conflicting tweaks and apply them all at once.'
              : 'Clicking "Apply Optimisation" updates your active loadout and recalculates all damage numbers.'}
          </span>
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
