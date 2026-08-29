# Project Brief: Division 2 Build Optimiser (Static, GitHub-Backed)

**Revision 2** — updated after ingesting the real source files.

> Full context for an AI coding agent. Build the application described below.
> Three files accompany this brief and are referenced throughout:
> - `Division_2_Gear_Spreadsheet.xlsx` — the community data source (4.6 MB, 23 tabs)
> - `D2_Build_Reference_Y8S3.md` — the verified rules and corrections layer
> - `D2_Build_Agent.jsx` — an existing working component that defines the visual language

---

## 1. What we're building

A **static web app**, hosted on GitHub Pages, that lets Division 2 players browse gear and weapons, generate optimised builds against chosen goals, and **save those builds into their own GitHub repository** as JSON and Markdown.

The defining constraint: **there is no backend that we own.** No database, no user accounts, no server-side storage of user data. The app is a front-end onto the user's own GitHub storage.

### The thing that makes this worth building

Most Division build tools either list items or let you fiddle with a loadout. The value here is that we have **a verified damage-stacking model** (`D2_Build_Reference_Y8S3.md` §3). Almost every bad build in this game comes from stacking two bonuses that share a multiplier group and getting additive returns where the player expected multiplicative. An optimiser that models multiplier groups correctly, and *shows its working*, is genuinely useful in a way a spreadsheet isn't.

That model is the core of the product. Get it right before worrying about anything else.

### Non-goals
- No user database, no session storage on our infrastructure.
- No live game API. All data is static, sourced from the spreadsheet and the reference doc.
- No multiplayer, no social feed, no comments.
- Not a DPS simulator. We rank builds against each other; we don't claim absolute in-game numbers (the weapon stat table is TU28-era — see §4).

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Pages (static hosting — our only deployment)    │
│  ├── SPA: catalogue, optimiser, build editor            │
│  └── All optimisation logic runs client-side            │
└───────────────┬─────────────────────────────────────────┘
                │ (1) "Sign in with GitHub"
                ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub authorisation screen — GitHub owns this         │
└───────────────┬─────────────────────────────────────────┘
                │ (2) redirect back with ?code=...
                ▼
┌─────────────────────────────────────────────────────────┐
│  Token-exchange endpoint (serverless, stateless)        │
│  Cloudflare Workers / Netlify / Vercel free tier        │
└───────────────┬─────────────────────────────────────────┘
                │ (3) token → browser only
                ▼
┌─────────────────────────────────────────────────────────┐
│  Browser calls GitHub REST API directly                 │
└───────────────┬─────────────────────────────────────────┘
                │ (4) create repo, commit build files
                ▼
