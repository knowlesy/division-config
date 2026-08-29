# Changelog

All notable changes to **Division Config** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-29

### Added
- **Data Pipeline**: Automated extraction, verification, and JSON compilation for 12 spreadsheet tabs and official Year 8 Season 3 "Red Horizon" (TU30 / Patch 2.34) patch content.
- **Pure Calculator Domain**: Exact mathematical multiplier group engine supporting intra-group additive stacking, cross-group multiplication, independent amplifiers, and hard caps (60% CHC cap, 10 status immunities).
- **Interactive Loadout Editor**: Full 6-slot gear editor and 3-slot weapon editor with real-time recalibration tracking, 1-minor gear set budget warnings, and mod slot support.
- **Real-Time Stats & Stacking Tree**: Live display of Expected Bullet Hit, Crit Hit, Headshot Hit, Burst DPS, Sustained DPS, Total Armor, Skill Tier, and Pestilence Plague tick damage.
- **Constraint-Based Build Optimizer**: Combinatorial candidate search and ranking against primary objectives (Sustained DPS, Burst DPS, Bullet Hit, Plague DoT, Status Duration, Armor/DPS balance) with plain-English trade-off explanations.
- **Side-by-Side Comparison Matrix**: Direct delta comparison view showing the mathematical impact of gear and talent changes.
- **ISAC-B Knowledge Advisor**: Grounded build mechanics and tactical query engine for Year 8 Season 3 / TU30 rules.
- **Zero-Telemetry Cloud Sync**: Direct GitHub integration saving user builds to a private repository (`my-division-builds`) with local development Personal Access Token fallback.
- **Continuous Integration & Deployment**: GitHub Actions workflow (`deploy.yml`) for automated testing and deployment to GitHub Pages.
