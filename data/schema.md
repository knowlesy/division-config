# Division Config Data Schema (Y8S3 / TU30 / 2.34)

Generated: 2026-08-29T17:29:12.927Z
Spreadsheet Hash: `a6affadd1598f2f9e6345774e7e2cfcbf5c7f110ff94796ad1a1def0a23c3924`
Reference Doc Hash: `52a5e99166c9632700cd9914ecb208358fdf142944ccb3399eaaab614cb1ef78`

## Overview of Data Files

| File | Item Count | Source Tab / Document | Description |
|---|---|---|---|
| `weapons.json` | 317 | `Weapons` | Full weapon statistics (base damage, RPM, burst/sustain DPS, reload time, mod slots, innate HSD). |
| `weapons-named.json` | 144 | `Weapons Named + Exotics` + Reference §6 | Named and Exotic weapons with fixed talents, exotic mods, and drop sources. |
| `gear-sets.json` | 28 | `Gearsets` + Reference §4, §6 | All 28 gear sets including 2pc, 3pc, 4pc talents, chest & backpack talents, and multiplier groups. |
| `brand-sets.json` | 37 | `Brandsets` + Reference §2, §5 | All 37 brand sets with corrected 1pc, 2pc, 3pc bonuses. |
| `gear-named.json` | 102 | `Gear Named + Exotics` + Reference §6 | Named and Exotic gear pieces per slot with perfect talents and core/minor attributes. |
| `talents-weapon.json` | 68 | `Weapon Talents` + Reference §6, §8 | Weapon talents with perfect variants, multiplier groups, and Y8S3 reworks. |
| `talents-gear.json` | 46 | `Gear Talents` + Reference §8 | Chest and Backpack talents with multiplier groups and PvP modifiers. |
| `mods-weapon.json` | 94 | `Weapon Mods` | Weapon optics, magazine, muzzle, and underbarrel mods with bonuses, penalties, and unlock sources. |
| `skills.json` | 14 | `Skill List` + `Skill Info` | 14 skill platforms and variants with tier 0–6 stats and overcharge effects. |
| `specializations.json` | 7 | `Specializations` | All 6 specialization trees and universal passives. |
| `attributes.json` | — | `Attribute Info` + Reference §7 | Attribute caps, prototype maxima, gear mod pools, watch maxima, and status immunity thresholds. |
| `multiplier-groups.json` | 12 | Reference §3 | Multiplier group definitions and damage stacking rules. |
| `meta.json` | — | Pipeline Metadata | Build timestamps, file hashes, record counts, and author attributions. |

## Multiplier Groups Model

- **Within same group**: Additive ($1 + \sum \text{bonuses}$)
- **Across different groups**: Multiplicative ($\prod \text{groups}$)
- **Amplifiers**: Independent multiplicative terms ($\prod (1 + \text{amp})$)