┌─────────────────────────────────────────────────────────┐
│  THE USER'S OWN REPO: `my-division-builds` (private)    │
│  /builds/*.json  /builds/*.md  /builds/index.json       │
└─────────────────────────────────────────────────────────┘
```

### The serverless function
GitHub's OAuth token exchange needs a client secret, which cannot ship in front-end code. This is a **single stateless endpoint**:
- Accepts the temporary `code`, POSTs to `https://github.com/login/oauth/access_token`.
- Returns the token to the browser and immediately forgets it.
- Never writes to disk, never logs the token or username.
- CORS locked to our Pages origin.

Prefer a **GitHub App** over a classic OAuth App: fine-grained per-repository permissions and expiring tokens. Document whichever is chosen.

### Permissions
Minimum only: repository `contents: read & write`, plus repo creation. **No** org access, gists, workflow, or email scopes. State in plain English on the sign-in screen what is requested and why.

---

## 3. Auth, repo bootstrapping, and saving

### First-run repository creation
A first-time user must **never** see GitHub's "Create a new repository" form with its template/README/licence/gitignore options. That form is for humans; we make every choice in code.

1. Check `GET /repos/{owner}/my-division-builds`.
2. If absent, show a small in-app confirmation: *"Create a private repository called `my-division-builds` on your account to store your builds?"* — one button.
3. On confirm, `POST /user/repos` with `name`, `private: true`, `auto_init: true`, a description, and no template/licence/gitignore.
4. Commit a generated `README.md` explaining what the repo is and that it can be deleted at any time.

Offer an advanced toggle for a different repo name or an existing repo. Persist that in `localStorage`, never on a server.

### Saving a build
Each save is a commit via `PUT /repos/{owner}/{repo}/contents/{path}`. Write **two files** so data is both machine-readable and pleasant to read on GitHub:

- `builds/<slug>.json` — canonical structured data.
- `builds/<slug>.md` — rendered summary: title, stat block table, gear list with talents, the multiplier-group breakdown, and notes.

Rules:
- Slug = kebab-cased name + short random suffix.
- Updates need the file's current `sha`. Fetch first; handle 409 by prompting, never silently overwriting.
- Readable commit messages: `Add build: Pestilence Tipping Scales`.
- Maintain `builds/index.json` — a manifest (name, slug, created, updated, tags, headline stats, archetype) so listing costs one request.
- Provide **Export** / **Import** JSON so the app works fully without signing in.

### Signed-out mode
Catalogue, optimiser and build editing must all work **without logging in**, persisting to `localStorage`. Signing in is required only to push to GitHub. Show a discreet `LOCAL ONLY — NOT SYNCED` indicator and prompt to sign in at the point of saving, never before.

---

## 4. The data source — read this before writing the parser

`Division_2_Gear_Spreadsheet.xlsx` is the community sheet (credited to Azurmen, Bend3n, Gingerbeard_x, Maplestruck, Saint Landwalker). It is a *human* spreadsheet: merged cells, sparse category columns, newline-delimited values, symbol-annotated fields, footnotes mixed into data columns. **Do not point pandas at it and hope.**

### Tabs and what to do with them

| Tab | Size | Use |
|---|---|---|
| `Weapons` | 318×18 | **Parse.** Full weapon stat table |
| `Weapons Named + Exotics` | 187×14 | **Parse.** Named/exotic weapons |
| `Weapon Talents` | 75×7 | **Parse.** Talent + perfect variant + multiplier group |
| `Gearsets` | 58×10 | **Parse.** All gear sets |
| `Brandsets` | 38×8 | **Parse.** All brand sets |
| `Gear Named + Exotics` | 130×14 | **Parse.** Named/exotic gear |
| `Gear Talents` | 47×11 | **Parse.** Chest/backpack talents + groups |
| `Attribute Info` | 71×9 | **Parse.** Caps, max rolls, status thresholds |
| `Weapon Mods` | 95×6 | **Parse.** Mod pool, bonuses, penalties, unlock source |
| `Skill List` | 416×14 | **Parse.** Skills and variants per tier |
| `Skill Info` | 53×40 | **Parse.** Per-tier stats, overcharge |
| `Specializations` | 57×12 | **Parse.** Spec trees |
| `Welcome`, `FAQ`, `Hub (Builds)`, `Credits+admin` | — | Ignore for data. Mine `Hub` for guide links only |
| `Sheet32`, `Gearset Counter`, `Exotic Counter`, `Hub.old`, `(Discontinued)Season 2 + Manhun`, `Season 4 (Discontinuted)`, `Skill Info Old` | — | **Ignore entirely.** Dead tabs |

### Known parsing quirks — all verified in the actual file

**1. Gear set names sit on the row *after* their data.** A vertical merged-cell artefact. Row 1 holds Aces & Eights' stats with a blank name; row 2 holds the name `Aces & Eights` with every other cell empty. The parser must pair row `n` (data) with row `n+1` (name), not read them as separate records.

**2. Sparse category columns need forward-filling.** On `Weapons`, column 0 (`ASSAULT RIFLES`, etc.) is populated only 8 times across 318 rows; column 1 (weapon family, e.g. `AK-47`) only on the first variant of each family. Forward-fill both. Same pattern on `Brandsets` column 0 (Armor/Skill/Weapon Damage grouping) and `Gear Named + Exotics` column 0 (slot).

**3. Multi-line cells encode value-and-label pairs.** Gear set 2pc cells read `"30%\nMMR Damage\n\n30%\nRifle Damage"`. Split on blank lines to get bonuses, then on single newline to split magnitude from attribute name. Expect trailing spaces.

**4. `Weapons` columns 15–17 are a *different table*.** Not per-weapon data — a small reference of weapon type → fixed second attribute → innate headshot multiplier, sitting in the same sheet. Rows 10–11 of those columns are footnote prose. Parse separately and discard the prose.

**5. Mod-slot values are symbol-encoded strings**, not numbers: `3`, `4\`, `3!`, `2$#`, `1#!&`. The digit is the slot count; the symbols map to which slot types via a legend marked `**` in the header. Preserve the raw string, extract the leading integer, and resolve symbols against the legend.

**6. Placeholders vary.** `----`, `none`, `-`, empty string and `NaN` all mean absent. Normalise to `null`.

**7. `Skill List` uses `▶` prefixes** on skill names in the quick-links column. Strip.

### The reference document is authoritative over the sheet

`D2_Build_Reference_Y8S3.md` is a verified overlay compiled against the official Ubisoft Red Horizon gear PDF and news post. Where the two disagree, **the reference wins**. It carries confidence markers that must survive into the app's data and UI:

- `[PDF]` verified against the official gear document
- `[UBI]` verified against the official news post
- `[SHEET]` community sheet, unverified
- `[?]` known open question

**Per-tab trust (reference §1):** Gearsets and Brandsets are current TU30. Weapons, Named+Exotics, and Weapon Talents are **TU28-era** — use for *relative* ranking only, never absolute numbers. Attribute Info and Weapon Mods are stable. Skill tabs are TU27.

**Four brand corrections must be applied at build time** (reference §2): Lengmo 1pc is 15% not 30% reload; China Light 2pc is 20% not 25% status effects; Electrique 2pc is 20% Hazard Protection (the sheet's "Electricity Protection" is not a real bonus type); 5.11 Tactical 1pc is 12% not 10% Protection from Elites.

**Red Horizon content is absent from the sheet entirely** (reference §6): the Fafnir and Iron Will exotics, four named gear pieces, the Teapot/Steamer named weapons, the Determined rework, and the Under Pressure seasonal modifier. These come from the reference doc only.

### Pipeline design

```
scripts/
  extract.mjs      xlsx → raw JSON, one file per tab, quirks handled
  overlay.mjs      apply reference-doc corrections + additions, attach confidence tags
  validate.mjs     schema + sanity checks, fails loudly
  build-data.mjs   orchestrates the three above
```

Requirements:
- Rerunnable with one command when the sheet updates.
- Emit `data/meta.json` with source file hash, patch version (`Y8S3 / TU30 / 2.34`), and generation timestamp.
- Emit `data/schema.md` documenting every field, type, unit and source column.
- Corrections live in a **separate, readable `data/corrections.json`**, not buried in code, so a new patch is a data edit rather than a code change.
- `validate.mjs` must fail the build on: unmapped multiplier group, gear set with fewer than 4 bonus entries, orphaned talent reference, or any numeric field that parsed to `NaN`.

### Output shape

```
/data/weapons.json          /data/gear-sets.json
/data/weapons-named.json    /data/brand-sets.json
/data/gear-named.json       /data/talents-weapon.json
/data/talents-gear.json     /data/mods-weapon.json
/data/skills.json           /data/specializations.json
/data/attributes.json       /data/multiplier-groups.json
/data/corrections.json      /data/meta.json
```

---

## 5. Domain model

### Multiplier groups — the heart of it

Every damage-relevant bonus carries a group. Same group **adds**; different groups **multiply**; amplifiers are **never** additive with anything, including other amplifiers.

```
Weapon Damage · Total Weapon Damage · Critical Hit Chance · Critical Hit Damage
Headshot Damage · Skill Damage · Total Skill Damage · Skill Repair
Status Effects · Rate of Fire · Amplifier (never additive) · Utility (no damage)
```

Model this as a first-class type. Every bonus is `{ value, group, condition }`. The calculator sums within group, then multiplies across groups, then multiplies each amplifier as its own term.

### Special cases that break the simple model

These are individually implemented exceptions (reference §3). Give each its own tested function:

- **Skill Efficiency** — grants +1% of *every* yellow minor per point. Note: haste displays at 2× but tests as 1× in real cooldowns.
- **Expertise** — weapon expertise additive with weapon damage; skill expertise additive with skill damage; armour additive with *base* armour. Achilles Pulse is the exception and acts as an amplifier.
- **Heartbreaker's Heartstopper** — separate multiplier `(1 + 0.011n)`, n ≤ 50, or 100 with chest.
- **Striker's Gamble** — an **amplifier** despite in-game text saying "total weapon damage": `(1 + 0.0065n)` base, `(1 + 0.009n)` with backpack, n ≤ 100, or 200 with chest. Value flagged `[?]`.
- **Ortiz Exuro's Heatstroke** — an amplifier despite the text calling it increased weapon damage.
- **Hunter's Fury** — on-kill stacks are self-multiplicative: `1.05^n`, n = 0–5.
- **Fafnir** — weapon damage amplified by 50% of your Status Effect bonus. Exact term behaviour is `[?]`.

Any bonus whose in-game text disagrees with its real group **must** be surfaced in the UI with a note. That mismatch is exactly the trap the tool exists to prevent.

### Itemisation constraints — these define the search space

The optimiser is only correct if it respects these (reference §3):

- **One recalibration per item** — one stat *or* one talent, re-switchable forever after. Spending it on the core means the minors on that piece are permanently as-dropped.
- **Cores are recalibratable across colours** (Armor → Skill Tier) on High-End, Named and brand pieces, provided that core is banked in the library.
- **Named gear:** perfect talent locked; core and minors open.
- **Gear set pieces:** core is **fixed** to the set's colour and can never change. Set chest/backpack talents cannot be recalibrated.
- **Gear set pieces carry only ONE minor attribute** where brand pieces carry two. This is a hidden attribute-budget cost of every 4pc set and **must** appear in comparisons — it is the single most commonly missed trade-off.
- **Exotics:** fixed rolls, not recalibratable.
- **Mod slots** exist only on masks, backpacks and chests — unless a piece is Improvised, which always grants one.

### Attribute caps

Hard-cap everything at the values in reference §7. Gear core: Armor 170,000 · Weapon Damage 15% · Skill Tier 1 (prototype variants 255,001 / 22.5% / 1.5). Offensive minors: Handling 8% · CHC 6% · CHD 12% · HSD 10%. Skill minors: Haste 12% · Skill Damage 10% · Repair 20% · Status Effects 10%. Weapon minors and SHD watch maxima likewise. A build that exceeds a cap is invalid, not merely suboptimal — reject it in `validate` and grey it out in the UI.

Also model **status immunity thresholds** (Pulse 100 · Disrupt 95.8 · Bleed/Disorient/Ensnare 93.8 · Burn 91.4 · Blind/Deaf 91.0 · Poison 89.2 · Shock 86.0) — hitting a threshold exactly is a build goal in itself and deserves a dedicated optimiser objective.

### Build object

```json
{
  "schemaVersion": 1,
  "id": "pestilence-tipping-scales-a7f3",
  "name": "Pestilence — Tipping Scales",
  "patch": "Y8S3 / TU30 / 2.34",
  "createdAt": "2026-08-29T10:00:00Z",
  "updatedAt": "2026-08-29T10:00:00Z",
  "tags": ["PvE", "DPS", "LMG", "Legendary"],
  "archetype": "red-dps",
  "notes": "Markdown allowed.",
  "loadout": {
    "gear": {
      "mask":     { "item": "Coyote's Mask", "kind": "exotic" },
      "backpack": { "item": "Tipping Scales", "kind": "gear-set", "talent": "Snowball",
                    "core": "Weapon Damage", "minors": ["Critical Hit Damage"], "mods": [] },
      "chest": {}, "gloves": {}, "holster": {}, "kneepads": {}
    },
    "weapons": { "primary": {}, "secondary": {}, "sidearm": {} },
    "skills": [], "specialisation": "Gunner", "watch": {}
  },
  "computed": {
    "weaponDamage": 0, "armour": 0, "skillTier": 0,
    "critChance": 0, "critDamage": 0, "headshotDamage": 0,
    "activeSetBonuses": [],
    "groupBreakdown": { "Weapon Damage": 0.45, "Critical Hit Damage": 6.0, "Amplifier": [1.3, 1.25] },
    "warnings": ["Two bonuses share the Critical Hit Damage group — diminishing returns"],
    "confidence": ["Striker backpack value is [?] — 0.9% assumed"]
  }
}
```

`computed` is cached for listing but **always recalculated on load** from the loadout against the current catalogue version, so a data update never leaves stale numbers on screen.

---

## 6. The optimiser

Runs entirely client-side, in a **Web Worker**. Deterministic and explainable — the user must always see *why*.

### Objectives
Presets, each mapping to a scoring function: Max Weapon Damage · Max Sustained DPS · Max Survivability · Max Skill Tier / skill damage · Max Status Effects · Crit-focused · Hit a status immunity threshold · Balanced. Plus a custom mode with editable per-attribute weights.

### Constraints
Required gear set or brand · locked slots (pin gear you already own) · minimum armour / skill tier · weapon class · PvE vs PvP · exotic budget (many builds allow only one) · solo vs group.

The **solo/group distinction genuinely changes the answer** and should be a first-class toggle, not a note. Reference §10 build B versus B2 is exactly this: in a group where teammates do the killing, a self-only amplifier like Symptom Aggravator is boosting the smallest damage contributor and should be dropped; solo, it's the largest personal term in the build.

### Search
Full brute force is too large. Use:
1. A scoring function built directly on the multiplier-group model.
2. Beam search across slots, seeded by set-bonus thresholds (2pc/3pc/4pc breakpoints are the natural branch points).
3. A local-improvement pass — single-item swaps, re-score, keep improvements.
4. Respect the one-recalibration rule and the gear-set core lock while generating candidates. A candidate that assumes an illegal roll is worse than useless.

Target: full six-slot search in under ~3s on a mid-range laptop, with progress reported to the UI.

### Output
A ranked list of 10–20 candidates. Each shows:
- Score, and a **breakdown by multiplier group** — the whole point.
- Which set bonuses are active and at what threshold.
- A diff against the user's currently equipped loadout.
- **Warnings**: shared multiplier groups, capped attributes, wasted recalibrations, the gear-set one-minor cost.
- **Confidence flags** inherited from the data (`[SHEET]`, `[?]`), so a recommendation resting on an unverified value says so.

That last point matters. The reference doc has ten open questions (§11) — Striker's per-stack value, Creeping Death's radius scope, Pestilence debuff snapshotting. A tool that quietly presents uncertain numbers as fact is worse than one that shows its seams.

---

## 7. Visual design

**A working reference implementation already exists: `D2_Build_Agent.jsx`. Match it.** The tokens below are extracted from that file — use them exactly rather than inventing a new palette.

### Intent
A sleek, serious, near-future tactical interface — the kind of screen you see in a modern sci-fi or spec-ops film. It should *read* as intense and high-stakes at a glance while actually being a calm, obvious UI. Style is a veneer over genuine clarity and must never cost usability.

Cold, precise, quiet. Dark room, glowing panel. Restraint over decoration. Mission-control readout, not videogame menu. Nothing bounces, nothing sparkles, nothing is rounded and friendly.

### Palette (from the reference implementation)

```css
--bg-deep:      #0C0F12;   /* page */
--bg-panel:     #101418;   /* panels, input bar */
--bg-raised:    #12171C;   /* cards, message bubbles */
--border:       #1E242B;   /* hairline dividers */
--border-mid:   #242C34;
--border-hi:    #2A323B;   /* interactive borders */
--accent:       #F26A1B;   /* SHD orange — the ONLY accent */
--text-hi:      #E8EAED;
--text:         #D6DCE2;
--text-mid:     #9AA5B0;
--text-low:     #7C8894;
--text-faint:   #5C6772;
--err-bg:       #1A1113;
--err-border:   #7A3020;
--err-text:     #E8A08F;
```

The accent is used **sparingly**: active state, primary action, the single most important number on screen, and the 3px rule along the top of the page. Never as a fill for large areas.

Add semantic colours only for real meaning — upgrade over current gear, downgrade, constraint violation. Derive them so they sit in the same cold register; do not import a generic green/red.

### Typography (already loaded in the reference)

- **Chakra Petch** 500/600/700 — headings, labels, buttons. Uppercase, `letter-spacing: 0.05–0.08em`, small sizes. Labels read as field designations.
- **IBM Plex Mono** 400/500 — all numbers, stats, identifiers, status lines, timestamps. Everything numeric aligns in columns and reads as instrumentation.
- **IBM Plex Sans** 400/500/600 — body copy, descriptions, user notes.

**Self-host these**, do not load from Google's CDN (see §8).

### The corner-cut motif

The reference uses a chamfered clip-path as its signature shape:

```js
clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
```

Top-left and bottom-right corners cut. Apply to panels, primary buttons and cards. **Sparingly** — it loses all impact if every box has it. Reserve it for the primary panel, primary actions and build cards.

### Layout and motion
- Grid-driven, generous gutters, strong alignment. Everything on a line.
- Panels defined by hairline borders, not shadows.
- Motion is fast and mechanical: 120–180ms, ease-out, small translations and opacity. Numbers may count up briefly on recalculation. Nothing bouncy.
- Loading states as terse status lines — `ANALYSING▮`, `CALCULATING · 2,481 COMBINATIONS` — not spinners. The reference uses a pulsing block character; keep that.
- Optional, off by default: a very subtle vignette. Dismissible, never at the cost of legibility.

### Copy tone
Terse, technical, neutral. `LOADOUT` · `ATTRIBUTES` · `OPTIMISE` · `COMMIT TO REPOSITORY` · `MULTIPLIER GROUPS`. Avoid actual combat language — no "deploy", "engage", "strike". The register is *instrumentation*, not warfare. UK English throughout. Never jokey.

### Non-negotiables
- Fully responsive; the stat comparison must work on a phone.
- Keyboard navigable, visible focus rings, correct ARIA on custom controls.
- WCAG AA contrast. If a colour fails, the colour changes, not the standard. Note `#F26A1B` on `#0C0F12` passes for large text but **check every usage at small sizes** — the reference uses it at 10–11px in places and that needs verifying.
- Respect `prefers-reduced-motion` — disable all animation and any overlay texture.
- No heavy component library. This is a static site.

