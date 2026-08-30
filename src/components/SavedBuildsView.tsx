import React, { useState, useEffect } from 'react';
import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext } from '../lib/calc/types';
import { SavedBuild, loadLocalBuilds, saveLocalBuild, deleteLocalBuild, exportBuildToUrl, parseBuildString } from '../lib/storage/build-storage';
import { calculateLoadout } from '../lib/calc/loadout-calculator';
import { CandidateBuild } from '../lib/optimizer/types';

interface Props {
  currentGear: Record<GearSlot, GearPieceInstance>;
  activeWeapon: WeaponInstance;
  secondaryWeapon?: WeaponInstance;
  sidearm?: WeaponInstance;
  watch: WatchStats;
  specialization: string;
  context: CombatContext;
  onLoadBuild: (build: SavedBuild) => void;
  onAddToComparison?: (candidate: CandidateBuild) => void;
  onSwitchToComparison?: () => void;
}

export const SavedBuildsView: React.FC<Props> = ({
  currentGear,
  activeWeapon,
  secondaryWeapon,
  sidearm,
  watch,
  specialization,
  context,
  onLoadBuild,
  onAddToComparison,
  onSwitchToComparison
}) => {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    refreshBuilds();
  }, []);

  const refreshBuilds = () => {
    const local = loadLocalBuilds();
    setBuilds(local);
  };

  const handleSaveCurrent = () => {
    const name = saveName.trim() || `${activeWeapon.name} Custom Build`;
    const prim = activeWeapon.slot === 'primary' ? activeWeapon : (activeWeapon || secondaryWeapon);
    const newBuild: SavedBuild = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36),
      name,
      description: saveDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gear: currentGear,
      weapon: prim,
      primaryWeapon: prim,
      secondaryWeapon,
      sidearm,
      watch,
      specialization,
      context
    };

    saveLocalBuild(newBuild);
    setSaveName('');
    setSaveDesc('');
    refreshBuilds();
  };

  const handleDelete = (id: string) => {
    deleteLocalBuild(id);
    refreshBuilds();
  };

  const handleImport = () => {
    setImportError(null);
    const parsed = parseBuildString(importJson.trim());
    if (!parsed || !parsed.gear || !parsed.weapon) {
      setImportError('Invalid build JSON format.');
      return;
    }
    saveLocalBuild(parsed);
    setImportJson('');
    refreshBuilds();
  };

  const handleCopyUrl = (build: SavedBuild) => {
    const url = exportBuildToUrl(build);
    navigator.clipboard.writeText(url);
    setCopiedId(build.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadBuild = (build: SavedBuild) => {
    const blob = new Blob([JSON.stringify(build, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${build.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseBuildString(text.trim());
        if (parsed && (parsed.gear || parsed.weapon)) {
          saveLocalBuild(parsed);
          refreshBuilds();
        } else {
          setImportError('Invalid build JSON file format.');
        }
      } catch (err) {
        setImportError('Failed to parse build JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 py-2">
      {/* Save Current Build Card */}
      <div className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-shd-border2 pb-2">
          <h2 className="font-heading font-bold text-sm text-shd-textPrimary uppercase tracking-wider">
            💾 Save Current Loadout
          </h2>
          <span className="text-[10px] font-mono text-emerald-400">Browser Local Storage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g. Pestilence Red DPS Heroic"
            className="bg-shd-surface2 border border-shd-border3 p-2 text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
          />
          <input
            type="text"
            value={saveDesc}
            onChange={(e) => setSaveDesc(e.target.value)}
            placeholder="Notes (optional): 6 Red Cores, Coyote 25m+"
            className="bg-shd-surface2 border border-shd-border3 p-2 text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
          />
          <button
            onClick={handleSaveCurrent}
            className="px-4 py-2 bg-shd-orange text-shd-bg font-heading font-bold uppercase clip-corner-sm hover:bg-shd-orangeLight transition-colors"
          >
            Save Loadout
          </button>
        </div>
      </div>

      {/* Saved Builds List */}
      <div className="flex flex-col gap-3">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-shd-textPrimary">
          Saved Loadouts ({builds.length})
        </h3>

        {builds.length === 0 ? (
          <div className="bg-shd-surface1 border border-shd-border2 p-8 text-center text-shd-textSecondary font-mono text-sm clip-corner">
            No saved builds yet. Save your active loadout above or load one of the Reference Presets from the toolbar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {builds.map(build => (
              <div
                key={build.id}
                className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-md flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-shd-border2 pb-2">
                    <h4 className="font-heading font-bold text-base text-shd-textPrimary">{build.name}</h4>
                    <span className="text-[10px] font-mono text-shd-orange uppercase">{build.specialization}</span>
                  </div>

                  {build.description && (
                    <p className="text-xs font-mono text-shd-textSecondary mt-1.5">{build.description}</p>
                  )}

                  {/* Summary row */}
                  <div className="mt-2 text-xs font-mono text-shd-textMonoMuted flex flex-wrap gap-x-3 gap-y-1">
                    <span>🔫 Prim: {build.primaryWeapon?.name || build.weapon?.name}</span>
                    {build.secondaryWeapon && <span>🔫 Sec: {build.secondaryWeapon.name}</span>}
                    {build.sidearm && <span>🔫 Side: {build.sidearm.name}</span>}
                    <span>🛡️ {Object.values(build.gear || {}).map(g => g.name.split(' ')[0]).slice(0, 4).join(', ')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-shd-border2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopyUrl(build)}
                      className="text-xs font-mono px-2 py-1 bg-shd-surface2 border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white clip-corner-sm"
                    >
                      {copiedId === build.id ? '✓ Copied' : '🔗 Share URL'}
                    </button>
                    <button
                      onClick={() => handleDownloadBuild(build)}
                      className="text-xs font-mono px-2 py-1 bg-shd-surface2 border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white clip-corner-sm"
                      title="Download as JSON file"
                    >
                      ⬇ JSON
                    </button>
                    {onAddToComparison && (
                      <button
                        type="button"
                        onClick={() => {
                          const stats = calculateLoadout(
                            build.gear,
                            build.weapon,
                            build.watch || watch,
                            build.specialization || specialization,
                            build.context || context
                          );
                          onAddToComparison({
                            id: `saved-${build.id}`,
                            name: build.name,
                            gear: build.gear,
                            weapon: build.weapon,
                            score: Math.round(stats.sustainedDps),
                            stats,
                            tradeoffAnalysis: [build.description || 'Saved custom build']
                          });
                          onSwitchToComparison?.();
                        }}
                        className="text-xs font-mono px-2 py-1 bg-shd-surface2 border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-white clip-corner-sm flex items-center gap-1 shadow-sm"
                        title="Compare this saved build with active loadout side-by-side"
                      >
                        <span>⚖️ Compare</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(build.id)}
                      className="text-xs font-mono px-2 py-1 border border-shd-border3 hover:border-rose-500 text-shd-textMonoMuted hover:text-rose-400 clip-corner-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <button
                    onClick={() => onLoadBuild(build)}
                    className="px-4 py-1 text-xs font-heading font-bold bg-shd-orange text-shd-bg clip-corner-sm hover:bg-shd-orangeLight transition-colors"
                  >
                    Load into Editor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import / Export JSON Card */}
      <div className="bg-shd-surface1 border border-shd-border1 p-4 clip-corner shadow-lg flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-shd-textPrimary uppercase tracking-wider">
            📥 Import Build via JSON
          </h3>
          <label className="px-3 py-1 text-xs font-mono border border-shd-border2 hover:border-shd-orange text-shd-textSecondary hover:text-white bg-shd-surface2 clip-corner-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
            <span>⬆ Upload JSON File</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <textarea
          rows={3}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="Paste build JSON string or Markdown code block here..."
          className="w-full bg-shd-surface2 border border-shd-border3 p-2 text-xs font-mono text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
        />
        {importError && (
          <div className="text-xs font-mono text-rose-400">{importError}</div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={!importJson.trim()}
            className="px-4 py-1.5 text-xs font-heading font-bold bg-shd-orange text-shd-bg clip-corner-sm hover:bg-shd-orangeLight transition-colors disabled:opacity-50"
          >
            Import Pasted JSON
          </button>
        </div>
      </div>
    </div>
  );
};
