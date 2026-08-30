import React, { useState, useEffect } from 'react';
import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext, ComputedLoadoutStats, CoreType } from './lib/calc/types';
import { calculateLoadout } from './lib/calc/loadout-calculator';
import { Header, ActiveTab } from './components/Header';
import { GearSlotCard } from './components/GearSlotCard';
import { WeaponSlotCard } from './components/WeaponSlotCard';
import { StatsPanel } from './components/StatsPanel';
import { CombatContextBar } from './components/CombatContextBar';
import { OptimizerView } from './components/OptimizerView';
import { ComparisonView } from './components/ComparisonView';
import { SavedBuildsView } from './components/SavedBuildsView';
import { AdvisorChat } from './components/AdvisorChat';
import { AuthModal } from './components/AuthModal';
import { AlignGearSetModal } from './components/AlignGearSetModal';
import { CandidateBuild } from './lib/optimizer/types';
import { SavedBuild, getStoredToken, importBuildFromUrl, saveLocalBuild } from './lib/storage/build-storage';
import { GitHubClient, GitHubUser } from './lib/github/client';
import gearSetsData from '../data/gear-sets.json';

// Default initial loadout: Build A (Pestilence DPS)
const INITIAL_GEAR: Record<GearSlot, GearPieceInstance> = {
  mask: {
    slot: 'mask',
    kind: 'exotic',
    name: "Coyote's Mask",
    brandOrSetId: 'coyotes-mask',
    core: { type: 'Weapon Damage', value: 0.15 },
    minors: [
      { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
      { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
    ],
    modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
  },
  backpack: {
    slot: 'backpack',
    kind: 'gear-set',
    name: 'Tipping Scales Backpack',
    brandOrSetId: 'tipping-scales',
    core: { type: 'Weapon Damage', value: 0.15 },
    minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }],
    modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
    talent: 'Snowball'
  },
  chest: {
    slot: 'chest',
    kind: 'gear-set',
    name: 'Tipping Scales Chest',
    brandOrSetId: 'tipping-scales',
    core: { type: 'Weapon Damage', value: 0.15 },
    minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }],
    modSlot: { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' },
    talent: 'Sustainability'
  },
  gloves: {
    slot: 'gloves',
    kind: 'exotic',
    name: 'Overdogs',
    brandOrSetId: 'overdogs',
    core: { type: 'Weapon Damage', value: 0.15 },
    minors: [
      { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' },
      { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }
    ]
  },
  holster: {
    slot: 'holster',
    kind: 'gear-set',
    name: 'Tipping Scales Holster',
    brandOrSetId: 'tipping-scales',
    core: { type: 'Weapon Damage', value: 0.15 },
    minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
  },
  kneepads: {
    slot: 'kneepads',
    kind: 'gear-set',
    name: 'Tipping Scales Kneepads',
    brandOrSetId: 'tipping-scales',
    core: { type: 'Weapon Damage', value: 0.15 },
    minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }]
  }
};

const INITIAL_PRIMARY_WEAPON: WeaponInstance = {
  slot: 'primary',
  name: 'Pestilence',
  category: 'LMG',
  baseDamage: 48300,
  rpm: 935,
  magSize: 100,
  reloadTime: 4.54,
  innateHsd: 0.65,
  coreAttribute: { type: 'Weapon Damage', value: 0.15 },
  secondaryCoreAttribute: { type: 'Damage to Target Out of Cover', value: 0.12 },
  minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
  talent: 'Plague of the Outcasts',
  isExotic: true
};

const INITIAL_SECONDARY_WEAPON: WeaponInstance = {
  slot: 'secondary',
  name: 'Fafnir',
  category: 'Shotgun',
  baseDamage: 115000,
  rpm: 180,
  magSize: 10,
  reloadTime: 2.8,
  innateHsd: 0.45,
  coreAttribute: { type: 'Weapon Damage', value: 0.15 },
  secondaryCoreAttribute: { type: 'Damage to Armor', value: 0.12 },
  minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
  talent: "Dragon's Breath",
  isExotic: true
};