---

## 8. Stack and layout

- **Vite + React + TypeScript**.
- **Tailwind** with the palette above as a customised theme, or CSS modules with custom properties. Define tokens once.
- **No** UI kit that imposes its own look.
- GitHub API via `fetch` behind a thin typed wrapper.
- Optimiser as pure functions, fully unit tested, no DOM dependencies.
- Deploy via GitHub Actions to Pages on push to `main`.

```
src/
  components/
  lib/
    github.ts              auth + contents API
    calc/
      multipliers.ts       group model — the core
      special-cases.ts     Heartstopper, Striker, Hunter's Fury, etc.
      caps.ts              attribute ceilings
      constraints.ts       recalibration + set-core legality
    optimiser/
      score.ts  search.ts  worker.ts
    builds.ts              serialise, deserialise, markdown render
  styles/tokens.css
data/                      generated JSON (committed)
scripts/                   extract, overlay, validate, build-data
functions/token-exchange/
public/fonts/              self-hosted Chakra Petch + IBM Plex
.github/workflows/deploy.yml
README.md  PRIVACY.md
```

---

## 9. Trust and privacy

Product requirements, not nice-to-haves. The proposition is "your data stays yours".

- `PRIVACY.md`, linked in the footer, in plain English: what's requested, what's stored, where it lives, how to revoke.
- Token in memory or `sessionStorage` — **never** `localStorage`, never a cookie sent anywhere.
- In-app **Sign out** clears the token; link directly to GitHub's application settings for revocation.
- No analytics, no third-party scripts. **Self-host fonts** — the reference implementation currently pulls from Google Fonts, which logs requests; change this.
- CSP permitting only our origin, `api.github.com`, and the token endpoint.
- The serverless function's source lives in the repo so "we don't store anything" is auditable.

