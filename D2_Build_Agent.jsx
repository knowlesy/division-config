import { useState, useEffect, useRef } from "react";

// ============================================================
// EMBEDDED KNOWLEDGE — Y8S3 "Red Horizon" verified dataset (rev 2, 28 Aug 2026)
// [PDF]=verified vs official gear doc  [UBI]=official news post  [SHEET]=community sheet, unverified  [?]=open question
// ============================================================
const KNOWLEDGE = `
DIVISION 2 BUILD DATA — Y8S3 RED HORIZON / TU30 / patch 2.34 (live 27 Aug 2026). Compiled 28 Aug 2026.

== DAMAGE STACKING MODEL (decides everything) ==
Same multiplier group = ADDITIVE (30%+30% -> 1.60x). Different groups = MULTIPLICATIVE (1.30x1.30 -> 1.69x). AMPLIFIERS are NEVER additive with anything, each is its own multiplicative term. One total-weapon-damage talent + one amp beats three TWD talents.
Groups: Weapon Damage | Total Weapon Damage | Crit Chance | Crit Damage | Headshot | Skill Damage | Total Skill Damage | Skill Repair | Status Effects | Rate of Fire | Amplifier | Utility.
Special: Skill Efficiency = +1% of every yellow minor per point. Heartstopper = separate multiplier (1+0.011n, n<=50/100 with chest). Striker's Gamble = AMPLIFIER despite in-game text (1+0.009n with backpack [?0.9 vs 1.0], n<=200 with chest -> 2.8x). Ortiz Heatstroke = AMPLIFIER despite text [PDF]. Hunter's Fury kill stacks = 1.05^n.

== RECALIBRATION RULES (verified 28 Aug 26) ==
ONE recal per item (re-switchable forever). Cores are a recal category, changeable ACROSS colours (Armor->Skill Tier) on High-End/Named/brand pieces if banked in library (deconstruct donor IN the library). Named gear: perfect talent locked, core+minors open. GEAR SET pieces: core FIXED to set colour, set talents non-recalibratable, and carry only ONE minor (brand pieces carry two — hidden cost of 4pc sets). Exotics: fixed rolls, optimise/expertise only.

== COMMUNITY SHEET CORRECTIONS (sheet is otherwise TU30-accurate for gearsets+brandsets) [PDF] ==
Lengmo 1pc = 15% Reload (sheet wrongly 30%). China Light 2pc = 20% Status Effects (not 25%). Electrique 2pc = 20% Hazard Protection (not "Electricity Protection"). 5.11 1pc = 12% Protection from Elites (10% is PvP). Sheet weapon/named/exotic/talent tabs = TU28-era: relative ranking only.

== GEAR SETS (core | 2pc | 3pc | 4pc | chest | backpack | GROUP) ==
Striker's: Red|15% Handling|15% RoF|Striker's Gamble 0.65%/hit to 100|chest ->200 stacks|bp 0.9%/stack [?]|AMPLIFIER ~2.8x max. Decay 1/s<50, 2/s 51-100, 3/s 101-200.
Tipping Scales [PDF]: Red|30% Mag|30% LMG|Throttle Control: stacks to 50, +0.5% handling +5% CHD each, lose 6/s not shooting, NO LOSS while enemy suppressed|chest ->75|bp 5->8% CHD|CRIT DAMAGE group. Max = 600% CHD.
Heartbreaker: Blue|15% AR+15% LMG|15% Handling|Heartstopper: headshot pulses 5s, hits on pulsed = +1% bonus armor +1.1% WD stack, max 50|chest ->100|bp +2% armor/stack|SEPARATE MULT (2.1x max).
Aces & Eights [PDF]: Red|30% MMR+30% Rifle|30% HSD+30% Handling|Dead Man's Hand: 5 cards -> next shot amp 75%|chest ->100%|bp +1 shot|AMPLIFIER.
Breaking Point [PDF]: Red|30% MMR+Rifle|30% HSD+Handling|On Point: hits stack, reload = +2% handling +4% WD/stack 20s|chest 40s|bp 9%|ADDITIVE all WD.
Hotshot [PDF]: Red|30% MMR|30% HSD+30% Handling (moved to 3pc)|Headache: 1st MMR headshot -> next +80%; 2nd +10% armor; 3rd refill; 4th+ all three per consecutive HS kill, miss resets|AMPLIFIER.
Negotiator's Dilemma [PDF]: Red|15% CHC|20% CHD|crits mark 3 (chest 5), crit on marked -> 60% (bp 112%) to others; marked death = +10% CHD stack x10|CHD group.
Ongoing Directive [PDF]: Red|15% Status|30% Reload|kill marked (status-affected) enemy -> Hollow-Point clip amp 40% + bleed, allies half clip|chest 60% self|BULLET AMPLIFIER.
Concentrated Company [PDF]: Red|10% WD|30% Handling|Camaraderie: marks 10s, marked death = stack 3% WD+3% CHD per contributor, max 35|chest 8 marks|bp 6% WD|ADDITIVE WD+CHD.
True Patriot [PDF]: Blue|15% Handling (was ammo)|30% Mag|Red White Blue debuffs every 2s (chest: 1s): Red = enemy takes +15% (bp 30%) AMPLIFIED from ALL sources; White = shooting repairs 2% (bp 5%)/s; Blue = enemy deals -10% (bp -20%). Full Flag: death under all 3 = 5m explosion of total HP+armor (reduced on Named). [?] debuffs may be sub-group limited.
Hunter's Fury: Red|15% SG+15% SMG|20% AoK+50% HoK|+20% amp within 15m; kill = disorient 5m (bp 10m) + 5% WD stack x5|amp + 1.05^n. Close range.
Eclipse Protocol: Yellow|15% Status|15% Haste+30% Hazard|Indirect Transmission: KILL spreads victim's statuses 10m (chest 15m), refresh 50% (75%)|bp Symptom Aggravator: +30% AMP all damage YOU deal to status-affected|UNCHANGED in Y8S3 (yellow sets deferred) [UBI].
Ortiz Exuro [PDF]: Yellow|20% Burn Dur+15% SkillHP|40% Burn Dmg|Incinerator turret|chest: burns chain 10m|bp: +40% AMP to turret-burned, +25% range.
Future Initiative: Yellow|30% Repair|30% Duration+15% Haste|Ground Control: you+allies +15% (chest 25%) total weapon AND skill dmg at FULL ARMOR; ally repair splashes 60% (bp 120%) within 5m|TWD/TSD group.
Hard Wired: Yellow|15% Haste|15% SkillDmg+30% Repair|Feedback Loop: skill use cuts other's CD 30s, +10% (chest 25%) TSD+repair 20s|TSD.
Ember Engine [UBI, NEW]: 2pc 8% Skill Efficiency|3pc 30% Status Effect|4pc Spontaneous Combustion: every status applied = 40% (chest 60%) chance to also Burn; if Burn, +25% Burn dmg (bp +50% dur). PvE only (PvP 8/12%). Farm: Countdown/Summit targeted, season caches. Core attr [?]. No spread mechanic of its own.
Others: Foundry Bulwark (tank, 25%->35% dmg-to-repair), Aegis (DR per targeting enemy), Umbra (CHD+RoF from cover cycling), Virtuoso (range-alternating WD), Tip of the Spear (sig weapons), Rigger (drone/turret), Measured Assembly (destroys enemy skills/mortars in Hive radius — Legendary utility), Cavalier, Refactor, Core Strength, System Corruption (DZ, amp), Ortiz Reficere (healer).

== BRAND SETS Y8S3 (1pc|2pc|3pc) [PDF unless noted] ==
RED: Airaldi 12% MMR|26% HSD|5% DtA. Ceska 8% CHC|24% Shotgun|30% Hazard. Douglas 24% Pistol|20% SkillHP|50% Acc. Fenris 12% AR|32% Mag|50% Stab. Grupo 13% CHD|20% Expl|39% HSD. Imminence 6% WD|48% Pistol|30% SkillHP. Legatus 15% Mag|24% SMG|105% Range. Overlord 12% Rifle|30% Acc|30% Hand. Petrov 12% LMG|15% Hand|50% Ammo. Providence 13% HSD|8% CHC|13% CHD [SHEET]. Royal Works 5% Hand|24% LMG|50% Acc. Sokolov 12% SMG|13% CHD|8% CHC. Unit Alloys 5% RoF|24% AR|50% Mag. Urban Lookout 5% Hand|24% MMR|45% SkillDur. Walker 6% WD|5% DtA|10% DtH. Zwiadowka 15% Mag|24% Rifle|30% Hand.
YELLOW: Alps 18% Repair|30% Dur|30% Haste [SHEET]. China Light 15% Expl|20% Status|30% Haste. Edelweiss 18% Repair|20% Haste|8% Eff [SHEET]. Electrique 10% Status|20% Hazard|8% Eff. Empress 10% SkillHP|13% SkillDmg|8% Eff. Hana-U 10% Haste|13% SkillDmg|18% WD. Murakami 15% Dur|35% Repair|18% SkillDmg [SHEET, untouched Y8S3]. Richter 10% Haste|40% ExplRes|52% Repair. Shiny Monkey 15% Dur|5% Eff|52% Repair [SHEET]. Wyvern 8% SkillDmg|20% Status|45% Dur.
BLUE: 5.11 12% PfE|100% Threat|30% Hazard. Badger 12% Shotgun|10% AoK|15% Armor. Belstone 1% Regen|100% Threat|36% PfE. Brazos 10% Haste|1 Tier|50% Mag [SHEET]. Gila 5% Armor|20% Hazard|2% Regen. Golan 20% ExplRes|1.5% Regen|150% Threat. Habsburg 13% HSD|24% MMR|25% Status. Lengmo 15% Reload|24% LMG|30% Hand. Palisade 10% AoK|24% PfE|1 Tier. Uzina 5% Armor|10% AoK|30% Hazard [SHEET]. Yaahl 10% Hazard|10% WD|40% PulseRes [SHEET].
Y8S3 structural: Health/IncomingRepairs/ShockRes/SwapSpeed REMOVED from brands; Protection from Elites ADDED. No new brands ever again — named pieces on existing brands instead [UBI].

== NEW RED HORIZON CONTENT [UBI] ==
Fafnir (exotic shotgun): Dragon's Breath, 40% burn chance/shot (status DR applies), WD amplified by 50% of your Status Effect bonus [?exact term]. Mods: +15% CHC / +5 rounds / +10% handling. Free season track.
Iron Will (exotic chest): Resolved — next body shot counts as headshot, 2s CD PvE (3s PvP). Requires MMR/Rifle/Pistol. Free track.
Determined REWORK: now = old Perfect Determined (converted-headshot kills don't re-trigger). Chaining moved to Iron Will. Compensation buffs: Hotshot, A&8, Airaldi 26%, Grupo 39%.
Named gear: Trick Shot (Imminence chest, P.Reassigned), Rushdown (Richter chest, Tag Team -12s CD), Melon Baller (Airaldi bp, P.Concussion), Keeper (5.11 bp, P.Protector). Named weapons Teapot/Steamer (P.Boiling Point: first 48% of mag -100% CHC, rest +100%; standard 53%).
Steel & Sons ACR: stability up, 4 stacks, weakpoint destroy = +30% amp 5s.
UNDER PRESSURE (season modifier): Pressure Gauge from kills/headshots/status/group kills. DEFAULT primary bonus = STATUS EFFECTS (free scaling for status builds; passives can swap to SigWD or Hazard). Hostile Modifiers drain Pressure; FIRE is the ONLY permanent counter — fire builds disable them incidentally.

== KEY EXOTICS ==
Pestilence (M249): Plague debuff — 100% weapon dmg over 10s PER STACK, max 50, transfers 25m on death. NOT a status effect: Eclipse does NOT spread it. Debuff scales off weapon damage, does NOT crit. 935rpm, 100 mag (NO mag mod slot), 4.54s reload, 35m optimal, 65 HSD. [?snapshot behaviour]
Bullet King (Negev LMG): never reloads; every 100 hits replenishes group reserve ammo.
Scorpio (SIX12): venom stacks — 2 poison, 4 disorient, 6 shock, 9 heavy.
St Elmo's (LVOA-C): 100 hits -> shock mag. Big Alejandro: +1% WD/bullet in cover to 100. Iron Lung: heat -> ignite rounds. Bluescreen: disrupt stacks. Backfire: +2% CHD/stack to 100, reload self-bleed. Capacitor: skill-damage AR.
Coyote's Mask: 0-15m +25% CHD | 15-25m +10/+10 | 25m+ +25% CHC. Group-shared.
Overdogs (gloves): +30% AMP vs lowest-tier enemies present. Biggest amp outside chest/bp slots.
Vile (mask): every status applied also DoTs 50% of concussion grenade, scaled by Status Effect attributes. Procs on APPLICATION.
Memento, Ninjabike bp (counts as any set piece), Catalyst, BTSU (hive haste; hive detonate = group overcharge at ST6, 120s/ally).
The Courier (Habsburg NAMED bp, Landmark Zones): Perfect Creeping Death — status applied also applies to all enemies within 10m [?some sources say nearest only], 10s CD. Regular version 8m/15s rolls on High-End bps. Core recal Armor->Yellow legal (consumes the ONE recal slot — farm one with good minors).
Fox's Prayer (named kneepads): fixed 8% dmg to targets out of cover; armor core recals to red.

== ATTRIBUTE CAPS ==
Gear core: 15% WD / 170k armor / 1 tier (prototype 22.5%/255k/1.5). Minors: CHC 6, CHD 12, HSD 10, Hand 8, Haste 12, SkillDmg 10, Repair 20, Status 10, Regen 4925, Hazard 10, HP 18935, ExplRes 10. Mods: CHC 6, CHD 12, HSD 10 (mask/bp/chest only, +Improvised). Weapon core 15%; minors CHC 9.5, CHD 10, HSD 10, DtA 6, Reload 12, Mag 12.5, RoF 5, Range 24.
SHD watch max: 10% most, 20% HSD/CHD/Dur/Ammo.

== VERIFIED BUILDS ==
A. PESTILENCE DPS (Legendary/raid): Tipping Scales x4 (chest+bp) + Coyote's + Overdogs. 6 red cores, CHC to ~60 then CHD, Gunner (Supply Line; Onslaught 15% LMG is universal; Firewall grip UNUSABLE — fixed exotic mods). Logic: 130-rd mag (2pc) covers the 4.54s reload + caps Plague 50 + holds Throttle 75. Bullets ~5.5x crit factor beats Heartbreaker's debuff edge (bullet dmg ~17.9 vs 9.9 relative). Fight 25m+ for Coyote 25% CHC. Heartbreaker x4 = survivable alternative, ~half bullet output.
B. CONTROL — GROUP (primary): Eclipse x4 in chest/gloves/holster/knees (chest=Proliferation) + Vile + The Courier (core->yellow). ST6. Technician (Banshee disorient arc + Amped). Riot Foam + Banshee. Scorpio + Fafnir. Logic: Creeping Death spreads on APPLICATION (opening seconds), Eclipse spreads on KILL (sustain, 15m, no CD). Gives up Symptom Aggravator — self-only amp, wrong priority in a group where others do the killing. Bonus: fire application counters season Hostile Modifiers for the group.
B2. CONTROL — SOLO: swap bp to Eclipse (Symptom Aggravator) + 1pc Electrique. Keep the 30% self-amp when your own damage matters.
C. SUPPORT 3-MAN: Future Initiative x4 (chest+bp) + BTSU + 1pc Alps (or Edelweiss for haste). ST6, Technician. Restorer Hive + Reinforcer. Logic: passive +25% TWD+TSD to whole group at full armor, 120% repair splash, BTSU detonate = group overcharge. Requires FULL ARMOR uptime — armor regen, stay back.
D. TRUE PATRIOT DEBUFF (meta, raid/group): TP x4 chest(Waving)+bp(Patriotic)+mask+holster + Overdogs + Fox's Prayer (core->red). Bullet King. Gunner (or Firewall Tactical Link). Logic: Red = enemy-side 30% AMP benefiting EVERY teammate's damage — in a 3-stack with 2 DPS this outscales any personal build; 1s rotation = all 3 flags in ~2s; Blue -20% enemy dmg = mitigation; Full Flag chains adds. Bullet King = multi-target flag uptime without reloads + group ammo. Pestilence variant legit (flags amp Plague, 130 mag) but worse flag uptime. Personal damage modest BY DESIGN — needs competent DPS teammates. [?sub-group limit in raids]

== OPEN QUESTIONS ==
1 Striker bp 0.9 vs 1.0%/stack. 2 Murakami unverified. 3 Ember core attr. 4 Fafnir amp term exact behaviour. 5 Alps/Edelweiss/ShinyMonkey/Brazos/Uzina/Yaahl/Providence = sheet only. 6 Pestilence debuff snapshot timing. 7 Creeping Death all-vs-nearest. 8 Vile proc on Creeping Death spreads. 9 The Courier recal quirks in-game. 10 Weapon stat table TU28-era.
`;

