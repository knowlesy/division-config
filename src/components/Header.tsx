import React from 'react';
import { GitHubUser } from '../lib/github/client';

export type ActiveTab = 'editor' | 'optimizer' | 'comparison' | 'saved' | 'advisor';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  user: GitHubUser | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  comparisonCount: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  user,
  onOpenAuthModal,
  onSignOut,
  comparisonCount
}) => {
  return (
    <header className="w-full flex flex-col bg-shd-surface1 border-b border-shd-border1 sticky top-0 z-40">
      {/* 3px SHD Orange status strip */}
      <div className="w-full bg-shd-orange h-[3px]" />

      <div className="max-w-7xl mx-auto w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center clip-corner bg-shd-orange text-shd-bg font-heading font-bold text-base shadow-sm">
            B
          </div>
          <div>
            <div className="font-heading font-bold tracking-wider text-sm sm:text-base text-shd-textPrimary flex items-center gap-1.5">
              DIVISION CONFIG <span className="text-shd-orange">/ RED HORIZON</span>
            </div>
            <div className="font-mono text-[10px] text-shd-textMonoMuted tracking-wider">
              Y8S3 · TU30 · PATCH 2.34 · BUILD OPTIMISER
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('editor')}
            className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider clip-corner-sm transition-colors border ${
              activeTab === 'editor'
                ? 'bg-shd-orange text-shd-bg border-shd-orange'
                : 'bg-shd-surface2 text-shd-textSecondary border-shd-border2 hover:border-shd-orange/60 hover:text-white'
            }`}
          >
            Loadout Editor
          </button>

          <button
            onClick={() => onSelectTab('optimizer')}
            className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider clip-corner-sm transition-colors border ${
              activeTab === 'optimizer'
                ? 'bg-shd-orange text-shd-bg border-shd-orange'
                : 'bg-shd-surface2 text-shd-textSecondary border-shd-border2 hover:border-shd-orange/60 hover:text-white'
            }`}
          >
            ⚡ Optimizer
          </button>

          <button
            onClick={() => onSelectTab('comparison')}
            className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider clip-corner-sm transition-colors border relative ${
              activeTab === 'comparison'
                ? 'bg-shd-orange text-shd-bg border-shd-orange'
                : 'bg-shd-surface2 text-shd-textSecondary border-shd-border2 hover:border-shd-orange/60 hover:text-white'
            }`}
          >
            Comparison
            {comparisonCount > 0 && (
              <span className="ml-1.5 px-1 py-0.2 bg-shd-surface3 text-shd-orange text-[10px] font-mono rounded">
                {comparisonCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('saved')}
            className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider clip-corner-sm transition-colors border ${
              activeTab === 'saved'
                ? 'bg-shd-orange text-shd-bg border-shd-orange'
                : 'bg-shd-surface2 text-shd-textSecondary border-shd-border2 hover:border-shd-orange/60 hover:text-white'
            }`}
          >
            Saved Builds
          </button>

          <button
            onClick={() => onSelectTab('advisor')}
            className={`px-3 py-1.5 text-xs font-heading font-semibold uppercase tracking-wider clip-corner-sm transition-colors border ${
              activeTab === 'advisor'
                ? 'bg-shd-orange text-shd-bg border-shd-orange'
                : 'bg-shd-surface2 text-shd-textSecondary border-shd-border2 hover:border-shd-orange/60 hover:text-white'
            }`}
          >
            ISAC-B
          </button>
        </nav>

        {/* Right: Auth / GitHub Sync */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-shd-surface2 px-2.5 py-1 border border-shd-border2 clip-corner-sm">
              {user.avatar_url && (
                <img src={user.avatar_url} alt={user.login} className="w-5 h-5 rounded-full border border-shd-orange/60" />
              )}
              <span className="text-xs font-mono text-shd-textSecondary">{user.login}</span>
              <button
                onClick={onSignOut}
                title="Sign out"
                className="text-[10px] font-mono text-shd-textMonoMuted hover:text-rose-400 ml-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 text-xs font-mono border border-shd-border3 hover:border-shd-orange text-shd-textSecondary hover:text-white clip-corner-sm bg-shd-surface2 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
              Connect GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
