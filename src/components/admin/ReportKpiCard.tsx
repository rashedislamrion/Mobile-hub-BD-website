"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type KpiColorTint =
  | "blue"
  | "green"
  | "emerald"
  | "red"
  | "rose"
  | "amber"
  | "yellow"
  | "purple"
  | "violet"
  | "cyan"
  | "slate";

interface ReportKpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorTint?: KpiColorTint;
  subValue?: string | ReactNode;
  className?: string;
}

const colorStyles: Record<
  KpiColorTint,
  {
    iconBg: string;
    iconColor: string;
    border: string;
    bgHover?: string;
  }
> = {
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-950/80",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100/80 dark:border-emerald-900/30",
  },
  green: {
    iconBg: "bg-green-100 dark:bg-green-950/80",
    iconColor: "text-green-600 dark:text-green-400",
    border: "border-green-100/80 dark:border-green-900/30",
  },
  blue: {
    iconBg: "bg-blue-100 dark:bg-blue-950/80",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100/80 dark:border-blue-900/30",
  },
  purple: {
    iconBg: "bg-purple-100 dark:bg-purple-950/80",
    iconColor: "text-purple-600 dark:text-purple-400",
    border: "border-purple-100/80 dark:border-purple-900/30",
  },
  violet: {
    iconBg: "bg-violet-100 dark:bg-violet-950/80",
    iconColor: "text-violet-600 dark:text-violet-400",
    border: "border-violet-100/80 dark:border-violet-900/30",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-950/80",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100/80 dark:border-amber-900/30",
  },
  yellow: {
    iconBg: "bg-yellow-100 dark:bg-yellow-950/80",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-100/80 dark:border-yellow-900/30",
  },
  red: {
    iconBg: "bg-red-100 dark:bg-red-950/80",
    iconColor: "text-red-600 dark:text-red-400",
    border: "border-red-100/80 dark:border-red-900/30",
  },
  rose: {
    iconBg: "bg-rose-100 dark:bg-rose-950/80",
    iconColor: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100/80 dark:border-rose-900/30",
  },
  cyan: {
    iconBg: "bg-cyan-100 dark:bg-cyan-950/80",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100/80 dark:border-cyan-900/30",
  },
  slate: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
};

export function ReportKpiCard({
  label,
  value,
  icon: Icon,
  colorTint = "blue",
  subValue,
  className = "",
}: ReportKpiCardProps) {
  const styling = colorStyles[colorTint] || colorStyles.blue;

  return (
    <div
      className={`p-4 rounded-xl border bg-card text-card-foreground shadow-xs flex items-center gap-4 transition-all hover:shadow-sm ${styling.border} ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${styling.iconBg}`}
      >
        <Icon className={`w-6 h-6 ${styling.iconColor}`} />
      </div>

      <div className="space-y-0.5 min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
        <p className="text-xl font-bold tracking-tight text-foreground truncate font-mono">
          {value}
        </p>
        {subValue && (
          <div className="text-xs text-muted-foreground">{subValue}</div>
        )}
      </div>
    </div>
  );
}
