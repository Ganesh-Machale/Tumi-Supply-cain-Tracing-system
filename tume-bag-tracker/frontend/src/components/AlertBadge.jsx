import React from 'react';

/**
 * Unread alert count badge for the notification bell.
 */
const AlertBadge = ({ count = 0 }) => {
  if (!count || count <= 0) return null;

  return (
    <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-0.5 bg-cyan-500 text-slate-950 text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default AlertBadge;
