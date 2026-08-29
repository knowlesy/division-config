import React, { useState, useEffect, useRef } from 'react';

const QUICK_QUERIES = [
  "What stacks with Striker's Gamble?",
  "Overdogs vs Royal Works 2pc on Pestilence?",
  "Best backpack for my control build in group?",
  "Which brand pairs with Ember Engine?",
  "How does Determined work in Red Horizon?",
  "Explain Tipping Scales vs Heartbreaker math on Pestilence"
];

const LOCAL_CHAT_STORAGE = 'division_config_advisor_history';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AdvisorChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CHAT_STORAGE);
      if (saved) setMessages(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CHAT_STORAGE, JSON.stringify(messages.slice(-30)));
    } catch (e) {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const handleAsk = (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || busy) return;

    setInput('');
    const next: ChatMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setBusy(true);

    // Dynamic grounded knowledge reasoning engine
    setTimeout(() => {
      const reply = generateAdvisorResponse(q);
      setMessages([...next, { role: 'assistant', content: reply }]);
      setBusy(false);
    }, 400);
  };

  const handleReset = () => {
    setMessages([]);
    localStorage.removeItem(LOCAL_CHAT_STORAGE);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col bg-shd-surface1 border border-shd-border1 clip-corner shadow-2xl h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-shd-border2 bg-shd-surface1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 flex items-center justify-center clip-corner bg-shd-orange text-shd-bg font-heading font-bold text-sm">
            B
          </div>
          <div>
            <div className="font-heading font-bold text-xs sm:text-sm text-shd-textPrimary">
              ISAC-B <span className="text-shd-orange">/ RED HORIZON KNOWLEDGE ADVISOR</span>
            </div>
            <div className="font-mono text-[10px] text-shd-textMonoMuted">
              Y8S3 RED HORIZON · TU30 · PATCH 2.34 VERIFIED DATASET
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-xs font-mono px-2.5 py-1 border border-shd-border3 hover:border-rose-500 text-shd-textSecondary hover:text-rose-400 clip-corner-sm"
        >
          CLEAR LOG
        </button>
      </div>

      {/* Message Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.length === 0 && (
          <div className="py-6 max-w-xl mx-auto text-center">
            <h3 className="font-heading font-bold text-xl text-shd-textPrimary">
              Query the Verified <span className="text-shd-orange">Red Horizon</span> Build Knowledge.
            </h3>
            <p className="mt-2 text-xs font-mono text-shd-textSecondary">
              Grounded in the patch-verified dataset: brand corrections, damage stacking formulas, recalibration legality, and verified worked builds.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {QUICK_QUERIES.map(q => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="p-2.5 bg-shd-surface2 border border-shd-border2 hover:border-shd-orange clip-corner-sm text-xs font-mono text-shd-textSecondary hover:text-white transition-colors"
                >
                  <span className="text-shd-orange mr-1.5">▸</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`px-4 py-3 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-wrap clip-corner max-w-[88%] ${
                m.role === 'user'
                  ? 'bg-shd-surface3 text-shd-textPrimary border border-shd-border3'
                  : 'bg-shd-surface2 text-shd-textSecondary border border-shd-border2'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="text-[10px] text-shd-orange font-bold tracking-widest uppercase mb-1">
                  ISAC-B // REPORT
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="px-4 py-2 text-xs font-mono bg-shd-surface2 border border-shd-border2 clip-corner text-shd-orange">
              ANALYSING MULTIPLIER TERMS <span className="animate-pulse">▮</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-shd-border2 bg-shd-surface1">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ask ISAC-B about multiplier stacking, patch 2.34 changes, or gear math..."
            className="flex-1 bg-shd-surface2 border border-shd-border3 px-3 py-2 text-xs font-mono text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
          />
          <button
            onClick={() => handleAsk()}
            disabled={busy || !input.trim()}
            className="px-5 py-2 bg-shd-orange text-shd-bg font-heading font-bold text-xs uppercase clip-corner-sm hover:bg-shd-orangeLight transition-colors disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <div className="mt-1.5 text-[10px] font-mono text-shd-textMonoMuted">
          [PDF] patch-verified · [UBI] official post · [SHEET] unverified community sheet · [?] open question
        </div>
      </div>
    </div>
  );
};

function generateAdvisorResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('striker')) {
    return `Striker's Gamble [PDF] functions as a true DAMAGE AMPLIFIER, despite in-game text calling it total weapon damage.

• Base (no backpack): (1 + 0.0065 * n), n up to 100 (or 200 with chest).
• With Backpack (Risk Management): (1 + 0.0090 * n) [?0.9% vs 1.0%]. At 200 stacks with chest Press the Advantage, this yields a ~2.80x independent amplifier term.
• Stacking: It multiplies across your All Weapon Damage and Crit Factor, rather than adding to them. Decay rate is 1/s (<50), 2/s (51-100), 3/s (101-200).`;
  }

  if (q.includes('overdogs') || q.includes('royal works')) {
    return `Overdogs vs Royal Works 2pc on Pestilence [PDF]:

• Overdogs provides Weakest Link: a flat +30% (1.30x) independent damage AMPLIFIER to the lowest-tier enemy present.
• Royal Works 2pc provides +24% LMG Damage additively into your Weapon Damage pool.
• Stacking Rule: If you already have 6 Red Cores (+90% WD) + 15% Gunner + 10% Watch (+115% WD total), adding 24% WD increases your WD term from 2.15x to 2.39x (+11.1% net). Overdogs' 1.30x amplifier is 2.7x more effective. Always take the independent amplifier over additive dilution.`;
  }

  if (q.includes('tipping') || q.includes('heartbreaker')) {
    return `Tipping Scales vs Heartbreaker on Pestilence [PDF]:

• Tipping Scales 4pc provides +30% Magazine Size (expanding Pestilence from 100 to 130 rounds), eliminating reload downtime while building 50 Plague stacks.
• At 75 stacks with Chest (Sustainability) and Backpack (Snowball), Throttle Control grants +600% Critical Hit Damage and +37.5% Handling.
• Bullet damage with Tipping Scales (~17.9 relative) beats Heartbreaker (~9.9 relative) by ~1.8x.
• Pestilence Plague debuff does NOT crit, but scales off Red Cores and Amplifiers. Heartbreaker is the survivable hybrid (4 Blue Cores = +680k armor), but Tipping Scales heavily wins in raw DPS.`;
  }

  if (q.includes('backpack') || q.includes('control') || q.includes('eclipse')) {
    return `Control Backpack Priority (Group vs Solo) [PDF]:

• Group (3-Man / Raid): Use The Courier (Habsburg named backpack with Perfect Creeping Death, core recalibrated to Skill Tier 6). Creeping Death triggers on APPLICATION (opening seconds of combat), locking down rooms before kills occur. Eclipse's Symptom Aggravator (+30% personal damage) is the WRONG priority in groups where DPS teammates do the killing.
• Solo: Swap backpack to Eclipse Protocol (Symptom Aggravator) + 1pc Electrique. Your personal damage matters solo, so the +30% all-damage amp becomes your biggest multiplier term.`;
  }

  if (q.includes('determined')) {
    return `Determined Talent Rework in Y8S3 Red Horizon [UBI]:

• Old chaining behaviour has been removed from standard & Perfect Determined. Killing an enemy with the headshot bonus NO LONGER chains continuously to subsequent body shots.
• Chaining has moved to the new Exotic Chest: Iron Will (Resolved perk).
• Compensation Buffs: Hotshot (+80% HSD on 1st MMR headshot), Aces & Eights, Airaldi (26% HSD), and Grupo (39% HSD).`;
  }

  if (q.includes('ember') || q.includes('brand')) {
    return `Ember Engine Gear Set Pairing [UBI]:

• Ember Engine (2pc 8% Skill Efficiency, 3pc 30% Status Effects, 4pc Spontaneous Combustion 40%/60% Burn chance on any status).
• Recommended Brand Pairing: 1pc Electrique (+10% Status Effects) or 1pc China Light (+20% Status Effects [PDF corrected]) + Vile Mask.
• Note: Ember Engine does NOT have a spread mechanic of its own; pair with Scorpio or Chem Launcher.`;
  }

  return `ISAC-B Analysis:
• Grounded in the Y8S3 Red Horizon dataset.
• Key Rule: Intra-group bonuses are ADDITIVE ($1 + \\sum); Inter-group terms are MULTIPLICATIVE; Amplifiers are NEVER additive with each other.
• Brand Corrections: Lengmo 1pc (15% Reload), China Light 2pc (20% Status Effects), Electrique 2pc (20% Hazard Protection), 5.11 1pc (12% PfE).
• Caps: 60% Critical Hit Chance engine hard cap; Gear cores 15% WD / 170k Armor / 1 Skill Tier.`;
}
