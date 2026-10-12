"use client";

import { ReactNode } from "react";
import { Search, RotateCcw, Download, Calendar, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface FilterOption {
  label: string;
  value: string;
}

interface ReportFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  branches?: Array<{ id: string; name: string }>;
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;
  statusOptions?: FilterOption[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  dateFrom?: string;
  onDateFromChange?: (d: string) => void;
  dateTo?: string;
  onDateToChange?: (d: string) => void;
  secondarySelect?: {
    placeholder?: string;
    options: FilterOption[];
    value: string;
    onChange: (val: string) => void;
  };
  thirdSelect?: {
    placeholder?: string;
    options: FilterOption[];
    value: string;
    onChange: (val: string) => void;
  };
  sortOptions?: FilterOption[];
  selectedSort?: string;
  onSortChange?: (sort: string) => void;
  onReset: () => void;
  onExport?: () => void;
  exportLabel?: string;
  children?: ReactNode;
}

export function ReportFilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search ID, Customer, Phone...",
  branches,
  selectedBranch,
  onBranchChange,
  statusOptions,
  selectedStatus,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  secondarySelect,
  thirdSelect,
  sortOptions,
  selectedSort,
  onSortChange,
  onReset,
  onExport,
  exportLabel = "Export Excel",
  children,
}: ReportFilterBarProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Branch Filter */}
        {branches && onBranchChange && (
          <div className="w-full sm:w-auto min-w-[160px]">
            <select
              value={selectedBranch || "all"}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Outlets / Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {statusOptions && onStatusChange && (
          <div className="w-full sm:w-auto min-w-[150px]">
            <select
              value={selectedStatus || "all"}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Secondary Select (Category / Wallet / Due Range) */}
        {secondarySelect && (
          <div className="w-full sm:w-auto min-w-[150px]">
            <select
              value={secondarySelect.value || "all"}
              onChange={(e) => secondarySelect.onChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">
                {secondarySelect.placeholder || "All Categories"}
              </option>
              {secondarySelect.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Third Select (Brand / Quality / Type) */}
        {thirdSelect && (
          <div className="w-full sm:w-auto min-w-[140px]">
            <select
              value={thirdSelect.value || "all"}
              onChange={(e) => thirdSelect.onChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">
                {thirdSelect.placeholder || "All Options"}
              </option>
              {thirdSelect.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date From & Date To */}
        {onDateFromChange && onDateToChange && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                type="date"
                value={dateFrom || ""}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="h-10 text-xs w-[135px]"
                title="Start Date"
              />
            </div>
            <span className="text-muted-foreground text-xs">to</span>
            <div className="relative">
              <Input
                type="date"
                value={dateTo || ""}
                onChange={(e) => onDateToChange(e.target.value)}
                className="h-10 text-xs w-[135px]"
                title="End Date"
              />
            </div>
          </div>
        )}

        {/* Sort Select */}
        {sortOptions && onSortChange && (
          <div className="w-full sm:w-auto min-w-[150px]">
            <select
              value={selectedSort || "default"}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="default">Sort: Default</option>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Extra Slots */}
        {children}

        {/* Action Buttons: Reset & Export */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onReset}
            title="Reset Filters"
            className="h-10 px-3 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 text-sm gap-1.5 font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors shrink-0 shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>{exportLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
