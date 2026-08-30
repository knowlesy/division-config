import { GearSlot, GearPieceInstance, WeaponInstance, WatchStats, CombatContext } from '../calc/types';

export interface SavedBuild {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  gear: Record<GearSlot, GearPieceInstance>;
  weapon: WeaponInstance;
  secondaryWeapon?: WeaponInstance;
  sidearm?: WeaponInstance;
  watch: WatchStats;
  specialization: string;
  context: CombatContext;
  tags?: string[];
  sha?: string;
}

const LOCAL_STORAGE_KEY = 'division_config_builds';
const AUTH_TOKEN_KEY = 'division_config_gh_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {}
}

export function loadLocalBuilds(): SavedBuild[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLocalBuild(build: SavedBuild): SavedBuild[] {
  const current = loadLocalBuilds();
  const index = current.findIndex(b => b.id === build.id);
  if (index >= 0) {
    current[index] = { ...build, updatedAt: new Date().toISOString() };
  } else {
    current.push({ ...build, updatedAt: new Date().toISOString() });
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {}
  return current;
}

export function deleteLocalBuild(id: string): SavedBuild[] {
  const current = loadLocalBuilds();
  const updated = current.filter(b => b.id !== id);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

/**
 * Format a build into Markdown with YAML Frontmatter for human-readable JSON/Markdown export.
 */
export function formatBuildMarkdown(build: SavedBuild): string {
  const jsonString = JSON.stringify(build, null, 2);
  return `---
title: "${build.name}"
id: "${build.id}"
specialization: "${build.specialization}"
updatedAt: "${build.updatedAt}"
tags: ${JSON.stringify(build.tags || [])}
---

# ${build.name}

${build.description || 'Division 2 optimized build.'}

## Primary Weapon
- **Name**: ${build.weapon?.name || 'None'} (${build.weapon?.category || ''})
- **Talent**: ${build.weapon?.talent || 'Standard'}

## Gear Summary
${Object.entries(build.gear || {})
  .map(([slot, piece]) => `- **${slot.toUpperCase()}**: ${piece.name} (${piece.core?.type || 'Core'})`)
  .join('\n')}

\`\`\`json
${jsonString}
\`\`\`
`;
}

/**
 * Parse build from string (either raw JSON or Markdown containing code block).
 */
export function parseBuildString(content: string): SavedBuild | null {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Export build as base64 URL parameter.
 */
export function exportBuildToUrl(build: SavedBuild): string {
  const str = JSON.stringify(build);
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return `${window.location.origin}${window.location.pathname}?build=${base64}`;
}

/**
 * Import build from base64 URL parameter.
 */
export function importBuildFromUrl(): SavedBuild | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get('build');
    if (!b64) return null;
    const str = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
