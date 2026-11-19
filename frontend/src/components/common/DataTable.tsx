import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
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
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
        <div className="flex flex-wrap items-center gap-2.5">
          {filterComponent}

          <div className="relative min-w-[220px] max-w-xs flex-1">
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

      {/* Grid Table Body */}
      <div className="overflow-x-auto flex-1">
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
