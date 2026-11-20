import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X, Filter, Check
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
  isAction?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  filterComponent?: React.ReactNode;
  actionComponent?: React.ReactNode;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
  mobileCardRender?: (row: T, idx: number) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filterComponent,
  actionComponent,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  emptyMessage = 'No records found matching criteria.',
  className = '',
  mobileCardRender,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Search Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    if (searchFilter) {
      return data.filter((row) => searchFilter(row, query));
    }

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some((subVal) =>
            String(subVal).toLowerCase().includes(query)
          );
        }
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFilter]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find((c) => c.key === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = col.accessor ? col.accessor(a) : a[sortColumn];
      let bVal = col.accessor ? col.accessor(b) : b[sortColumn];

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Pagination Calculations
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  const startEntry = totalEntries === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(validCurrentPage * pageSize, totalEntries);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Generate page numbers
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) pages.push('...');
      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (validCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, validCurrentPage]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* Top Header Bar: Show Entries & Search/Filters */}
      <div className="p-4 border-b border-slate-150 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        {/* Left: Show Entries Dropdown */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>Entries</span>
        </div>

        {/* Right: Search Input + Custom Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Desktop Filter Component (Inline on md: and up) */}
          {filterComponent && (
            <div className="hidden md:flex items-center gap-2">
              {filterComponent}
            </div>
          )}

          {/* Mobile Filter Button (Screens < 768px) */}
          {filterComponent && (
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filters</span>
            </button>
          )}

          <div className="relative min-w-[170px] sm:min-w-[220px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {actionComponent}
        </div>
      </div>

      {/* Mobile & Tablet Filter Bottom Sheet Drawer */}
      {mobileFilterOpen && (
        <div
          onClick={() => setMobileFilterOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-200 animate-in slide-in-from-bottom duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Filter Records</h3>
                  <p className="text-[11px] text-slate-500">Configure parameters to refine table output</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Body */}
            <div className="space-y-3 py-1">
              <div className="flex flex-col gap-3 [&_select]:w-full [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-xs [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-slate-50 [&_select]:font-semibold">
                {filterComponent}
              </div>
            </div>

            {/* Submit / Apply Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMobileFilterOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#1877f2] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Submit & Show Results</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Desktop & Tablet Large Table View (Hidden on Mobile < 768px - Preserves Desktop 100%) */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`py-3.5 px-4 select-none border-r border-slate-200/60 last:border-r-0 ${
                      col.sortable !== false ? 'cursor-pointer hover:bg-slate-200/70 transition-colors' : ''
                    } ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    } ${col.className || ''}`}
                  >
                    <div
                      className={`inline-flex items-center space-x-1.5 ${
                        col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-slate-100 transition-colors hover:bg-emerald-50/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(row)
                      : col.accessor
                      ? col.accessor(row)
                      : row[col.key];

                    return (
                      <td
                        key={col.key}
                        className={`py-3 px-4 border-r border-slate-200/50 last:border-r-0 ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Responsive Card List (Active on Screens < 768px matching user reference photo) */}
      <div className="md:hidden flex-1 p-3 space-y-3 bg-slate-50/70">
        {paginatedData.length === 0 ? (
          <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          paginatedData.map((row, idx) => {
            if (mobileCardRender) {
              return (
                <div key={row.id || idx}>
                  {mobileCardRender(row, idx)}
                </div>
              );
            }

            // Identify primary column, action column, and intermediate attributes
            const nonActionCols = columns.filter(c =>
              !c.isAction &&
              !c.key.toLowerCase().includes('action') &&
              !c.header.toLowerCase().includes('action')
            );
            const actionCol = columns.find(c =>
              c.isAction ||
              c.key.toLowerCase().includes('action') ||
              c.header.toLowerCase().includes('action')
            ) || (columns.length > 2 && (columns[columns.length - 1].header === '' || columns[columns.length - 1].key === 'actions') ? columns[columns.length - 1] : null);

            const primaryCol = nonActionCols[0] || columns[0];
            const secondaryCol = nonActionCols[1];
            const attributeCols = nonActionCols.slice(secondaryCol ? 2 : 1);

            const primaryContent = primaryCol.render
              ? primaryCol.render(row)
              : primaryCol.accessor
              ? primaryCol.accessor(row)
              : row[primaryCol.key];

            const secondaryContent = secondaryCol
              ? secondaryCol.render
                ? secondaryCol.render(row)
                : secondaryCol.accessor
                ? secondaryCol.accessor(row)
                : row[secondaryCol.key]
              : null;

            return (
              <div
                key={row.id || idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3 transition-all hover:shadow-md hover:border-slate-300 ${
                  onRowClick ? 'cursor-pointer active:scale-[0.99]' : ''
                }`}
              >
                {/* Card Top: Primary Title + Chevron + Subtitle */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                      {primaryContent}
                    </div>
                    {secondaryContent && (
                      <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                        {secondaryContent}
                      </div>
                    )}
                  </div>
                  {onRowClick && (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Card Attributes Grid (2-3 Columns, matching user photo) */}
                {attributeCols.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
                    {attributeCols.map((col) => {
                      const val = col.render
                        ? col.render(row)
                        : col.accessor
                        ? col.accessor(row)
                        : row[col.key];

                      if (val === null || val === undefined || val === '') return null;

                      return (
                        <div key={col.key} className="space-y-0.5 min-w-0">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                            {col.header}
                          </span>
                          <div className="font-semibold text-slate-800 text-[11px] truncate">
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card Bottom: Action Buttons Row (Matching pastel pills in reference photo) */}
                {actionCol && (
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 justify-end">
                    {actionCol.render
                      ? actionCol.render(row)
                      : actionCol.accessor
                      ? actionCol.accessor(row)
                      : row[actionCol.key]}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Footer: "Showing 1 to 10 of 101 Entries" & Pagination */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
        {/* Left Label */}
        <div className="text-xs font-semibold text-slate-600">
          Showing <span className="font-bold text-slate-900">{startEntry}</span> to{' '}
          <span className="font-bold text-slate-900">{endEntry}</span> of{' '}
          <span className="font-bold text-slate-900 font-mono">{totalEntries}</span> Entries
        </div>

        {/* Right Pagination Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(validCurrentPage - 1)}
            disabled={validCurrentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
            Previous
          </button>

          <div className="flex items-center space-x-1 px-1">
            {pageNumbers.map((p, pIdx) =>
              typeof p === 'number' ? (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    validCurrentPage === p
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={`dots-${pIdx}`} className="px-1 text-slate-400 text-xs">
                  {p}
                </span>
              )
            )}
          </div>

          <button
            onClick={() => handlePageChange(validCurrentPage + 1)}
            disabled={validCurrentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
