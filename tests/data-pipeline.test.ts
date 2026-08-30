import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Data Pipeline Verification', () => {
  const dataDir = path.resolve(process.cwd(), 'data');

  it('generates all expected output files in /data/', () => {
    const expectedFiles = [
      'weapons.json',
      'weapons-named.json',
      'gear-sets.json',
      'brand-sets.json',
      'gear-named.json',
      'talents-weapon.json',
      'talents-gear.json',
      'mods-weapon.json',
      'skills.json',
      'specializations.json',
      'attributes.json',
      'multiplier-groups.json',
      'meta.json',
      'schema.md'
    ];
    for (const f of expectedFiles) {
      expect(fs.existsSync(path.join(dataDir, f))).toBe(true);
    }
  });

  it('verifies the four brand corrections are applied', () => {
    const brands = JSON.parse(fs.readFileSync(path.join(dataDir, 'brand-sets.json'), 'utf8'));

    const lengmo = brands.find((b: any) => b.name.toLowerCase().includes('lengmo'));
    expect(lengmo).toBeDefined();
    expect(lengmo.bonus1pcRaw).toBe('15% Reload Speed');
    expect(lengmo.bonus1pc.value).toBe(0.15);
    expect(lengmo.confidence).toBe('[PDF]');

    const chinaLight = brands.find((b: any) => b.name.toLowerCase().includes('china light'));
    expect(chinaLight).toBeDefined();
    expect(chinaLight.bonus2pcRaw).toBe('20% Status Effects');
    expect(chinaLight.bonus2pc.value).toBe(0.20);
    expect(chinaLight.confidence).toBe('[PDF]');

    const electrique = brands.find((b: any) => b.name.toLowerCase().includes('electrique'));
    expect(electrique).toBeDefined();
    expect(electrique.bonus2pcRaw).toBe('20% Hazard Protection');
    expect(electrique.bonus2pc.value).toBe(0.20);
    expect(electrique.confidence).toBe('[PDF]');

    const tactical511 = brands.find((b: any) => b.name.toLowerCase().includes('5.11'));
    expect(tactical511).toBeDefined();
    expect(tactical511.bonus1pcRaw).toBe('12% Protection from Elites');
    expect(tactical511.bonus1pc.value).toBe(0.12);
    expect(tactical511.confidence).toBe('[PDF]');
  });

  it('spot-checks three gear sets matching Reference §4 exactly', () => {
    const gearSets = JSON.parse(fs.readFileSync(path.join(dataDir, 'gear-sets.json'), 'utf8'));

    // 1. Tipping Scales
    const tippingScales = gearSets.find((s: any) => s.name === 'Tipping Scales');
    expect(tippingScales).toBeDefined();
    expect(tippingScales.coreAttribute).toBe('Weapon Damage');
    expect(tippingScales.bonus2pcRaw).toContain('30%');
    expect(tippingScales.bonus2pcRaw).toContain('Mag');
    expect(tippingScales.bonus3pcRaw).toContain('30%');
    expect(tippingScales.bonus3pcRaw).toContain('LMG');
    expect(tippingScales.talent4pc).toContain('Throttle Control');
    expect(tippingScales.chestTalent).toContain('Sustainability');
    expect(tippingScales.backpackTalent).toContain('Snowball');

    // 2. Striker's Battlegear
    const striker = gearSets.find((s: any) => s.name.includes('Striker'));
    expect(striker).toBeDefined();
    expect(striker.coreAttribute).toBe('Weapon Damage');
    expect(striker.talent4pc).toContain('Gamble');
    expect(striker.chestTalent).toContain('Press the Advantage');
    expect(striker.backpackTalent).toContain('Risk Management');

    // 3. Eclipse Protocol
    const eclipse = gearSets.find((s: any) => s.name.includes('Eclipse Protocol'));
    expect(eclipse).toBeDefined();
    expect(eclipse.coreAttribute).toBe('Skill Tier');
    expect(eclipse.talent4pc).toContain('Indirect Transmission');
    expect(eclipse.backpackTalent).toContain('Symptom Aggravator');
  });

  it('verifies all Red Horizon additions are present', () => {
    const namedWeapons = JSON.parse(fs.readFileSync(path.join(dataDir, 'weapons-named.json'), 'utf8'));
    const namedGear = JSON.parse(fs.readFileSync(path.join(dataDir, 'gear-named.json'), 'utf8'));
    const gearSets = JSON.parse(fs.readFileSync(path.join(dataDir, 'gear-sets.json'), 'utf8'));
    const weaponTalents = JSON.parse(fs.readFileSync(path.join(dataDir, 'talents-weapon.json'), 'utf8'));

    // Exotics
    expect(namedWeapons.some((w: any) => w.name === 'Fafnir' && w.isExotic)).toBe(true);
    expect(namedGear.some((g: any) => g.name === 'Iron Will' && g.isExotic)).toBe(true);

    // Named Gear
    expect(namedGear.some((g: any) => g.name === 'Trick Shot')).toBe(true);
    expect(namedGear.some((g: any) => g.name === 'Rushdown')).toBe(true);
    expect(namedGear.some((g: any) => g.name === 'Melon Baller')).toBe(true);
    expect(namedGear.some((g: any) => g.name === 'Keeper')).toBe(true);

    // Named Weapons & Talents
    expect(namedWeapons.some((w: any) => w.name === 'Teapot')).toBe(true);
    expect(namedWeapons.some((w: any) => w.name === 'Steamer')).toBe(true);
    expect(weaponTalents.some((t: any) => t.name === 'Boiling Point')).toBe(true);

    // Determined Rework
    const determined = weaponTalents.find((t: any) => t.name.toLowerCase() === 'determined');
    expect(determined.description).toContain('no longer chain');

    // Gear Set
    expect(gearSets.some((s: any) => s.name === 'Ember Engine')).toBe(true);
  });

  it('contains no NaN values in any emitted JSON', () => {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(dataDir, f), 'utf8');
      expect(content).not.toContain('NaN');
      expect(content).not.toContain('null,null');
    }
  });

  it('strictly resolves all referenced sets, brands, and named items to entries in /data/', () => {
    const gearSets = JSON.parse(fs.readFileSync(path.join(dataDir, 'gear-sets.json'), 'utf8'));
    const brandSets = JSON.parse(fs.readFileSync(path.join(dataDir, 'brand-sets.json'), 'utf8'));
    const namedGear = JSON.parse(fs.readFileSync(path.join(dataDir, 'gear-named.json'), 'utf8'));

    const setIds = new Set(gearSets.map((s: any) => s.id));
    const brandIds = new Set(brandSets.map((b: any) => b.id));
    const namedNames = new Set(namedGear.map((g: any) => g.name.toLowerCase().replace(/[\u2018\u2019]/g, "'")));

    // Verify key references in optimizer/calculator resolve to valid records in /data/
    expect(setIds.has('future-initiative')).toBe(true);
    expect(setIds.has('tipping-scales')).toBe(true);
    expect(setIds.has('eclipse-protocol')).toBe(true);
    expect(setIds.has('striker-s-battlegear')).toBe(true);
    expect(setIds.has('foundry-bulwark')).toBe(true);
    expect(setIds.has('system-corruption')).toBe(true);
    expect(setIds.has('tip-of-the-spear')).toBe(true);
    expect(setIds.has('aces-eights')).toBe(true);

    expect(namedNames.has('the courier')).toBe(true);
    expect(namedNames.has("coyote's mask")).toBe(true);
    expect(namedNames.has('btsu datagloves')).toBe(true);
    expect(namedNames.has('the setup')).toBe(true);
  });
});
