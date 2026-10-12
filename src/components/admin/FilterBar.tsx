"use client";

import { useEffect, useState } from "react";
import { FilterConfig } from "@/types/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onSearchChange?: (value: string) => void;
  onFilterChange?: (key: string, value: unknown) => void;
  onReset?: () => void;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = "Search...",
  filters = [],
  onSearchChange,
  onFilterChange,
  onReset,
  className,
}: FilterBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  const handleFilterChange = (key: string, value: unknown) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);
    onFilterChange?.(key, value);
  };

  const handleReset = () => {
    setSearchValue("");
    setFilterValues({});
    onReset?.();
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3", className)}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 h-10 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-lg"
        />
      </div>

      {/* Dynamic Filters */}
      {filters.map((filter) => {
        if (filter.type === "select") {
          return (
            <div key={filter.key} className="min-w-[140px]">
              <Select
                value={(filterValues[filter.key] as string) || ""}
                onValueChange={(val) => handleFilterChange(filter.key, val === "all" ? undefined : val)}
              >
                <SelectTrigger className="h-10 bg-white border-slate-200 text-slate-600 rounded-lg whitespace-nowrap">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (filter.type === "dateRange") {
          const dateRange = filterValues[filter.key] as DateRange | undefined;
          return (
            <div key={filter.key}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 border-slate-200 text-slate-600 rounded-lg font-normal justify-start text-left",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>{filter.label}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => handleFilterChange(filter.key, range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        }
        return null;
      })}

      {/* Reset Button */}
      {(searchValue || Object.keys(filterValues).length > 0) && (
        <Button
          variant="ghost"
          onClick={handleReset}
          className="h-10 text-slate-500 hover:text-slate-800 ml-auto flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