const SYSTEM_PROMPT = `You are ISAC-B, a Division 2 build advisor for one specific player (UK, plays Legendary content and raids in a 3-person group, owns builds A-D below). Answer ONLY from the dataset between <data> tags. It is verified against the official Y8S3 Red Horizon patch (live 27 Aug 2026) and corrects known community-sheet errors.

Rules:
- Ground every number in the dataset. Carry its confidence tags through: mark unverified values [SHEET] and open questions [?]. If the dataset doesn't cover something, say so plainly and give your best general-knowledge answer clearly labelled "outside dataset - verify in game".
- The stacking model decides build questions: same group additive, different groups multiplicative, amplifiers never additive. Always check multiplier groups before comparing talents.
- Be concise and direct. Short paragraphs, no headers unless comparing 3+ options, UK English. Recommend one thing and say why; name the runner-up in one line.
- Never invent item names, values, or mechanics not in the dataset.

<data>${KNOWLEDGE}</data>`;

const QUICK_QUERIES = [
  "What stacks with Striker's Gamble?",
  "Overdogs vs Royal Works 2pc on Pestilence?",
  "Best backpack for my control build?",
  "Which brand pairs with Ember Engine?",
];

export default function BuildAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  // fonts
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
    return () => document.head.removeChild(l);
  }, []);

  // restore history
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("d2agent:history");
        if (r?.value) setMessages(JSON.parse(r.value));
      } catch (e) {
        /* first run or storage unavailable */
      }
      setLoaded(true);
    })();
  }, []);

  // persist history
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("d2agent:history", JSON.stringify(messages.slice(-40)));
      } catch (e) {
        /* non-fatal */
      }
    })();
  }, [messages, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setError(null);
    setInput("");
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setBusy(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (!reply) throw new Error(data.error?.message || "Empty response");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(String(e.message || e));
      setMessages((m) => m.slice(0, -1));
      setInput(q);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setMessages([]);
    setError(null);
    try {
      await window.storage.delete("d2agent:history");
    } catch (e) {
      /* fine */
    }
  };

  const clip = { clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: "#0C0F12",
        color: "#E8EAED",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      {/* status strip */}
      <div className="w-full" style={{ background: "#F26A1B", height: 3 }} />
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#1E242B", background: "#101418" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ ...clip, background: "#F26A1B", color: "#0C0F12", fontFamily: "'Chakra Petch'", fontWeight: 700 }}
          >
            B
          </div>
          <div>
            <div style={{ fontFamily: "'Chakra Petch'", fontWeight: 700, letterSpacing: "0.06em", fontSize: 15 }}>
              ISAC-B <span style={{ color: "#F26A1B" }}>/ BUILD ADVISOR</span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: "#7C8894", letterSpacing: "0.08em" }}>
              Y8S3 RED HORIZON · TU30 · DATASET REV 2 · 28 AUG 26
            </div>
          </div>
        </div>
        <button
          onClick={reset}
          className="text-xs px-3 py-1.5 border hover:bg-white hover:bg-opacity-5"
          style={{ borderColor: "#2A323B", color: "#9AA5B0", fontFamily: "'IBM Plex Mono'" }}
        >
          CLEAR LOG
        </button>
      </header>

      {/* thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="pt-8">
              <div
                style={{
                  fontFamily: "'Chakra Petch'",
                  fontWeight: 600,
                  fontSize: 22,
                  lineHeight: 1.25,
                  color: "#E8EAED",
                }}
              >
                Query the verified <span style={{ color: "#F26A1B" }}>Red Horizon</span> build data.
              </div>
              <p className="mt-2 text-sm" style={{ color: "#8B96A2", maxWidth: 460 }}>
                Grounded in the patch-verified dataset: corrected brand values, multiplier groups, recalibration rules,
                and your four builds (Pestilence, Control, Support, True Patriot). Unverified values are tagged.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="text-left text-sm px-3 py-2.5 border hover:border-orange-500 transition-colors"
                    style={{ ...clip, borderColor: "#242C34", background: "#12171C", color: "#C4CCD4" }}
                  >
                    <span style={{ color: "#F26A1B", fontFamily: "'IBM Plex Mono'", fontSize: 11 }}>▸ </span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={
                  m.role === "user"
                    ? { ...clip, background: "#1D2731", color: "#E8EAED", maxWidth: "85%" }
                    : { ...clip, background: "#12171C", border: "1px solid #242C34", color: "#D6DCE2", maxWidth: "95%" }
                }
              >
                {m.role === "assistant" && (
                  <div
                    className="mb-1.5"
                    style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: "#F26A1B", letterSpacing: "0.12em" }}
                  >
                    ISAC-B
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}

          {busy && (
            <div
              className="px-4 py-3 text-sm inline-block"
              style={{ ...clip, background: "#12171C", border: "1px solid #242C34" }}
            >
              <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "#F26A1B" }}>
                ANALYSING<span className="animate-pulse">▮</span>
              </span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-sm border" style={{ ...clip, borderColor: "#7A3020", background: "#1A1113", color: "#E8A08F" }}>
              Request failed: {error}. Your question is back in the box — press send to retry.
            </div>
          )}
        </div>
      </div>

      {/* input */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "#1E242B", background: "#101418" }}>
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="e.g. Does Killer stack with Strained?"
            className="flex-1 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            style={{ ...clip, background: "#0C0F12", border: "1px solid #2A323B", color: "#E8EAED" }}
          />
          <button
            onClick={() => ask()}
            disabled={busy || !input.trim()}
            className="px-5 py-2.5 text-sm disabled:opacity-40"
            style={{ ...clip, background: "#F26A1B", color: "#0C0F12", fontFamily: "'Chakra Petch'", fontWeight: 700, letterSpacing: "0.05em" }}
          >
            SEND
          </button>
        </div>
        <div
          className="max-w-2xl mx-auto mt-2"
          style={{ fontFamily: "'IBM Plex Mono'", fontSize: 10, color: "#5C6772" }}
        >
          [PDF] patch-verified · [SHEET] community, unverified · [?] open question — see reference file §11
        </div>
      </div>
    </div>
  );
}
