import React from 'react';
import { Priority, Trend, CaseStage } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../utils/cn';

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Urgent: "bg-red-50 text-red-700 border-red-200 font-bold",
  };

  return (
    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", styles[priority])}>
      {priority}
    </span>
  );
};

export const TrendBadge: React.FC<{ trend: Trend }> = ({ trend }) => {
  const config = {
    increasing: { icon: TrendingUp, class: "text-red-600 bg-red-50", label: "Increasing" },
    decreasing: { icon: TrendingDown, class: "text-emerald-600 bg-emerald-50", label: "Decreasing" },
    stable: { icon: Minus, class: "text-slate-600 bg-slate-100", label: "Stable" },
  };
  
  const { icon: Icon, class: className, label } = config[trend];

  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md w-fit text-sm font-medium", className)}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
};

export const StageBadge: React.FC<{ stage: CaseStage }> = ({ stage }) => {
  return (
    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200">
      {stage}
    </span>
  );
};
