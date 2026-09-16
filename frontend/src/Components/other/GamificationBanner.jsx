import React from 'react';

const GamificationBanner = ({ xp, badges }) => {
  const getNextTierThreshold = (currentXp) => {
    if (currentXp < 200) return 200;
    if (currentXp < 500) return 500;
    if (currentXp < 1000) return 1000;
    if (currentXp < 5000) return 5000;
    return currentXp;
  };

  const nextTier = getNextTierThreshold(xp);
  const progressPercent = Math.min((xp / nextTier) * 100, 100).toFixed(0);

  return (
    <div className="w-full mb-6 bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-6">
      <div className="flex-1 w-full">
        <div className="flex justify-between items-baseline mb-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Contribution Experience: {xp} XP
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              ({progressPercent}% to next milestone)
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">Next Tier: {nextTier} XP</span>
        </div>
        
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
          <div 
            className="h-full bg-zinc-200 transition-all duration-700 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col md:items-end w-full md:w-auto">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">Unlocked Milestones</span>
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge, idx) => (
            <span key={idx} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800 border border-zinc-700/80 text-zinc-300">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationBanner;