### Attribution
The spreadsheet is community work. Credit **Azurmen, Bend3n, Gingerbeard_x, Maplestruck and Saint Landwalker** visibly — an About page and a line in the footer, with a link to the sheet and to `#build-advice` on the Division 2 Discord. Show the patch version and data generation date in the footer so users know how fresh the data is.

---

## 10. Optional companion: the advisor

`D2_Build_Agent.jsx` is a working chat advisor ("ISAC-B") that answers build questions from an embedded knowledge string via the Anthropic API. It is **out of scope for v1** but the app should not preclude it.

If it's later folded in: the embedded `KNOWLEDGE` string should be **generated from `/data/`** rather than hand-maintained, so the advisor and the optimiser can never disagree. Keep its existing system-prompt discipline — ground every number in the dataset, carry confidence tags through, never invent item names or values, recommend one thing and name the runner-up in a line.

---

## 11. Acceptance criteria

1. A signed-out visitor can browse the catalogue, build a loadout, run the optimiser, and export JSON.
2. Signing in is one click and one GitHub consent screen. The user never sees GitHub's repository creation form.
3. First save offers to create a private repo, creates it fully configured via API, and commits.
4. Subsequent saves commit cleanly, update `index.json`, and handle sha conflicts gracefully.
5. Builds are listed, loadable, editable and deletable; delete removes both files and updates the manifest.
6. The `.md` file renders attractively in GitHub's file viewer.
7. **The multiplier-group model is correct**, unit tested against every worked build in reference §10, and its output is visible to the user as a breakdown.
8. Every value traceable to `[SHEET]` or `[?]` is visibly flagged wherever it influences a recommendation.
9. The four brand corrections are applied and the Red Horizon additions present.
10. Attribute caps and recalibration rules are enforced — illegal builds cannot be generated or saved.
11. Full six-slot optimisation completes in ~3s without freezing the UI.
12. `npm run build:data` regenerates everything from an updated spreadsheet.
13. Lighthouse: accessibility ≥ 95, performance ≥ 90.
14. It looks like `D2_Build_Agent.jsx` and is still completely obvious to a first-time user.

