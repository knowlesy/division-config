import React, { useState } from 'react';
import { GitHubClient, GitHubUser } from '../lib/github/client';
import { setStoredToken } from '../lib/storage/build-storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: GitHubUser, token: string) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onAuthenticated }) => {
  const [patInput, setPatInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerifyPat = async () => {
    const token = patInput.trim();
    if (!token) return;

    setIsVerifying(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const user = await client.getUser();
      // Ensure private repo exists
      await client.getOrCreateBuildsRepo(user.login);

      setStoredToken(token);
      onAuthenticated(user, token);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to authenticate with GitHub token');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-shd-surface1 border border-shd-border2 max-w-lg w-full p-6 clip-corner shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-shd-border1 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-shd-orange font-heading font-bold text-lg">⚙ GITHUB STORAGE SYNC</span>
          </div>
          <button
            onClick={onClose}
            className="text-shd-textMonoMuted hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <p className="text-xs font-mono text-shd-textSecondary leading-relaxed">
          Division Config stores your builds directly in your personal GitHub account.
          When connected, it automatically initializes a <strong>private repository</strong> named <code className="text-shd-orange">my-division-builds</code>. No telemetry, third-party databases, or trackers.
        </p>

        {/* Development PAT Fallback */}
        <div className="flex flex-col gap-2 bg-shd-surface2 p-3.5 border border-shd-border2 clip-corner-sm">
          <label className="text-xs font-heading font-bold text-shd-textPrimary uppercase">
            Connect with Personal Access Token (PAT)
          </label>
          <p className="text-[11px] font-mono text-shd-textMonoMuted">
            Requires fine-grained or classic token with <code className="text-shd-orange">repo</code> scope.
          </p>

          <input
            type="password"
            value={patInput}
            onChange={(e) => setPatInput(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="bg-shd-surface1 border border-shd-border3 p-2 text-xs font-mono text-shd-textPrimary outline-none focus:border-shd-orange clip-corner-sm"
          />

          {error && (
            <div className="text-xs font-mono text-rose-400 bg-rose-950/40 p-2 border border-rose-800 clip-corner-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono border border-shd-border3 text-shd-textSecondary hover:text-white clip-corner-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyPat}
              disabled={isVerifying || !patInput.trim()}
              className="px-4 py-1.5 text-xs font-heading font-bold bg-shd-orange text-shd-bg clip-corner-sm hover:bg-shd-orangeLight transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Connect & Sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
