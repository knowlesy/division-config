import { describe, it, expect } from 'vitest';
import { formatBuildMarkdown, parseBuildString, SavedBuild } from '../src/lib/storage/build-storage';

describe('Storage and Serialization', () => {
  const sampleBuild: SavedBuild = {
    id: 'test-build-1',
    name: 'Test Pestilence DPS',
    description: 'Unit test build.',
    createdAt: '2026-08-29T18:00:00.000Z',
    updatedAt: '2026-08-29T18:00:00.000Z',
    gear: {
      mask: { slot: 'mask', kind: 'exotic', name: "Coyote's Mask", brandOrSetId: 'coyotes-mask', core: { type: 'Weapon Damage', value: 0.15 }, minors: [] },
      backpack: { slot: 'backpack', kind: 'gear-set', name: 'Tipping Scales Backpack', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [] },
      chest: { slot: 'chest', kind: 'gear-set', name: 'Tipping Scales Chest', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [] },
      gloves: { slot: 'gloves', kind: 'exotic', name: 'Overdogs', brandOrSetId: 'overdogs', core: { type: 'Weapon Damage', value: 0.15 }, minors: [] },
      holster: { slot: 'holster', kind: 'gear-set', name: 'Tipping Scales Holster', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [] },
      kneepads: { slot: 'kneepads', kind: 'gear-set', name: 'Tipping Scales Kneepads', brandOrSetId: 'tipping-scales', core: { type: 'Weapon Damage', value: 0.15 }, minors: [] }
    },
    weapon: {
      slot: 'primary',
      name: 'Pestilence',
      category: 'LMG',
      baseDamage: 48300,
      rpm: 935,
      magSize: 100,
      reloadTime: 4.54,
      innateHsd: 0.65,
      coreAttribute: { type: 'Weapon Damage', value: 0.15 },
      secondaryCoreAttribute: { type: 'Damage to Target Out of Cover', value: 0.12 }
    },
    watch: { weaponDamage: 0.10 },
    specialization: 'Gunner',
    context: { isSolo: true, distanceMeters: 25 }
  };

  it('formats build as markdown with frontmatter and parses it back without loss', () => {
    const md = formatBuildMarkdown(sampleBuild);
    expect(md).toContain('---');
    expect(md).toContain('title: "Test Pestilence DPS"');
    expect(md).toContain('```json');

    const parsed = parseBuildString(md);
    expect(parsed).toBeDefined();
    expect(parsed?.id).toBe(sampleBuild.id);
    expect(parsed?.weapon.name).toBe('Pestilence');
    expect(parsed?.gear.mask.name).toBe("Coyote's Mask");
  });

  it('parses raw JSON string directly', () => {
    const rawJson = JSON.stringify(sampleBuild);
    const parsed = parseBuildString(rawJson);
    expect(parsed?.id).toBe('test-build-1');
    expect(parsed?.gear.mask.name).toBe("Coyote's Mask");
    expect(parsed?.weapon.name).toBe('Pestilence');
  });

  it('handles JSON files with secondaryWeapon and sidearm attributes', () => {
    const fullBuild: SavedBuild = {
      ...sampleBuild,
      secondaryWeapon: {
        slot: 'secondary',
        name: 'The White Death',
        category: 'MMR',
        baseDamage: 120000,
        rpm: 55,
        magSize: 5,
        reloadTime: 3.2,
        innateHsd: 1.37,
        coreAttribute: { type: 'Weapon Damage', value: 0.15 }
      },
      sidearm: {
        slot: 'sidearm',
        name: 'Orbit',
        category: 'Pistols',
        baseDamage: 90000,
        rpm: 150,
        magSize: 6,
        reloadTime: 2.1,
        innateHsd: 1.0,
        coreAttribute: { type: 'Weapon Damage', value: 0.15 }
      }
    };

    const jsonString = JSON.stringify(fullBuild, null, 2);
    const parsed = parseBuildString(jsonString);
    expect(parsed?.secondaryWeapon?.name).toBe('The White Death');
    expect(parsed?.sidearm?.name).toBe('Orbit');
  });
});