---

## 12. Build order

1. **Data pipeline first.** `extract` → `overlay` → `validate`. Nothing else is real until the data is trustworthy. Verify by reproducing the four brand corrections and spot-checking three gear sets against reference §4.
2. **The calculator.** Multiplier groups, special cases, caps, constraints. Pure functions, heavily tested. Validate against the four worked builds in reference §10 — if the model can't explain why Tipping Scales beats Heartbreaker on Pestilence, it's wrong.
3. Design tokens and static shell matching `D2_Build_Agent.jsx`.
4. Catalogue browsing, filtering, manual loadout building with live stat computation and group breakdown.
5. Optimiser in a Web Worker.
6. Local persistence, export, import.
7. GitHub App registration, token-exchange function, sign-in.
8. Repo bootstrapping, commit/save/list/delete, markdown rendering.
9. `PRIVACY.md`, attribution, accessibility pass, polish.

---

## 13. Open questions to carry into the build

These come from reference §11 and are **not** blockers — they are values the app should mark as uncertain rather than resolve:

1. Striker's Risk Management — 0.9% or 1.0% per stack. At 200 stacks that's 2.8× versus 3.0×.
2. Murakami Industries — unverified, unchanged since Y8S2.
3. Ember Engine's core attribute and multiplier group — presumed yellow, unconfirmed.
4. Fafnir's amplifier interaction — whether it behaves as a true amplifier term.
5. Brands absent from the official PDF (Alps Summit, Edelweiss, Shiny Monkey, Brazos, Uzina Getica, Yaahl, Providence) — sheet values only.
6. Pestilence debuff snapshotting — application versus tick.
7. Creeping Death — all enemies in radius, or nearest only.
8. Vile × Creeping Death — whether spread statuses each trigger the DoT.
9. The weapon stat table is TU28-era throughout.

Surface all of these on a "Known uncertainties" page and inline wherever they affect a result.

---

*Ask before assuming anything not covered here. The spreadsheet quirks in §4 are verified against the actual file — trust them over what a naive read of the sheet suggests.*
