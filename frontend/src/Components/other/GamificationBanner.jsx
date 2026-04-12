import React from 'react';

const GamificationBanner = ({ xp, badges }) => {
  const getNextTierThreshold = (currentXp) => {
    if (currentXp < 200) return 200;
    if (currentXp < 500) return 500;
    if (currentXp < 1000) return 1000;
    if (currentXp < 5000) return 5000;
    return currentXp; // Maxed
  };

  const nextTier = getNextTierThreshold(xp);
  const progressPercent = Math.min((xp / nextTier) * 100, 100).toFixed(0);

  return (
    <div className="w-full mb-6 bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
      
      {/* Dynamic Background Glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-[50px] pointer-events-none" />

      {/* XP Level Section */}
      <div className="flex-1 w-full relative z-10">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent uppercase tracking-wider">
            Current XP: {xp}
          </h3>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Next Tier: {nextTier}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 transition-all duration-1000 shadow-[0_0_15px_rgba(234,179,8,0.5)] relative"
            style={{ width: `${progressPercent}%` }}
          >
             <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-20"></div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="flex flex-col md:items-end w-full md:w-auto relative z-10">
        <h4 className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-3">Unlocked Badges</h4>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, idx) => {
            let colors = "from-gray-600 to-gray-800 text-gray-300"; // Rookie
            if (badge.includes("Bronze")) colors = "from-orange-700 to-amber-900 border-orange-500/50 text-orange-200";
            if (badge.includes("Silver")) colors = "from-slate-300 to-slate-500 border-slate-300/50 text-slate-900";
            if (badge.includes("Gold")) colors = "from-yellow-400 to-amber-600 border-yellow-300/50 text-yellow-900";
            if (badge.includes("Platinum")) colors = "from-cyan-300 via-indigo-400 to-purple-500 border-cyan-300/50 text-white";

            return (
              <span key={idx} className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-br ${colors} border border-white/10 shadow-lg`}>
                {badge}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GamificationBanner;