const INITIAL_SIDEARM: WeaponInstance = {
  slot: 'sidearm',
  name: 'Kard Custom',
  category: 'Pistol',
  baseDamage: 38000,
  rpm: 310,
  magSize: 20,
  reloadTime: 1.5,
  innateHsd: 1.0,
  coreAttribute: { type: 'Weapon Damage', value: 0.15 },
  secondaryCoreAttribute: { type: 'Critical Hit Chance', value: 0.10 },
  minorAttribute: { attribute: 'Damage to Target Out of Cover', value: 0.10, unit: '%' },
  talent: 'In Sync',
  isExotic: false
};

const INITIAL_WATCH: WatchStats = {
  weaponDamage: 0.10,
  headshotDamage: 0.20,
  critChance: 0.10,
  critDamage: 0.20,
  armor: 0.10,
  health: 0.10,
  hazardProtection: 0.10,
  explosiveResistance: 0.10,
  skillDamage: 0.10,
  skillRepair: 0.10,
  skillHaste: 0.10,
  skillDuration: 0.20,
  reloadSpeed: 0.10,
  accuracy: 0.10,
  ammo: 0.20,
  stability: 0.10
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [gear, setGear] = useState<Record<GearSlot, GearPieceInstance>>(INITIAL_GEAR);
  const [primaryWeapon, setPrimaryWeapon] = useState<WeaponInstance>(INITIAL_PRIMARY_WEAPON);
  const [secondaryWeapon, setSecondaryWeapon] = useState<WeaponInstance>(INITIAL_SECONDARY_WEAPON);
  const [sidearm, setSidearm] = useState<WeaponInstance>(INITIAL_SIDEARM);
  const [activeWeaponSlot, setActiveWeaponSlot] = useState<'primary' | 'secondary' | 'sidearm'>('primary');
  const [watch, setWatch] = useState<WatchStats>(INITIAL_WATCH);
  const [specialization, setSpecialization] = useState<string>('Gunner');
  const [context, setContext] = useState<CombatContext>({
    isSolo: true,
    distanceMeters: 25,
    isEnemyOutOfCover: true,
    throttleControlStacks: 75,
    strikerStacks: 100
  });

  const [comparisonBuilds, setComparisonBuilds] = useState<CandidateBuild[]>([]);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [alignModalState, setAlignModalState] = useState<{ isOpen: boolean; initialSetId?: string }>({ isOpen: false });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active weapon for calculation
  const activeWeapon = activeWeaponSlot === 'primary' ? primaryWeapon : (activeWeaponSlot === 'secondary' ? secondaryWeapon : sidearm);

  // Recalculate stats whenever loadout or context changes
  const computedStats: ComputedLoadoutStats = calculateLoadout(
    gear,
    activeWeapon,
    watch,
    specialization,
    context
  );

  // Load URL build parameter, stored token, or OAuth code callback on mount
  useEffect(() => {
    // 1. Check for OAuth code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get('code');
    if (oauthCode) {
      const exchangeUrl = import.meta.env.VITE_TOKEN_EXCHANGE_URL || '';
      if (!exchangeUrl) return;
      fetch(exchangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: oauthCode })
      })
        .then(res => res.json())
        .then(async data => {
          if (data.access_token) {
            setToken(data.access_token);
            const { setStoredToken } = await import('./lib/storage/build-storage');
            setStoredToken(data.access_token);
            const client = new GitHubClient(data.access_token);
            const u = await client.getUser();
            await client.getOrCreateBuildsRepo(u.login);
            setUser(u);
          }
        })
        .catch(err => console.error('OAuth token exchange error:', err))
        .finally(() => {
          // Clean code from URL
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        });
    }

    const urlBuild = importBuildFromUrl();
    if (urlBuild) {
      loadSavedBuild(urlBuild);
    }

    const savedToken = getStoredToken();
    if (savedToken) {
      setToken(savedToken);
      const client = new GitHubClient(savedToken);
      client.getUser().then(u => setUser(u)).catch(() => setToken(null));
    }
  }, []);

  const loadSavedBuild = (b: SavedBuild) => {
    if (b.gear) setGear(b.gear);
    if (b.weapon) setPrimaryWeapon(b.weapon);
    if (b.secondaryWeapon) setSecondaryWeapon(b.secondaryWeapon);
    if (b.sidearm) setSidearm(b.sidearm);
    if (b.watch) setWatch(b.watch);
    if (b.specialization) setSpecialization(b.specialization);
    if (b.context) setContext(b.context);
    setActiveTab('editor');
  };

  const handleDownloadBuildJson = () => {
    const buildData: SavedBuild = {
      id: `build-${Date.now()}`,
      name: `Division-Build-${new Date().toISOString().slice(0, 10)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gear,
      weapon: primaryWeapon,
      secondaryWeapon,
      sidearm,
      watch,
      specialization,
      context
    };

    const blob = new Blob([JSON.stringify(buildData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${buildData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Build exported & downloaded as JSON file!');
  };

  const handleUploadBuildJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.gear || parsed.weapon || parsed.primaryWeapon) {
          loadSavedBuild({
            id: parsed.id || `build-${Date.now()}`,
            name: parsed.name || file.name.replace(/\.json$/i, ''),
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            gear: parsed.gear || gear,
            weapon: parsed.primaryWeapon || parsed.weapon || primaryWeapon,
            secondaryWeapon: parsed.secondaryWeapon || secondaryWeapon,
            sidearm: parsed.sidearm || sidearm,
            watch: parsed.watch || watch,
            specialization: parsed.specialization || specialization,
            context: parsed.context || context
          });
          showToast(`Successfully loaded build from ${file.name}!`);
        } else {
          alert('Invalid build JSON format.');
        }
      } catch (err) {
        console.error('Failed to parse build JSON:', err);
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveToBrowser = () => {
    const buildName = prompt('Enter a name for this build:', `Custom Build (${new Date().toLocaleDateString()})`);
    if (!buildName) return;

    const newBuild: SavedBuild = {
      id: `build-${Date.now()}`,
      name: buildName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gear,
      weapon: primaryWeapon,
      secondaryWeapon,
      sidearm,
      watch,
      specialization,
      context
    };

    saveLocalBuild(newBuild);
    showToast(`Saved "${buildName}" to local browser storage!`);
  };

  const handleAlignGearSet = (setId: string, mode: '4pc' | '6pc') => {
    const set = (gearSetsData as any[]).find(s => s.id === setId) || (gearSetsData as any[])[0];
    const coreType: CoreType = set.coreAttribute?.includes('Armor') ? 'Armor' : (set.coreAttribute?.includes('Skill') ? 'Skill Tier' : 'Weapon Damage');

    const makeSetPiece = (slot: GearSlot): GearPieceInstance => {
      const hasModSlot = ['mask', 'chest', 'backpack'].includes(slot);
      return {
        slot,
        kind: 'gear-set',
        name: `${set.name} ${slot.toUpperCase()}`,
        brandOrSetId: set.id,
        core: {
          type: coreType,
          value: coreType === 'Armor' ? 170000 : (coreType === 'Skill Tier' ? 1 : 0.15),
          isRecalibrated: false
        },
        minors: [
          { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }
        ],
        modSlot: hasModSlot ? { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' } : null,
        talent: slot === 'chest' ? set.chestTalent : (slot === 'backpack' ? set.backpackTalent : null)
      };
    };

    const newGear = { ...gear };
    const slotsToReplace: GearSlot[] = mode === '4pc'
      ? ['mask', 'gloves', 'holster', 'kneepads']
      : ['mask', 'backpack', 'chest', 'gloves', 'holster', 'kneepads'];

    slotsToReplace.forEach(slot => {
      newGear[slot] = makeSetPiece(slot);
    });

    setGear(newGear);
    showToast(`Aligned ${mode.toUpperCase()} ${set.name} loadout!`);
  };

  const handleLoadPreset = (presetKey: 'buildA' | 'buildB' | 'buildB2' | 'buildC' | 'buildD') => {
    switch (presetKey) {
      case 'buildA':
        setGear(INITIAL_GEAR);
        setPrimaryWeapon(INITIAL_PRIMARY_WEAPON);
        setSpecialization('Gunner');
        setContext({ isSolo: true, distanceMeters: 25, isEnemyOutOfCover: true, throttleControlStacks: 75 });
        break;

      case 'buildB': // Eclipse Group
        setGear({
          mask: { slot: 'mask', kind: 'exotic', name: 'Vile', brandOrSetId: 'vile', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Hazard Protection', value: 0.10, unit: '%' }] },
          backpack: { slot: 'backpack', kind: 'named', name: 'The Courier', brandOrSetId: 'habsburg-guard', core: { type: 'Skill Tier', value: 1, isRecalibrated: true }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }], talent: 'Perfect Creeping Death' },
          chest: { slot: 'chest', kind: 'gear-set', name: 'Eclipse Chest', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Proliferation' },
          gloves: { slot: 'gloves', kind: 'gear-set', name: 'Eclipse Gloves', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
          holster: { slot: 'holster', kind: 'gear-set', name: 'Eclipse Holster', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
          kneepads: { slot: 'kneepads', kind: 'gear-set', name: 'Eclipse Kneepads', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] }
        });
        setSpecialization('Technician');
        setContext({ isSolo: false, distanceMeters: 15, isEnemyStatusAffected: true });
        break;

      case 'buildB2': // Eclipse Solo
        setGear({
          mask: { slot: 'mask', kind: 'exotic', name: 'Vile', brandOrSetId: 'vile', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Hazard Protection', value: 0.10, unit: '%' }] },
          backpack: { slot: 'backpack', kind: 'gear-set', name: 'Eclipse Backpack', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Symptom Aggravator' },
          chest: { slot: 'chest', kind: 'gear-set', name: 'Eclipse Chest', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }], talent: 'Proliferation' },
          gloves: { slot: 'gloves', kind: 'gear-set', name: 'Eclipse Gloves', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
          holster: { slot: 'holster', kind: 'gear-set', name: 'Eclipse Holster', brandOrSetId: 'eclipse-protocol', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }] },
          kneepads: { slot: 'kneepads', kind: 'brand', name: 'Electrique Kneepads', brandOrSetId: 'electrique', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Status Effects', value: 0.10, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }] }
        });
        setSpecialization('Technician');
        setContext({ isSolo: true, distanceMeters: 15, isEnemyStatusAffected: true });
        break;

      case 'buildC': // Support 3-Man
        setGear({
          mask: { slot: 'mask', kind: 'gear-set', name: 'Future Initiative Mask', brandOrSetId: 'future-initiative', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Repair Skills', value: 0.20, unit: '%' }] },
          backpack: { slot: 'backpack', kind: 'gear-set', name: 'Future Initiative Backpack', brandOrSetId: 'future-initiative', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Repair Skills', value: 0.20, unit: '%' }], talent: 'Strategic Remedy' },
          chest: { slot: 'chest', kind: 'gear-set', name: 'Future Initiative Chest', brandOrSetId: 'future-initiative', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Repair Skills', value: 0.20, unit: '%' }], talent: 'Tactical Superiority' },
          gloves: { slot: 'gloves', kind: 'exotic', name: 'BTSU Datagloves', brandOrSetId: 'btsu-datagloves', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Skill Haste', value: 0.12, unit: '%' }, { attribute: 'Repair Skills', value: 0.20, unit: '%' }] },
          holster: { slot: 'holster', kind: 'gear-set', name: 'Future Initiative Holster', brandOrSetId: 'future-initiative', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Repair Skills', value: 0.20, unit: '%' }] },
          kneepads: { slot: 'kneepads', kind: 'brand', name: 'Alps Kneepads', brandOrSetId: 'alps-summit-armaments', core: { type: 'Skill Tier', value: 1 }, minors: [{ attribute: 'Repair Skills', value: 0.20, unit: '%' }, { attribute: 'Skill Haste', value: 0.12, unit: '%' }] }
        });
        setSpecialization('Technician');
        setContext({ isSolo: false, distanceMeters: 20 });
        break;

      case 'buildD': // True Patriot Debuff
        setGear({
          mask: { slot: 'mask', kind: 'gear-set', name: 'True Patriot Mask', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
          backpack: { slot: 'backpack', kind: 'gear-set', name: 'True Patriot Backpack', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], talent: 'Patriotic Boost' },
          chest: { slot: 'chest', kind: 'gear-set', name: 'True Patriot Chest', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }], talent: 'Waving the Flag' },
          gloves: { slot: 'gloves', kind: 'exotic', name: 'Overdogs', brandOrSetId: 'overdogs', core: { type: 'Weapon Damage', value: 0.15 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }, { attribute: 'Critical Hit Chance', value: 0.06, unit: '%' }] },
          holster: { slot: 'holster', kind: 'gear-set', name: 'True Patriot Holster', brandOrSetId: 'true-patriot', core: { type: 'Armor', value: 170000 }, minors: [{ attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] },
          kneepads: { slot: 'kneepads', kind: 'named', name: "Fox's Prayer", brandOrSetId: 'overlord-armaments', core: { type: 'Weapon Damage', value: 0.15, isRecalibrated: true }, minors: [{ attribute: 'Damage to Target Out of Cover', value: 0.08, unit: '%' }, { attribute: 'Critical Hit Damage', value: 0.12, unit: '%' }] }
        });
        setSpecialization('Gunner');
        setContext({ isSolo: false, distanceMeters: 20 });
        break;
    }
  };

  const handleEquipCandidate = (cand: CandidateBuild) => {
    setGear(cand.gear);
    setActiveTab('editor');
  };

  const handleAddToComparison = (cand: CandidateBuild) => {
    if (!comparisonBuilds.some(c => c.id === cand.id)) {
      setComparisonBuilds([...comparisonBuilds, cand]);
    }
    setActiveTab('comparison');
  };

  return (
    <div className="min-h-screen bg-shd-bg text-shd-textPrimary flex flex-col font-sans selection:bg-shd-orange selection:text-shd-bg">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onSignOut={() => { setUser(null); setToken(null); }}
        comparisonCount={comparisonBuilds.length}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Context Bar */}
        <CombatContextBar
          context={context}
          onChange={setContext}
          onLoadPreset={handleLoadPreset}
        />

        {/* Tab 1: Loadout Editor */}
        {activeTab === 'editor' && (
          <div className="flex flex-col gap-4">
            {/* Quick Actions / Standalone Calculator Local JSON Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-shd-surface1 border border-shd-border1 p-2.5 clip-corner shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-shd-orange flex items-center gap-1.5">
                  <span>⚡ LOADOUT CALCULATOR</span>
                </span>
                <span className="text-[10px] font-mono text-shd-textMonoMuted hidden sm:inline">
                  • Standalone Calculator & Local JSON File Storage
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 text-xs font-mono border border-shd-border2 hover:border-shd-orange text-shd-textSecondary hover:text-white bg-shd-surface2 clip-corner-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <span>⬆ Upload JSON</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadBuildJson}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setAlignModalState({ isOpen: true })}
                  className="px-3 py-1.5 text-xs font-mono border border-shd-orange/70 text-shd-orange hover:bg-shd-orange hover:text-shd-bg bg-shd-surface2 clip-corner-sm transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Align 4-piece or 6-piece gear set across slots"
                >
                  <span>⚡ Align Set</span>
                </button>

                <button
                  onClick={handleDownloadBuildJson}
                  className="px-3 py-1.5 text-xs font-mono border border-shd-border2 hover:border-shd-orange text-shd-textSecondary hover:text-white bg-shd-surface2 clip-corner-sm transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Download build as local JSON file"
                >
                  <span>⬇ Download JSON</span>
                </button>

                <button
                  onClick={handleSaveToBrowser}
                  className="px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider bg-shd-orange hover:bg-shd-orangeLight text-shd-bg clip-corner-sm transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Save build to browser local storage"
                >
                  <span>💾 Save Build</span>
                </button>
              </div>
            </div>

            {toastMessage && (
              <div className="bg-emerald-950/40 border border-emerald-700 text-emerald-300 text-xs font-mono px-3 py-2 clip-corner-sm flex items-center justify-between">
                <span>✓ {toastMessage}</span>
                <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white text-xs ml-2">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: 6 Gear Slots + 3 Weapons (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Weapons Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-shd-textPrimary">
                    Weapons (Active: {activeWeaponSlot.toUpperCase()})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <WeaponSlotCard
                    slot="primary"
                    weapon={primaryWeapon}
                    onChange={setPrimaryWeapon}
                    isActive={activeWeaponSlot === 'primary'}
                    onSetActive={() => setActiveWeaponSlot('primary')}
                  />
                  <WeaponSlotCard
                    slot="secondary"
                    weapon={secondaryWeapon}
                    onChange={setSecondaryWeapon}
                    isActive={activeWeaponSlot === 'secondary'}
                    onSetActive={() => setActiveWeaponSlot('secondary')}
                  />
                  <WeaponSlotCard
                    slot="sidearm"
                    weapon={sidearm}
                    onChange={setSidearm}
                    isActive={activeWeaponSlot === 'sidearm'}
                    onSetActive={() => setActiveWeaponSlot('sidearm')}
                  />
                </div>
              </div>

              {/* Gear Slots Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-shd-textPrimary">
                    Gear Pieces (6 Slots)
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-shd-textMonoMuted">
                    <span>Specialization:</span>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="bg-shd-surface1 border border-shd-border2 px-2 py-0.5 text-shd-orange outline-none clip-corner-sm"
                    >
                      <option value="Gunner">Gunner</option>
                      <option value="Sharpshooter">Sharpshooter</option>
                      <option value="Survivalist">Survivalist</option>
                      <option value="Technician">Technician</option>
                      <option value="Demolitionist">Demolitionist</option>
                      <option value="Firewall">Firewall</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(['mask', 'backpack', 'chest', 'gloves', 'holster', 'kneepads'] as GearSlot[]).map(slot => (
                    <GearSlotCard
                      key={slot}
                      slot={slot}
                      piece={gear[slot]}
                      onChange={(updated) => setGear({ ...gear, [slot]: updated })}
                      onAlignSet={(setId) => setAlignModalState({ isOpen: true, initialSetId: setId })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Stat Engine & Multipliers (4 Cols) */}
            <div className="lg:col-span-4">
              <div className="sticky top-20">
                <StatsPanel
                  stats={computedStats}
                />
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Tab 2: Optimizer */}
        {activeTab === 'optimizer' && (
          <OptimizerView
            currentGear={gear}
            activeWeapon={activeWeapon}
            watch={watch}
            specialization={specialization}
            context={context}
            onEquipCandidate={handleEquipCandidate}
            onAddToComparison={handleAddToComparison}
          />
        )}

        {/* Tab 3: Comparison */}
        {activeTab === 'comparison' && (
          <ComparisonView
            baselineStats={computedStats}
            baselineName={`${activeWeapon.name} Current Loadout`}
            comparisonBuilds={comparisonBuilds}
            onRemoveComparison={(id) => setComparisonBuilds(comparisonBuilds.filter(c => c.id !== id))}
            onEquip={handleEquipCandidate}
            onClearAll={() => setComparisonBuilds([])}
          />
        )}

        {/* Tab 4: Saved Builds */}
        {activeTab === 'saved' && (
          <SavedBuildsView
            currentGear={gear}
            activeWeapon={primaryWeapon}
            secondaryWeapon={secondaryWeapon}
            sidearm={sidearm}
            watch={watch}
            specialization={specialization}
            context={context}
            onLoadBuild={loadSavedBuild}
          />
        )}

        {/* Tab 5: ISAC-B Advisor */}
        {activeTab === 'advisor' && (
          <AdvisorChat />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-shd-surface1 border-t border-shd-border1 py-3 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-shd-textMonoMuted">
          <div>
            DIVISION CONFIG · Y8S3 RED HORIZON / TU30 / PATCH 2.34
          </div>
          <div>
            Data Sources: Azurmen, Bend3n, Gingerbeard_x, Maplestruck, Saint Landwalker, #build-advice
          </div>
        </div>
      </footer>

      {/* Align Gear Set Modal */}
      <AlignGearSetModal
        isOpen={alignModalState.isOpen}
        initialSetId={alignModalState.initialSetId}
        onClose={() => setAlignModalState({ isOpen: false })}
        onConfirm={handleAlignGearSet}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={(u, t) => {
          setUser(u);
          setToken(t);
        }}
      />
    </div>
  );
}
