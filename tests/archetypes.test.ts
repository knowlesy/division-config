import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ARCHETYPES } from '../src/lib/optimizer/archetypes';
import { ComputedLoadoutStats, CombatContext } from '../src/lib/calc/types';

import brandSetsData from '../data/brand-sets.json';
import gearSetsData from '../data/gear-sets.json';
import gearNamedData from '../data/gear-named.json';
import weaponsNamedData from '../data/weapons-named.json';

describe('Archetypes Library & Invariant Rules', () => {
  const dummyStats: ComputedLoadoutStats = {
    effectiveBulletDamage: 100000,
    effectiveCritHitDamage: 250000,
    effectiveHeadshotDamage: 300000,
    effectiveHeadshotCritDamage: 450000,
    expectedDamagePerShot: 180000,
    burstDps: 1800000,
    sustainedDps: 1200000,
    totalArmor: 1200000,
    totalHealth: 330000,
    effectiveHealth: 1530000,
    threatMultiplier: 2.0,
    hazardProtection: 0.85,
    skillHasteSum: 0.35,
    skillTier: 6,
    activeSetBonuses: [],
    activeBrandBonuses: [],
    groupBreakdown: {
      weaponDamageSum: 0.90,
      totalWeaponDamageSum: 0.25,
      critChance: 0.60,
      critDamage: 1.50,
      effectiveCritFactor: 1.90,
      headshotDamage: 0.65,
      skillDamageSum: 0.80,
      totalSkillDamageSum: 0.30,
      skillRepairSum: 0.90,
      statusEffectsSum: 0.80,
      hazardProtectionSum: 0.85,
      rateOfFireMultiplier: 1.15,
      magazineSizeMultiplier: 1.30,
      reloadSpeedMultiplier: 1.15,
      threatMultiplier: 2.0,
      amplifiers: [],
      totalAmplifierMultiplier: 1.30,
      allyDamageBonusSum: 0.25,
      allyMitigationBonusSum: 0.35,
      enemyDebuffMultiplier: 1.30
    },
    warnings: [],
    confidenceFlags: [],
    itemisationValid: true,
    itemisationErrors: []
  };

  const groupContext: CombatContext = { isSolo: false, distanceMeters: 15 };
  const soloContext: CombatContext = { isSolo: true, distanceMeters: 15 };

  it('defines all ten required archetypes with descriptions and valid scoring functions', () => {
    const archetypeKeys = Object.keys(ARCHETYPES);
    expect(archetypeKeys).toHaveLength(10);

    for (const key of archetypeKeys) {
      const def = ARCHETYPES[key];
      expect(def.id).toBe(key);
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
      const score = def.score(dummyStats, groupContext);
      expect(score).toBeGreaterThan(0);
    }
  });

  it('enforces hard floors for Skill Damage (ST6)', () => {
    const def = ARCHETYPES.skill_damage;
    expect(def.validateFloors(dummyStats, def.defaultFloors, groupContext).satisfied).toBe(true);

    const lowTierStats = { ...dummyStats, skillTier: 3 };
    const res = def.validateFloors(lowTierStats, def.defaultFloors, groupContext);
    expect(res.satisfied).toBe(false);
    expect(res.shortfall).toContain('Skill Tier');
  });

  it('enforces group-only floors for Force Multiplier and Lightning Rod', () => {
    const fm = ARCHETYPES.force_multiplier;
    const lr = ARCHETYPES.lightning_rod;

    expect(fm.validateFloors(dummyStats, fm.defaultFloors, groupContext).satisfied).toBe(true);
    expect(fm.validateFloors(dummyStats, fm.defaultFloors, soloContext).satisfied).toBe(false);

    const highArmorStats = { ...dummyStats, totalArmor: 1600000 };
    expect(lr.validateFloors(highArmorStats, lr.defaultFloors, groupContext).satisfied).toBe(true);
    expect(lr.validateFloors(highArmorStats, lr.defaultFloors, soloContext).satisfied).toBe(false);
  });

  it('CRITICAL INVARIANT (§3, §8 criterion 14): scoring functions & logic contain ZERO item names or seeds', () => {
    const filePath = path.resolve(process.cwd(), 'src/lib/optimizer/archetypes.ts');
    const fullContent = fs.readFileSync(filePath, 'utf8');

    // Strip UI metadata (archetype id, name, description) to test the calculation logic and scoring functions
    const logicOnly = fullContent
      .replace(/id:\s*['"][^'"]+['"]/g, '')
      .replace(/name:\s*['"][^'"]+['"]/g, '')
      .replace(/description:\s*['"][^'"]+['"]/g, '')
      .toLowerCase();

    // Exclude the 10 archetype names defined by the spec itself
    const archetypeUiNames = new Set([
      'sustained dps',
      'precision dps',
      'skill damage',
      'glass medic',
      'field medic',
      'force multiplier',
      'bulwark',
      'lightning rod',
      'lockdown',
      'hardened'
    ]);

    const forbiddenNames = new Set<string>();

    for (const b of (brandSetsData as any[])) {
      if (b.name && b.name.length > 3 && !archetypeUiNames.has(b.name.toLowerCase())) forbiddenNames.add(b.name.toLowerCase());
    }
    for (const s of (gearSetsData as any[])) {
      if (s.name && s.name.length > 3 && !archetypeUiNames.has(s.name.toLowerCase())) forbiddenNames.add(s.name.toLowerCase());
    }
    for (const g of (gearNamedData as any[])) {
      if (g.name && g.name.length > 3 && !archetypeUiNames.has(g.name.toLowerCase())) forbiddenNames.add(g.name.toLowerCase());
    }
    for (const w of (weaponsNamedData as any[])) {
      if (w.name && w.name.length > 3 && !archetypeUiNames.has(w.name.toLowerCase())) forbiddenNames.add(w.name.toLowerCase());
    }

    const matchedNames: string[] = [];
    for (const item of forbiddenNames) {
      const regex = new RegExp(`\\b${item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(logicOnly)) {
        matchedNames.push(item);
      }
    }

    expect(matchedNames).toEqual([]);
  });
});
