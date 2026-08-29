# The Division 2 — Build Planning Reference
## Year 8 Season 3 "Red Horizon" / TU30 / Patch 2.34

**Compiled:** 28 August 2026 (rev 2 — recalibration rules verified, control build finalised)
**Patch live since:** 27 August 2026

---

## 0. HOW TO USE THIS FILE

Re-upload this file at the start of any future session to restore full context. Claude has no memory between conversations — without this file, none of the analysis below carries over.

**Source hierarchy used throughout:**

1. **Ubisoft "Red Horizon Gear Updates" PDF** — authoritative for every Y8S3 gear set and brand set value. Verified line by line.
2. **Ubisoft Red Horizon news post** (26 Aug 2026) — authoritative for new items, talents, modifiers.
3. **Community "Division 2 Gear Spreadsheet"** (Azurmen, Bend3n, Gingerbeard_x, Maplestruck, Saint Landwalker; #build-advice on the Division 2 Discord) — everything else. Accurate except where noted in §2.
4. Third-party patch coverage — **not used**. Aggregator articles were tested against the PDF and found to contain PTS-era values that never shipped. Do not trust them.

**Confidence markers used below:**
`[PDF]` verified against the official gear document · `[UBI]` verified against the official news post · `[SHEET]` from the community spreadsheet, unverified against official sources · `[?]` known uncertainty, listed in §11.

---

## 1. SOURCE SPREADSHEET RELIABILITY MAP

The community sheet was mid-update when captured. Trust by tab:

| Tab | Status | Notes |
|---|---|---|
| Gearsets | **Current (TU30)** | Verified 100% accurate against the PDF |
| Brandsets | **Current (TU30)** | 4 errors found — see §2 |
| Weapons (stat table) | **TU28-era** | ~300 variants: RPM, base damage, burst/sustain DPS, mag, reload, optimal range, mod slots, HSD. Use for *relative* ranking, not absolute numbers |
| Weapons: Named + Exotics | **TU28-era** | Missing all Red Horizon additions |
| Gear: Named + Exotics | **TU28-era** | Missing all Red Horizon additions |
| Weapon Talents | **TU28-era** | Determined entry now wrong — see §5 |
| Gear Talents | **TU28-era** | No known errors |
| Attribute Info | Stable | Max rolls rarely change |
| Skill List / Skill Info | TU27 | Per-tier skill stats, overcharge values |
| Weapon Mods | Stable | Full mod pool with unlock sources |
| FAQ / Hub | Y7–Y8S1 | Build guide links, mostly still valid |

**Pattern worth knowing:** the four brand errors are all cases where a bonus *moved slots* between seasons, not where a number was retuned. Straight numeric changes were handled cleanly. Apply extra scepticism to any brand where Y8S3 relocated a bonus.

---

## 2. CORRECTIONS TO THE COMMUNITY SHEET

| Brand | Sheet says | Correct value `[PDF]` | Cause |
|---|---|---|---|
| **Lengmo** 1pc | 30% Reload Speed | **15% Reload Speed** | Value doubled |
| **China Light** 2pc | 25% Status Effects | **20% Status Effects** | Old Y8S2 *3pc* value carried into the new 2pc slot |
| **Electrique** 2pc | 20% Electricity Protection | **20% Hazard Protection** | "Electricity Protection" is not a real bonus type; half-edit from the old 20% Shock Resistance |
| **5.11 Tactical** 1pc | 10% Protection from Elites | **12% Protection from Elites** | 10% is the PvP-normalised value |

Everything else on both the Gearsets and Brandsets tabs matches the official document exactly.

---

## 3. DAMAGE STACKING MODEL

This is the single most important thing for optimisation. Most build mistakes come from stacking two bonuses that share a group.

### The rule
- Bonuses **within the same group are additive**: two 30% bonuses = 1 + (0.30 + 0.30) = **1.60×**
- Bonuses in **different groups are multiplicative**: 1.30 × 1.30 = **1.69×**
- **Amplifiers are NEVER additive with anything**, including other amplifiers. Each amp is its own multiplicative term.

### Practical consequence
One "total weapon damage" talent plus one amplifier beats three "total weapon damage" talents. When choosing between two talents, check their multiplier group first and their percentage second.

### Main groups
`Weapon Damage` · `Total Weapon Damage` · `Critical Hit Chance` · `Critical Hit Damage` · `Headshot Damage` · `Skill Damage` · `Total Skill Damage` · `Skill Repair` · `Status Effects` · `Rate of Fire` · `Amplifier` (never additive) · `Utility` (no damage contribution)

### Special cases
- **Skill Efficiency** grants +1% of *every* yellow minor attribute per point: Skill Damage, Skill Haste, Skill Duration, Skill Health, Repair Skills, Status Effects. Note: skill haste from skill efficiency displays at 2× on the stat sheet but tests as 1× in actual cooldowns.
- **Expertise** — weapons additive with normal weapon damage; skills additive with normal skill damage (Achilles Pulse is the exception, where Achilles grade acts as an amplifier); armour additive with *base* armour.
- **Heartbreaker's Heartstopper** is a separate multiplier: `(1 + 0.011 × n)`, n max 50, or 100 with the chest talent.
- **Striker's Gamble** is an amplifier despite the in-game text saying "total weapon damage": `(1 + 0.0065 × n)` without backpack, `(1 + 0.009 × n)` with. n max 100, or 200 with chest. `[?]` see §11.
- **Ortiz: Exuro's Heatstroke** is an amplifier despite the in-game text calling it increased weapon damage. `[PDF]`
- **Hunter's Fury** on-kill stacks are a self-multiplicative amp: `1.05^n`, n = 0–5.

### Recalibration and itemisation rules (verified 28 Aug 2026)
- **One recalibration per item** — a single stat *or* talent, though that one slot can be re-switched indefinitely afterwards. Spending it on the core means you can never fix a minor attribute on that piece, and vice versa.
- **Core attributes are a recalibratable category** and can be changed across colours (e.g. Armor → Skill Tier) on High-End, Named and brand pieces, provided that core is banked in the recalibration library for that slot type. Deconstruct a donor piece *in the library* to bank it.
- **Named gear:** the perfect ("golden") talent is locked; the core and minor attributes are open. This is what makes e.g. The Courier → yellow core work.
- **Gear set pieces:** the core is **fixed to the set's natural colour** and can never be changed (Striker always red, Eclipse always yellow). Set chest/backpack talents cannot be recalibrated either.
- **Gear set pieces carry only ONE minor attribute** versus two on brand pieces — a hidden attribute-budget cost of any 4pc set that belongs in optimisation comparisons.
- **Exotics:** fixed rolls; not recalibratable (optimise/expertise only).

---

## 4. GEAR SETS (all 27)

Format: Core | 2pc | 3pc | 4pc talent | Chest | Backpack | **Multiplier group**

### Red / Weapon Damage core

**Aces & Eights** `[PDF]` — WD | 30% MMR + 30% Rifle | 30% HSD + 30% Handling | *Dead Man's Hand*: flip a card on Rifle/MMR hits; after 5 cards next shot amplified **75%**; better hands enhance more shots (Four of a Kind 4, Full House 3, Aces and Eights 2); headshots flip an extra card | *No Limit*: 75% → **100%** | *Ace in the Sleeve*: +1 amplified shot | **Amplifier**

**Breaking Point** `[PDF]` — WD | 30% MMR + 30% Rifle | 30% HSD + 30% Handling | *On Point*: Rifle/MMR hits grant stacks (max = mag size); reloading grants +2% handling and +4% WD per stack for **20s**; no stacks gained while active; timer expiry refills mag | *Point of No Return*: 20s → **40s** | *Point of Honor*: 4% → **9%** per stack | **Additive to all Weapon Damage**

**Concentrated Company** `[PDF]` — WD | 10% WD | 30% Handling | *Camaraderie*: shooting marks an enemy for **10s**; when a marked enemy dies gain a stack of 3% WD and **3%** CHD per ally/skill that contributed, including yourself; max 35 stacks, decay every 10s, max 4 marks | *All for One*: 4 → 8 marks | *One for All*: 3% → **6%** WD per stack | **Additive to all WD and CHD**

**Hotshot** `[PDF]` — WD | 30% MMR | 30% HSD + 30% Handling *(handling moved from 2pc to 3pc in Y8S3)* | *Headache*: 1st MMR headshot boosts next headshot by **80%**; 2nd consecutive gives +10% armour (bonus armour to +50% if full); 3rd refills mag; from 4th onward all three per consecutive headshot kill; a miss resets | *Stand Tall*: bonus armour 50% → 100% | *Lucky*: may miss one headshot before reset | **Amplifier**

**Hunter's Fury** — WD | 15% Shotgun + 15% SMG | 20% Armor on Kill + 50% Health on Kill | *Apex Predator*: enemies within 15m take +20% amplified weapon damage; killing a debuffed enemy disorients others within 5m and grants +5% weapon damage for 10s, stacking 5× | *Endless Hunger*: 10s → 30s | *Overwhelming Force*: 5m → 10m | **Amplifier within 15m; on-kill stacks are 1.05^n**

**Negotiator's Dilemma** `[PDF]` — WD | 15% CHC | 20% CHD | *Crowd Control*: crits mark enemies 20s, up to 3; critting a marked enemy deals 60% of that damage to all other marked enemies; a marked enemy dying grants **+10% CHD, stacking to 10×** (was 2% × 20) | *Target Rich Environment*: 3 → 5 marks | *Critical Measures*: 60% → 112% | **Critical Hit Damage**

**Ongoing Directive** `[PDF]` — WD | 15% Status Effects | 30% Reload Speed | *Rules of Engagement*: shooting a status-affected enemy marks it; killing it grants a full clip of Hollow-Point for you and half a clip for allies; mark lasts 10s; Hollow-Point amplifies weapon damage **40%** and applies bleed | *Parabellum Rounds*: → **60%**, self only | *Trauma Specialist*: +50% bleed duration, +100% bleed damage | **Bullet Amplifier**

**Striker's Battlegear** — WD | 15% Handling | 15% RoF | *Striker's Gamble*: weapon hits grant 0.65% total weapon damage, stacking to 100; lose 1/sec below 50, 2/sec from 51–100 | *Press the Advantage*: → 200 stacks, 3/sec loss above 100 | *Risk Management*: 0.65% → **0.9%** `[?]` | **Amplifier** `(1 + 0.009n)`

**Tip of the Spear** — WD | 20% Signature Weapon Damage | 10% WD | *Aggressive Recon*: sig weapon kill grants +15% sig damage 10s and +25% reload on next reload; auto-regen sig ammo every 60s | *Specialized Destruction*: → 30%; every 3rd sig kill generates ammo | *Signature Moves*: +50% WD for 15s after depleting sig ammo; doubles ammo generated | **Total Weapon Damage / Sig amp**

**Tipping Scales** `[PDF]` — WD | 30% Magazine Size | 30% LMG Damage | *Throttle Control*: shooting builds stacks to 50; each gives +0.5% handling and **+5%** CHD; lose 6/sec while not shooting; **no loss while an enemy is suppressed** | *Sustainability*: 50 → 75 stacks | *Snowball*: **5% → 8%** CHD per stack | **Critical Hit Damage**

**Umbra Initiative** — WD | 15% CHC | 30% Reload Speed | *From the Shadows Into the Light*: out of cover gain 10 stacks/sec to 50, each giving 0.8% armour regen on consumption; in cover gain 10/sec to 50, each giving 1.2% CHD and 0.4% RPM (not while shooting from cover) | *From the Shadows*: Into the Light max 50 → 100 | *Into the Light*: From the Shadows max 50 → 100 | **CHD and Rate of Fire**

**Virtuoso** — WD | 15% Handling + 15% Mag Size | 15% WD | *Symphony*: kills beyond 25m give +40% WD to Shotgun/SMG/Pistol, +20% to AR/LMG, +25% bonus armour for 15s; kills within 25m give +40% WD to MMR/Rifle, +20% to AR/LMG, +30% HSD; alternating ranges builds stacks, at 4 all bonuses ×1.5 and trigger together | *Fortissimo*: double the WD bonus | *Accelerando*: 4 → 3 stacks needed | **All Weapon Damage**

### Blue / Armor core

**Aegis** — Armor | 70% Health | 15% Total Armor | *Stoic*: +4% damage resistance per enemy targeting you, multiplied by 1.X where X = group size | *Deceit*: enemies targeting your Decoy also count | *Polyethylene Plating*: 4% → 5% | **Utility**

**Cavalier** — Armor | 30% Hazard Protection | 40% Repair Skills | *Charging*: 5% reduced incoming skill damage per second out of cover in combat, max 50%; *Charged*: at full charge gain movement-debuff immunity and share hazard protection and incoming skill damage reduction with allies for 10s | *Overcharging*: max 70% | *Safe Charging*: 10% per second | **Utility**

**Foundry Bulwark** — Armor | 10% Total Armor | 1% Armor Regen + 50% Shield Health | *Makeshift Repairs*: 25% of damage taken by you or your shield repaired to both over 10s | *Improved Materials*: 10s → 5s | *Process Refinery*: 25% → 35% | **Utility**

**Heartbreaker** — Armor | 15% AR + 15% LMG | 15% Handling | *Heartstopper*: headshots apply pulse 5s; hits on pulsed enemies add/refresh a stack of +1% bonus armour and +1.1% weapon damage vs pulsed enemies for 5s, max 50; 2 stacks lost per second | *Max BPM*: max 100 stacks | *Cold*: stacks give +2% bonus armour | **Separate multiplier** `(1 + 0.011n)`

**True Patriot** `[PDF]` — Armor | **15% Weapon Handling** *(was 30% Ammo Capacity)* | 30% Magazine Size | *Red, White and Blue*: every 2s enemies you shoot receive a stacking debuff — Red amplifies their damage taken **15%**, White repairs your armour 2% per second while shooting them, Blue cuts their damage dealt **10%**; Full Flag: enemies dying under all three explode in 5m for their total health and armour (reduced on Named) | *Waving the Flag*: rotation to **1s** | *Patriotic Boost*: Red 15→**30%**, White 2→**5%**, Blue 10→**20%** | **Red = Amplifier; Full Flag explosion scales off the TP player's HP/armour**

**System Corruption** *(DZ exclusive, seasonal caches)* — Mask/Gloves/Holster + Backpack/Chest/Kneepads | 15% Armor on Kill | 40% Disrupt Res + 40% Pulse Res | *Hackstep Protocol*: replaces armour kits with an instant infinite-use ability granting 50% bonus armour 5s, nameplate hidden 5s, 20% armour repair, +2% total weapon damage per 5% bonus armour to 20%; 20s cooldown | *Compiler Optimization*: 20s → 15s | *Multithreaded Execution*: 50% → 100% bonus armour | **Amplifier (applies to skills, melee, grenades, bullets)**

### Yellow / Skill Tier core

**Core Strength** — Skill Tier / Armor | 10% Handling | 5% WD + 5% Armor + 5% Skill Efficiency | *Core Exercise*: for each Core attribute receive 40% of the other two Cores' bonuses; Skill Tiers count as 15% Skill Efficiency; all pieces except the backpack roll random Core attributes | *Inner Core*: 40% → 75% | *Outer Core*: backpack features three Core attributes | **Weapon Damage**

**Eclipse Protocol** — Skill Tier | 15% Status Effects | 15% Skill Haste + 30% Hazard Protection | *Indirect Transmission*: on kill, spread that enemy's status effects to all enemies within 10m and refresh 50% of their durations | *Proliferation*: 10m → 15m, 50% → 75% | *Symptom Aggravator*: **amplifies all damage you deal to status-affected targets by 30%** | **Amplifier, all sources**
> Unchanged in Y8S3 — the pass covered Red Core sets plus Ortiz: Exuro and True Patriot. Blue and Yellow Core sets are deferred to a future update. `[UBI]`

**Future Initiative** — Skill Tier | 30% Repair Skills | 30% Skill Duration + 15% Skill Haste | *Ground Control*: +15% total weapon and skill damage for you and allies at full armour; repairing an ally also repairs you and allies within 5m for 60% of that amount | *Tactical Superiority*: 15% → 25% | *Advanced Combat Tactics*: 60% → 120% | **Total weapon/skill damage**

**Hard Wired** — Skill Tier | 15% Skill Haste | 15% Skill Damage + 30% Repair Skills | *Feedback Loop*: using or cancelling a skill cuts the other's cooldown by 30s and grants +10% total skill repair and damage for 20s; 10s cooldown | *Positive Reinforcement*: 10% → 25% | *Short Circuit*: 10s → 5s | **Total Skill Damage**

**Measured Assembly** — Skill Tier | 15% Skill Haste | 60% Repair Skills + 40% Explosive Resistance | *Huddle*: +1 Skill Tier per ally within Hive/Smart Cover range; at ST6 with an ally in range 4s, gain Overcharge 15s (40s cooldown); mortars and enemy skills entering the range are destroyed (10s cooldown, 20% faster per ally in range) | *Hivemind*: overcharge cooldown 40 → 25 | *Smart Cooperation*: destroy cooldown 10 → 1 | **Utility**

**Ortiz: Exuro** `[PDF]` — Skill Tier | 20% Burn Duration + 15% Skill Health | 40% Burn Damage | *Ortiz Incinerator Turret Prototype*: spins 360°, you are immune to its fire, explodes when disabled | *Chain Combustion*: enemies ablaze ignite others within **10m** *(was 2m)* | *Heatstroke*: **+40%** amplified damage to enemies burned by the turret *(was 25%)*, +25% turret range | **Amplifier** (in-game text wrongly says weapon damage)

**Ortiz: Reficere** *(TU28)* — Skill Tier | +8% Skill Efficiency | +60% Repair Skills | *Ortiz Rapid Application Nanite Prototype*: healing skills' duration and range −75%, healing efficiency +100%; healing an ally grants them 30% hazard protection 10s (10s cooldown per ally) | *Overcharged Nanites*: 100% → 150% | *Improved Dampeners*: −75% → −25% | **Utility**

**Refactor** — Mask/Chest/Holster + Backpack/Gloves/Kneepads | 15% Status Effects | 25% Skill Damage | *Return to Sender*: PvE repairs you 10% and allies 20% of skill damage dealt | *Increased Interest*: to 25%/35% | *Over-engineered*: at full armour repairs become bonus armour up to 80% of total armour, self only | **Utility**

**Rigger** — Skill Tier | 15% Skill Haste | 15% Skill Duration | *Tend and Befriend*: interacting with a deployed skill grants it 25% skill damage 10s, not refreshable (using, deploying, retargeting, healing) | *Best Buds*: 25% → 50% | *Complete Uptime*: cancelling skills resets their cooldown | **Skill damage**

### New in Red Horizon `[UBI]`

**Ember Engine** — 2pc **8% Skill Efficiency** | 3pc **30% Status Effect** | 4pc *Spontaneous Combustion*: every Status Effect you apply has a **40% chance to also apply Burn**; if the effect applied was already Burn, the enemy takes **+25% Burn Damage** for its duration | Chest *Flashpoint*: chance 40% → **60%** | Backpack *White Hot*: +50% duration of the Burn Damage debuff | **Multiplier group not yet documented**
> Not in the community sheet. Core attribute not stated in the announcement — verify in game.
> **PvE only:** PvP values are gutted — Burn chance 8%, Flashpoint 12%, White Hot +12%.
> **Farm:** targeted loot in Countdown and The Summit (Challenging recommended); also Red Horizon season caches. Community coverage rates Vile as its strongest gear synergy and Fafnir as its natural weapon pairing.

---

## 5. BRAND SETS — CORRECTED Y8S3 VALUES `[PDF]`

PvP-normalised values in parentheses where they differ.

### Yellow Core (Skill Tier)

| Brand | 1pc | 2pc | 3pc |
|---|---|---|---|
| Alps Summit Armaments | 18% Repair Skills | 30% Skill Duration | 30% Skill Haste `[SHEET]` |
| China Light Industries | 15% Explosive Damage | **20% Status Effects** (8% PvP) | 30% Skill Haste (20% PvP) |
| Edelweiss GPz | 18% Repair Skills | 20% Skill Haste | 8% Skill Efficiency `[SHEET]` |
| Electrique | 10% Status Effects | **20% Hazard Protection** (20% PvP) | 8% Skill Efficiency (6% PvP) |
| Empress International | 10% Skill Health | 13% Skill Damage | 8% Skill Efficiency |
| Hana-U Corporation | 10% Skill Haste | 13% Skill Damage | 18% Weapon Damage |
| Murakami Industries | 15% Skill Duration | 35% Repair Skills | 18% Skill Damage `[SHEET]` |
| Richter & Kaiser GmbH | 10% Skill Haste (10% PvP) | 40% Explosive Resistance | 52% Repair Skills |
| Shiny Monkey | 15% Skill Duration | 5% Skill Efficiency | 52% Repair Skills `[SHEET]` |
| Wyvern Wear | 8% Skill Damage | 20% Status Effects | 45% Skill Duration |

### Blue Core (Armor)

| Brand | 1pc | 2pc | 3pc |
|---|---|---|---|
| 5.11 Tactical | **12% Protection from Elites** (10% PvP) | 100% Increased Threat | 30% Hazard Protection |
| Badger Tuff | 12% Shotgun Damage | 10% Armor on Kill (12% PvP) | 15% Total Armor (12% PvP) |
| Belstone Armory | 1% Armor Regen | 100% Increased Threat | 36% Protection from Elites (20% PvP) |
| Brazos de Arcabuz | 10% Skill Haste | 1 Skill Tier | 50% Magazine Size `[SHEET]` |
| Gila Guard | 5% Total Armor | 20% Hazard Protection (15% PvP) | 2% Armor Regen |
| Golan Gear Ltd | 20% Explosive Resistance | 1.5% Armor Regen | 150% Increased Threat |
| Habsburg Guard | 13% Headshot Damage | 24% MMR Damage | 25% Status Effects |
| Lengmo | **15% Reload Speed** (15% PvP) | 24% LMG Damage (12% PvP) | 30% Weapon Handling |
| Palisade Steelworks | 10% Armor on Kill | 24% Protection from Elites (15% PvP) | 1 Skill Tier |
| Uzina Getica | 5% Total Armor | 10% Armor on Kill | 30% Hazard Protection `[SHEET]` |
| Yaahl Gear | 10% Hazard Protection | 10% Weapon Damage | 40% Pulse Resistance `[SHEET]` |

### Red Core (Weapon Damage)

| Brand | 1pc | 2pc | 3pc |
|---|---|---|---|
| Airaldi Holdings | 12% MMR Damage | 26% Headshot Damage | 5% Damage to Armor |
| Ceska Vyroba s.r.o. | 8% Crit Chance | 24% Shotgun Damage (12% PvP) | 30% Hazard Protection |
| Douglas & Harding | 24% Pistol Damage | 20% Skill Health | 50% Accuracy |
| Fenris Group AB | 12% AR Damage | 32% Magazine Size (20% PvP) | 50% Stability |
| Grupo Sombra S.A. | 13% Crit Damage | 20% Explosive Damage | 39% Headshot Damage |
| Imminence Armaments | 6% Weapon Damage | 48% Pistol Damage (22% PvP) | 30% Skill Health |
| Legatus S.p.A. | 15% Magazine Size (10% PvP) | 24% SMG Damage (12% PvP) | 105% Optimal Range (75% PvP) |
| Overlord Armaments | 12% Rifle Damage | 30% Accuracy | 30% Weapon Handling |
| Petrov Defense Group | 12% LMG Damage | 15% Weapon Handling | 50% Ammo Capacity |
| Providence Defense | 13% Headshot Damage | 8% Crit Chance | 13% Crit Damage `[SHEET]` |
| Royal Works | 5% Weapon Handling | 24% LMG Damage (12% PvP) | 50% Accuracy (40% PvP) |
| Sokolov Concern | 12% SMG Damage | 13% Crit Damage | 8% Crit Chance |
| Unit Alloys | 5% Rate of Fire | 24% AR Damage | 50% Magazine Size |
| Urban Lookout | 5% Weapon Handling (10% PvP) | 24% MMR Damage (12% PvP) | 45% Skill Duration (30% PvP) |
| Walker, Harris & Co. | 6% Weapon Damage | 5% Damage to Armor | 10% Damage to Health |
| Zwiadowka Sp. z o.o. | 15% Magazine Size | 24% Rifle Damage | 30% Weapon Handling |

**Structural changes in Y8S3** `[PDF]`: Health, Incoming Repairs, Shock Resistance and Swap Speed have been **removed entirely** from brand sets. **Protection from Elites** has been **added** as a new brand bonus. Every weapon type now has one brand offering that bonus at 1pc and another at 2pc. No brand's Core Attribute changed. Red Horizon is the **last season to add new brand sets** — future additions will be Named pieces with Perfect Talents on existing brands.

---

## 6. NEW RED HORIZON CONTENT `[UBI]`

None of this appears in the community spreadsheet.

### Exotics
**Fafnir** — Exotic Shotgun. *Dragon's Breath*: fires Dragon's Breath shells, each shot has a **40% chance of applying Burn**. **Weapon Damage is amplified by 50% of your Status Effect bonus.** Mods: Optics +15% Crit Chance, Magazine +5 Rounds, Underbarrel +10% Weapon Handling. Burn application is still subject to the usual status-effect diminishing returns, so it may proc less often than 40% suggests. *(Free season track; second copy on premium track.)*

**Iron Will** — Exotic Chest. *Resolved*: your next body shot counts as a headshot. PvE cooldown 2s, PvP 3s. Requires MMR, Rifle or Pistol. *(Free season track.)*

### Named gear
| Item | Brand / Slot | Talent |
|---|---|---|
| Trick Shot | Imminence Armaments chest | Perfect Reassigned — kills add 1 round of random special ammo to your sidearm, 8s cooldown |
| Rushdown | Richter & Kaiser chest | Tag Team — the last enemy damaged by a skill is marked; weapon damage to it consumes the mark to cut active cooldowns by 12s, 4s cooldown |
| Melon Baller | Airaldi Holdings backpack | Perfect Concussion — headshots +20% total weapon damage 1.5s (5s with MMR); headshot kills +15% for 10s |
| Keeper | 5.11 Tactical backpack | Perfect Protector — shield damage grants you +25% bonus armour and allies +35% of your armour for 3s, 3s cooldown |

### Named weapons and new talent
**Teapot** and **Steamer** — *Perfect Boiling Point*: the first **48%** of your magazine has −100% Critical Hit Chance, the rest has 100%.
**Boiling Point** (standard): first **53%** of the magazine at −100% CHC, the rest at 100%.

### Talent rework
**Determined** now functions like **Perfect Determined** — a kill from a converted headshot no longer triggers another guaranteed headshot. The chaining behaviour moved to Iron Will's Resolved talent. **The community sheet's Weapon Talents tab still shows the old behaviour.** To compensate, several MMR gear sets and brand bonuses were buffed (Hotshot, Aces & Eights, Airaldi 2pc to 26%, Grupo Sombra 3pc to 39%).

### Weapon buff
**Steel & Sons ACR** — base stability increased (less vertical coil); max stacks 3 → 4; destroying a weak point now causes +30% amplified damage from you for 5s (was 10%).

### Seasonal modifier: Under Pressure
A Pressure Gauge builds from kills, headshots, multikills, skill kills, status effect kills, fire kills, and group members' kills. **Its default primary bonus is Status Effects** — a free scaling buff for status builds this season. Passive Modifiers "New Formula: Beta" and "New Formula: Gamma" can swap that for Signature Weapon Damage or Hazard Protection. 20 Passive Modifiers available.

**Active modifiers** (no general cooldown; gauge resets when the modifier ends):
- *Fiery Aura* — secondary attribute Armor Regen. Increased armour regen and damage resistance, extra protection while sprinting, sets nearby enemies alight on first entry.
- *Vicarious Combustion* — secondary attribute Headshot Damage. Headshots on burning enemies spread Burn nearby; at max level headshots apply Burn directly.
- *Signed, Shield, Delivered* — secondary attribute Skill Efficiency. Improves signature weapon performance, shield health and shield regen; sig/shield kills refill your magazine without consuming reserves.

**Hostile modifiers** drain Pressure. **Setting an affected enemy on fire is the only way to permanently remove or reverse the effect** — so fire-application gear (Fafnir, Ember Engine, any burn skill) disables Hostile Modifiers as a side effect of normal damage, a significant hidden value for status builds this season. *Draining Presence* (within 5m: drains ~10% of your magazine and 1% of your gauge per second), *Achilles' Heal* (heals the enemy and allies when you break weak points or armour, cuts Pressure), *Thousand Cuts* (cuts Pressure on hit, stacking damage-reduction debuff).

---

## 7. ATTRIBUTE CAPS

### Weapon
Core: Weapon Damage 15% (prototype 22.5%). Fixed secondary by type: AR 21% Health Damage · LMG 12% Damage to Target Out of Cover · SMG 21% Crit Chance · Shotgun 12% Damage to Armor · Rifle 17% Crit Damage · MMR 111% Headshot Damage · Pistol none.

Minor: Damage to Armor 6% · Crit Chance 9.5% · Health Damage 9.5% · Damage Out of Cover 10% · Headshot Damage 10% · Crit Damage 10% · Reload Speed 12% · Stability 12% · Accuracy 12% · Optimal Range 24% · Magazine Size 12.5% · Rate of Fire 5% · Swap Speed 15%.

Innate headshot multipliers by type: AR 0.55 · LMG 0.65 · SMG 0.50 · Shotgun 0.45 · Rifle 0.60 · Pistol 1.00 · MMR listed as its second core attribute.

### Gear
Core: Armor 170,000 (prototype 255,001) · Weapon Damage 15% (22.5%) · Skill Tier 1 (1.5).

Offensive minors: Weapon Handling 8% · Crit Chance 6% · Crit Damage 12% · Headshot Damage 10%.
Defensive minors: Armor Regen 4,925/s · Hazard Protection 10% · Health 18,935 · Explosive Resistance 10%.
Skill minors: Skill Haste 12% · Skill Damage 10% · Repair Skills 20% · Status Effects 10%.

Gear mods — offensive: Crit Chance 6% · Crit Damage 12% · Headshot Damage 10%. Defensive: Protection from Elites 13% · Armor on Kill 18,935 · Status Effect Resistance 10% · Pulse Resistance 10% · Incoming Repairs 20%. Skill: Skill Haste 12% · Skill Duration 10% · Repair Skills 20%.

**Mod slots:** only masks, backpacks and chests have them — unless a piece is Improvised, which always grants one.

### SHD Watch maxima
Weapon Damage 10% · Headshot Damage 20% · Crit Chance 10% · Crit Damage 20% · Armor 10% · Health 10% · Hazard Protection 10% · Explosive Resistance 10% · Skill Damage 10% · Skill Repair 10% · Skill Haste 10% · Skill Duration 20% · Reload Speed 10% · Accuracy 10% · Ammo 20% · Stability 10%.

### Status immunity thresholds
Resistance % needed against most enemies: Pulse 100 · Disrupt 95.8 · Bleed 93.8 · Disorient 93.8 · Ensnare 93.8 · Burn 91.4 · Blind/Deaf 91.0 · Poison 89.2 · Napalm (Cleaners) 88.9 · Shock 86.0. Some enemies apply longer durations and need more.

---

## 8. TALENT QUICK REFERENCE (multiplier groups)

Values shown as normal (perfect).

### Weapon talents — damage-relevant
| Talent | Effect | Group |
|---|---|---|
| Killer | Crit kill → +70% (90%) CHD 10s | Crit Hit Damage |
| Strained | +10% CHD per 0.5s firing, 5 (8) stacks | Crit Hit Damage |
| Vindictive | Status kill → 16% (21%) CHC and CHD to group within 15m (20m) 20s | CHC / CHD |
| Breadbasket | Body shots stack +55% (70%) HSD to next headshot, 3 (2) stacks | Headshot Damage |
| Optimist | +3.5% (4.5%) WD per 10% magazine missing | Weapon Damage |
| Close & Personal | Kill within 7m → +30% (38%) WD 10s | Weapon Damage |
| Streamline | +42% (47%) WD when no skills deployed or on cooldown | Weapon Damage |
| Soft Spot | Weak point destroyed → 19% (24%) WD 15s | Weapon Damage |
| Sadist / Eyeless / Ignited / Thunder Strike / Immobilize / Head Scratcher / Flatline | +25–35% amplified damage vs the matching status; applies it after 4 (3) kills | **Amplifier** |
| Ranger | +2% amplified per 4m (3m) distance | **Amplifier** |
| Pressure Point | +15% (20%) amplified vs status-affected | **Amplifier** |
| Sledgehammer | Grenade mark → +15% (20%) damage to armour, −20% (30%) movement | **Amplifier (armour only)** |
| Behind You | +20% (25%) amplified vs enemies not targeting you | **Amplifier** |
| Precision Strike | Kills beyond 20m stack (max 3); hitting within 20m consumes for 20% amplified 5s | **Amplifier** |
| Brazen | +3.5% (2/3%) amplified per pellet hit if ≥6 (4) hit | **Amplifier** `1 + 0.035n` |
| In Sync | Hit → +15% (20%) skill damage 5s; skill → +15% (20%) WD 5s; doubled when both active | WD / Skill Damage |
| Rifleman | Headshots stack +10% (11%) WD 5s, max 5 (6) | Weapon Damage |
| Measured | Top half of mag +25% RoF −25% (30%) WD; bottom half −18% RoF +30% (38%) TWD | RoF / (T)WD |
| Unhinged | +18% (22%) WD, −25% stability and accuracy | Weapon Damage |
| Overwhelm | Suppressing an unsuppressed enemy → +10% (12%) WD 12s, max 4 | Weapon Damage |
| Pummel | 3 (2) consecutive kills refill mag, +40% WD 10s | Weapon Damage |
| Back and Forth | Swap to: +10% (13%) RoF and +9% (12%) WD 10s; swap from: +5% RoF, +4.5% WD | RoF / WD |
| Boomerang | Crits have 50% (75%) chance to return the bullet; returned bullet next shot +40% (50%) | Weapon Damage |
| Spike | Headshots → +20% (25%) skill damage 15s | Skill Damage |
| Perpetuation | Headshots → +75% status damage and duration to next applied, 20s (16s) cooldown | Status Effect |
| Reformation | Headshots → +60% (80%) skill repair 15s | Skill Repair |

### Chest talents
| Talent | Effect | Group |
|---|---|---|
| Obliterate | Crits +1% TWD 10s, 20 (24) stacks | Total Weapon Damage |
| Gunslinger | Weapon swap +23% (30%) TWD 5s; lost 5s if you swap while active | Total Weapon Damage |
| Focus | +5% (6%) TWD per second aiming at 8x+, max 50% (60%) | Total Weapon Damage |
| Spark | Skill damage to an enemy → +15% (18%) TWD 15s (20s) | Total Weapon Damage |
| Overwatch | 10s (8s) in cover → +12% (14%) TWD and skill damage for you and allies while you stay in cover | Total Weapon Damage |
| Intimidate | While you have bonus armour, 3 stacks/sec to 9 (10), each +4% TWD within 10m; all lost at zero bonus armour | **Amplifier, exponential** `1.04^n` |
| Glass Cannon | +25% (30%) damage dealt, +50% (60%) damage taken | **Amplifier** |
| Spotter | +15% (20%) to pulsed enemies | **Amplifier** |
| Headhunter | Headshot kill → next hit within 30s deals +125% (150%) of that killing blow; capped at 800% of weapon damage, 1250% if HSD >150% | Special — see the Headhunter guides |
| Empathic Resolve | Repairing an ally → +3–15% (3–20%) their total weapon and skill damage 20s; 1–7% (1–15%) self; scales with skill tier | Total WD / Skill Damage |
| Kinetic Momentum | Each skill stacks +1.5% total skill damage and +2% total skill repair, to 15 (18) per skill; lost on cooldown | Total Skill Damage / Repair |
| Explosive Delivery | Thrown skills explode 1.5s after landing then every 5s, 25–100% of a concussion grenade scaled by skill tier | Explosive Damage |
| Unbreakable | Armour depleted → repair 95% (100%), 60s (55s) cooldown | Utility |
| Vanguard | Shield deploy → invulnerable 5s, allies get 45% (50%) of your armour as bonus armour 20s, 25s cooldown | Utility |
| Protected Reload | +20% (40%) bonus armour while reloading; allies get 0–18% (0–30%), +3% per blue core | Utility |
| Entrench | Below 30% armour, headshots from cover repair 20% (30%), 2s (1s) cooldown | Utility |
| Efficient | Armour kits have 50% (75%) chance not to be consumed; spec kit bonuses +100% | Utility |
| Braced | +45% (50%) weapon handling in cover | Utility |
| Skilled | Skill kills have 25% (30%) chance to reset skill cooldowns | Utility |

### Backpack talents
| Talent | Effect | Group |
|---|---|---|
| Vigilance | +25% TWD; disabled 4s (3s) on taking damage | Total Weapon Damage |
| Composure | +15% TWD in cover | Total Weapon Damage |
| Unstoppable Force | Kills +5% (7%) TWD 15s, 5 stacks; grenade kills add 2 | Total Weapon Damage |
| Companion | Within 5m (10m) of an ally or skill, +15% (20%) TWD | Total Weapon Damage |
| Concussion | Headshots +10% TWD 1.5s (5s with MMR); headshot kills +15% 10s; both can stack to 25% | Total Weapon Damage |
| Wicked | Applying a status → +18% TWD 20s (27s) | Total Weapon Damage |
| Versatile | Swapping between different weapon types: 35% (45%) within 15m for Shotgun/SMG, 35% (45%) beyond 25m for Rifle/MMR, 10% (20%) at 15–25m for LMG/AR; once per 5s per type | **Amplifier** |
| Opportunistic | Shotgun and MMR hits amplify damage taken by 10% (15%) from all sources 5s | **Amplifier** |
| Combined Arms | Shooting an enemy → +25% (30%) total skill damage 3s | Total Skill Damage |
| Tech Support | Skill kills → +25% total skill damage 25s (27s) | Total Skill Damage |
| Shock and Awe | Applying a status → +20% total skill damage and repair 20s (27s) | Total Skill Damage / Repair |
| Safeguard | At full armour, +130% (160%) total skill repair | Total Skill Repair |
| Clutch | Below 15% (20%) armour, crits repair 2.5% of missing armour; on kill for 4s +1s per red core, max 10s | Utility |
| Bloodsucker | Kills stack +10% (12%) bonus armour 10s, max 10 | Utility |
| Adrenaline Rush | Within 10m of an enemy, +20% (23%) bonus armour 5s, 3 stacks, 5s cooldown | Utility |
| Galvanize | Applying Blind/Ensnare/Confuse/Shock → 40% (50%) of your armour as bonus armour to you and allies within 20m (30m) 10s | Utility |
| Leadership | Cover to cover → 15% (20%) of your armour as bonus armour 10s, doubled (tripled) if you end within 10m of an enemy, 10s cooldown | Utility |
| Protector | Shield damaged → +5% you, +15% allies of your armour as bonus armour 3s | Utility |
| Energize | Armour kit → +1 skill tier 15s, overcharge at ST6, 60s (30s) cooldown | Utility |
| Calculated | Kills from cover cut skill cooldowns 10% (15%) | Utility |
| Overclock | You and allies within 7m (15m) of deployed skills gain +25% (30%) reload and −0.2 (0.6) cooldown per second | Utility |
| Creeping Death | Applying a status also applies it within 8m (10m), 15s (10s) cooldown | Utility |

---

## 9. KEY EXOTICS

### Weapons
**Pestilence** (M249) — *Plague of the Outcasts*: hits apply a debuff dealing **100% weapon damage over 10s, stacking to 50**. When an enemy dies with the debuff, the stacks transfer to a nearby enemy within 25m. Stats: 935 RPM, **100-round magazine, no magazine mod slot**, 4.54s empty reload, 48,300 base damage, 35m optimal, 65 innate HSD, burst DPS ~752k, sustain ~441k. Mods: Magazine +10% RoF, Muzzle +10% Accuracy, Underbarrel +10% Stability.
> **Critical interaction:** the Plague debuff is a *debuff*, not a status effect. **Eclipse Protocol does not spread it** — except when an Eclipse kill lands on an enemy already carrying it, in which case it transfers normally on death.

**St. Elmo's Engine** (LVOA-C) — *Actum Est*: hits build stacks; at 100 the next magazine is 100% shock ammo.
**Bullet King** (IWI-NEGEV) — *Bullet Hell*: never needs reloading; every 100 hits replenishes reserve ammo for you and allies.
**Iron Lung** (MG5) — *Ardent*: shooting fills a heat meter equal to 50% of magazine size; at full, rounds ignite.
**Big Alejandro** (M249/MK46) — *Cover Shooter*: every bullet fired in cover +1% weapon damage to 100%, 15s; kills in cover reset the duration.
**Bluescreen** (Stoner LAMG) — *Disruptor Rounds*: marks and stacks to 50.
**Backfire** (MPX) — *Payment in Kind*: +2% CHD per stack to 100, 10s; reload applies a self-bleed.
**Scorpio** (SIX12) — *Septic Shock*: venom stacks — 2 poison, 4 disorient, 6 shock, 9 heavy debuff.
**Capacitor** (PDR) — *Capacitance*: 1.5% skill damage per stack to 40; +7.5% weapon damage per skill tier.
**Chameleon**, **Eagle Bearer**, **The Bighorn**, **Lady Death**, **Ouroboros**, **Nemesis**, **Mantis**, **Regulus**, **Diamondback**, **The Ravenous**, **Sweet Dreams**, **Lullaby**, **Ruthless**, **Merciless**, **The Chatterbox**, **Liberty**, **Dread Edict**, **Shroud**, **Sacrum Imperium**, **Vindicator**, **Doctor Home**, **Bittersweet**, **Oxpecker**, **Pakhan**, **Overlord**, **Strega**, **Tempest**, **Mosquito**, **Busy Little Bee**, **Whiplash**, **Underboss**, **Caduceus**, **Agitator** — full details in the community sheet.

### Gear
**Coyote's Mask** — *Pack Instincts*: bonus by distance of last enemy hit — 0–15m +25% CHD; 15–25m +10% CHC and +10% CHD; 25m+ +25% CHC. Shared with allies; each ally can hold one of each buff type.
**Overdogs** (gloves) — *Weakest Link*: **+30% amplified weapon damage** to the lowest-ranked enemies in combat. The largest amplifier available without spending a chest or backpack slot. Tier 3 is lowest, Tier 1 highest.
**Vile** (mask) — *Toxic Delivery*: status effects also apply a DoT for 10s equal to 50% of your concussion grenade damage, increased by your status effect attributes.
**Memento** (backpack) — trophies grant short-term buffs scaling with core count (Red 5% WD, Blue 10% bonus armour, Yellow 5% skill efficiency) plus +1% WD, +1% skill efficiency, +0.1% armour regen per trophy for 300s, max 30 stacks.
**Ninjabike Messenger Backpack** — *Resourceful*: counts toward any gear set and/or brand set requirement simultaneously.
**Catalyst** (mask) — *Chemical Agent*: status effects dealt or received build Catalysis to 12 stacks, each +2% WD and +2% Status Effects; at max, killing a status-affected enemy grants +25% bonus armour and +20% reload 5s.
**Acosta's Go-Bag**, **Ridgeway's Pride**, **Tardigrade**, **BTSU Datagloves**, **Bloody Knuckles**, **Imperial Dynasty**, **Sawyer's Kneepads**, **Blacklisters**, **Provocator**, **Beacon**, **Waveform**, **Nimble**, **Centurion Scabbard**, **Dodge City**, **Exodus**, **Rugged Gauntlets**, **Harrier Pride**, **Birdie's Quick Fix Pack**, **Nurse's Kneepads**, **Tinkerer**, **Investor** — full details in the community sheet.

---

## 10. WORKED BUILDS

### A. Pestilence red DPS — Legendary and raids
**Four pieces Tipping Scales** (chest *Sustainability*, backpack *Snowball*) + **Coyote's Mask** + **Overdogs**. Six red cores. Weapon: **Pestilence**.

*Why:* Tipping Scales' 2pc 30% magazine size takes Pestilence from 100 to 130 rounds, roughly 8.3 seconds of continuous fire at 935 RPM. That's the whole build — it's long enough to cap the 50-stack Plague debuff *and* hold max Throttle Control stacks, while hiding the punishing 4.54s reload. Throttle Control loses no stacks while an enemy is suppressed, and an LMG suppresses constantly. At 75 stacks with Snowball that's 600% crit hit damage.

*Damage split:* Throttle Control's crit damage powers your **bullets**; red cores power the **debuff**, which scales off weapon damage and does not crit. Both halves matter, which is why a pure crit set would be worse here.

*Attributes:* crit chance to ~60%, then crit damage. Handling is covered by Throttle Control.
*Specialisation:* **Gunner** — Supply Line matters because a 130-round magazine burns reserves fast, and Barrage's rate-of-fire-on-kill compounds. Onslaught's 15% LMG damage is a universal perk available regardless of spec. Note Pestilence has fixed exotic mods, so Firewall's Tactical Short Grip and Demolitionist's Small Laser Pointer are unusable.
*Range:* Pestilence's 35m optimal puts you in Coyote's 25m+ band for the full +25% crit chance, and the 25m debuff transfer radius lines up with clustered adds.

*Alternative:* 4pc **Heartbreaker** trades red cores for four blue and the `(1 + 0.011n)` separate multiplier — more survivable, and pulse from Heartstopper opens up Spotter and Flatline amps. Worth testing for Legendary specifically.

### B. Eclipse Protocol crowd control / mob lockdown — GROUP version (primary)
**Four pieces Eclipse Protocol** in chest, gloves, holster, kneepads (chest = *Proliferation*) + **Vile** mask + **The Courier** backpack (Habsburg Guard named, *Perfect Creeping Death*) with its **core recalibrated Armor → Skill Tier**. Six yellow cores, Skill Tier 6. **Technician** (Banshee + Amped).

*Skills:* Riot Foam Chem Launcher + Banshee Pulse. *Weapons:* Scorpio (poison/disorient/shock breadth) and Fafnir (burn; damage amplified by 50% of your Status Effect bonus, which this build stacks anyway).

*The two spread engines are complementary:* Indirect Transmission requires a **kill** — Eclipse has zero spread at the opening of an engagement, exactly when a room is advancing. Perfect Creeping Death triggers on **application** (10m radius, 10s cooldown), so the first Riot Foam already spreads. Creeping Death opens, Eclipse sustains (no cooldown, 15m, 75% duration refresh). More applications also means more Vile DoT procs, since Vile fires on application.

*What this version gives up:* Symptom Aggravator (backpack slot) and the Electrique 1pc. Symptom Aggravator amplifies only damage **you** deal — in a group where you're the control role and others do the killing, it was boosting the smallest damage contributor. Dropping it for faster, more reliable room-wide control is the right trade *for group play*.

*The Courier specifics:* drops in Landmark Zones; core reroll requires a Skill Tier backpack core banked in the recalibration library (deconstruct any yellow-core backpack in the library first). The core reroll consumes the item's **single** recalibration slot, so farm a copy whose minors are already usable (Status Effects / Skill Haste) — they can never be fixed afterwards. Fallback: regular Creeping Death (8m/15s) rolled onto any yellow-core High-End backpack keeps ST6 without the named farm.

### B2. Solo / self-damage variant
Swap the backpack to **Eclipse backpack (Symptom Aggravator)** and the sixth slot to **1pc Electrique** (10% Status Effects). The 30% all-source amplifier is the largest personal damage term in the build; keep it whenever your own damage matters more than opening-seconds spread.

*Season note (both versions):* Under Pressure's default gauge bonus is Status Effects — free scaling for this archetype — and burn application permanently disables Hostile Modifiers, which this build does incidentally via Fafnir/Banshee-adjacent fire skills.

*Ember Engine:* status-*generation* where Eclipse is status-*propagation*; no spread mechanic of its own, and PvP-gutted but PvE-intact. Eclipse still wins for group lockdown. Ember + Vile + Fafnir is the season's *fire damage* build — a different job.

---

## 11. OPEN QUESTIONS AND THINGS TO VERIFY

**Resolved 28 Aug 2026:**
- ✅ **Core recalibration on named gear** — confirmed. Cores are a recalibratable category, changeable across colours via the library; named items lock only the perfect talent; gear set cores are immutable. See §3 recalibration rules.

**Still open:**
1. **Striker's Risk Management** — the sheet says 0.65% → 0.9% per stack; some third-party sources say 1%. Striker was not in the Y8S3 change list, so the sheet is probably right. At 0.9% and 200 stacks the amp is 2.8×; at 1% it is 3.0×.
2. **Murakami Industries** — not present in the Red Horizon document, so unchanged from Y8S2. Values above are from the sheet and unverified.
3. **Ember Engine core attribute** and multiplier group — still not stated anywhere checked, one day post-patch. Presumed yellow given its bonuses; verify on first drop.
4. **Fafnir's amplifier interaction** — "amplified by 50% of your Status Effect bonus" needs testing to confirm whether it behaves as a true amplifier term.
5. **Brands absent from the PDF** (Alps Summit, Edelweiss, Shiny Monkey, Brazos, Uzina Getica, Yaahl, Providence) — unchanged this season, values from the sheet.
6. **Pestilence debuff snapshotting** — whether debuff damage is calculated at application or on tick is undocumented. Affects how much burst buffs like Throttle Control contribute to it.
7. **Creeping Death spread scope** — the sheet and original talent text say it applies to **all enemies** within radius; at least one secondary source describes "the nearest enemy" (singular). Sheet reading assumed in build B. Ten minutes in the shooting range settles it.
8. **Vile × Creeping Death** — whether statuses applied *by* the spread each trigger Vile's DoT, or only the original application. Should proc (Vile keys off application); untested.
9. **The Courier at the station** — the general recal rules are confirmed, but this specific piece hasn't been checked in-game for shipped quirks (locked attribute variants exist on some named items). Verify before farming.
10. **Weapon stat table** in the community sheet is TU28-era. Use for relative ranking only.

---

## 12. USEFUL EXTERNAL RESOURCES

Build tools: mxswat's Div 2 Builder 2.0 · Buildstation.app · Raucey's Quick DPS Calculator.
Build guides (from the sheet's Hub tab): Raucey's Build Guide Collection · iKia's Build Collection · localdeck's Guides · MrChow's guides on GameFAQs · Raid Builds Compendium (Raucey).
Technical: "Why You Should Run 6 Red Cores" (corruptphoton, TU28) · "A Tier 5+ Escalation Guide" (corruptphoton, TU29) · Multiplicative vs Additive chart · Understanding Headhunter (dien.aka.kim) · Burst vs Sustain DPS Explained (iKia) · NPC Health Pools (dien.aka.kim).
Community: #build-advice on discord.gg/thedivisiongame.
