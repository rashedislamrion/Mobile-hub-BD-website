import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  label: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
};

interface StatusTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn("flex flex-col space-y-0", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.label} className="flex gap-4 min-h-[60px]">
            {/* Left Timeline Line & Icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 bg-white",
                  step.isCompleted 
                    ? "border-emerald-500 bg-emerald-500 text-white" 
                    : step.isCurrent 
                      ? "border-emerald-500 text-emerald-600"
                      : "border-slate-200 text-slate-400"
                )}
              >
                {step.isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    step.isCurrent ? "bg-emerald-500" : "bg-slate-200"
                  )} />
                )}
              </div>
              
              {!isLast && (
                <div 
                  className={cn(
                    "flex-1 w-0.5 mt-2",
                    step.isCompleted ? "bg-emerald-500" : "bg-slate-200"
                  )} 
                />
              )}
            </div>

            {/* Right Content */}
            <div className="flex flex-col pt-1 pb-6">
              <span className={cn(
                "text-sm font-medium",
                step.isCompleted || step.isCurrent ? "text-slate-900" : "text-slate-500"
              )}>
                {step.label}
              </span>
              {step.timestamp && (
                <span className="text-xs text-slate-400 mt-0.5">
                  {new Date(step.timestamp).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
