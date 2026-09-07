import React from 'react';
import { TimelineEvent } from '../types';
import { MessageSquare, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '../utils/cn';

interface CaseTimelineProps {
  events: TimelineEvent[];
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ events }) => {
  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'checkin': return { icon: MessageSquare, bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'alert': return { icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-600' };
      case 'intervention': return { icon: ShieldCheck, bg: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'status_change': return { icon: Activity, bg: 'bg-purple-100', text: 'text-purple-600' };
    }
  };

  if (!events || events.length === 0) {
    return <div className="text-slate-500 text-center py-8">No timeline events recorded yet.</div>;
  }

  return (
    <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4 mt-4">
      {events.map((event) => {
        const { icon: Icon, bg, text } = getIcon(event.type);
        
        return (
          <div key={event.id} className="relative pl-6 sm:pl-8">
            <span className={cn("absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white", bg, text)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
              <h4 className="font-semibold text-slate-800 text-sm">{event.title}</h4>
              <time className="text-xs text-slate-500 font-medium">
                {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </time>
            </div>
            <p className="text-sm text-slate-600">
              {event.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};
