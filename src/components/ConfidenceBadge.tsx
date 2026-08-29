import React from 'react';

interface Props {
  tag?: string;
  className?: string;
}

export const ConfidenceBadge: React.FC<Props> = ({ tag, className = '' }) => {
  if (!tag) return null;

  let colorClasses = 'border-gray-600 text-gray-400 bg-gray-900/40';
  let title = 'Unspecified confidence';

  if (tag.includes('[PDF]')) {
    colorClasses = 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40';
    title = 'Patch-verified against official Ubisoft gear documentation';
  } else if (tag.includes('[UBI]')) {
    colorClasses = 'border-cyan-500/50 text-cyan-400 bg-cyan-950/40';
    title = 'Official Ubisoft news post / patch notes';
  } else if (tag.includes('[SHEET]')) {
    colorClasses = 'border-amber-500/50 text-amber-400 bg-amber-950/40';
    title = 'Community gear spreadsheet — unverified';
  } else if (tag.includes('[?]')) {
    colorClasses = 'border-rose-500/50 text-rose-400 bg-rose-950/40';
    title = 'Open question / conflicting data — verify in game';
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border clip-corner-sm tracking-wider uppercase ${colorClasses} ${className}`}
    >
      {tag}
    </span>
  );
};
