import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const DataTable = ({ 
  columns, 
  data = [], 
  loading = false, 
  emptyMessage = 'No records found.',
  pagination = null 
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/55 text-sm text-slate-300">
            {loading ? (
              // Loading Skeleton rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-4.5">
                      <div className="h-4 bg-slate-800/80 rounded w-4/5"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500">
                    <Inbox size={40} className="stroke-[1.2] text-slate-600 animate-bounce" />
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              // Actual Table Rows
              data.map((row, rIdx) => (
                <tr 
                  key={row.id || rIdx} 
                  className="hover:bg-slate-800/25 transition-colors duration-150"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-slate-300 font-medium">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-slate-400 font-medium">
            Page <strong className="text-slate-200">{pagination.page}</strong> of <strong className="text-slate-200">{pagination.totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
