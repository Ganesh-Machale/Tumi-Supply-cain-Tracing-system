import React from 'react';

const KPICard = ({ title, value, icon: Icon, description, trend, loading }) => {
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl animate-pulse flex items-center justify-between border border-slate-800">
        <div className="space-y-3">
          <div className="h-4 bg-slate-800 rounded w-24"></div>
          <div className="h-8 bg-slate-800 rounded w-32"></div>
          <div className="h-3 bg-slate-800 rounded w-20"></div>
        </div>
        <div className="w-12 h-12 bg-slate-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="glass-card glass-card-hover p-6 rounded-xl flex items-center justify-between relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-300"></div>

      <div className="space-y-1 z-10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-2xl font-black text-slate-100 tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-[11px] text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>

      <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-cyan-400 group-hover:text-slate-950 group-hover:bg-cyan-500 transition-all duration-350 shadow-inner">
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );
};

export default KPICard;
