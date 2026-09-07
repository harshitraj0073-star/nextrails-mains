import React, { useState } from 'react';
import { Case } from '../types';
import { PriorityBadge, TrendBadge, StageBadge } from './StatusBadge';
import { Search, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CaseTableProps {
  cases: Case[];
  onSelectCase?: (c: Case) => void;
}

export const CaseTable: React.FC<CaseTableProps> = ({ cases, onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCases = cases.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-3xl bg-slate-950/70 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-mono font-bold text-white text-lg tracking-wide flex items-center gap-2">
            PRIORITY COCKPIT DOSSIERS
            <span className="text-[10px] font-normal px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              {filteredCases.length} ACTIVE
            </span>
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Continuous clinical AI tracking & priority scoring</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search Dossier ID or District..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-900/80 border border-cyan-500/30 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 w-full sm:w-64 transition-all"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-slate-900/40 text-cyan-300/80 border-b border-white/5 uppercase tracking-wider text-[11px]">
              <th className="px-6 py-4 font-semibold">Case Dossier</th>
              <th className="px-6 py-4 font-semibold">District</th>
              <th className="px-6 py-4 font-semibold">Stage</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Distress Trend</th>
              <th className="px-6 py-4 font-semibold">Caseworker</th>
              <th className="px-6 py-4 font-semibold text-right">Telemetry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCases.map(c => (
              <tr 
                key={c.id} 
                onClick={() => onSelectCase && onSelectCase(c)}
                className="hover:bg-cyan-950/20 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {c.id}
                </td>
                <td className="px-6 py-4 text-slate-300">{c.district}</td>
                <td className="px-6 py-4"><StageBadge stage={c.caseStage} /></td>
                <td className="px-6 py-4"><PriorityBadge priority={c.priority} /></td>
                <td className="px-6 py-4"><TrendBadge trend={c.distressTrend} /></td>
                <td className="px-6 py-4 text-slate-400">{c.assignedCounsellor}</td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectCase) onSelectCase(c);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-cyan-400" />
                      AI Telemetry
                    </button>
                    <Link 
                      to={`/cases/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                      title="Open Profile"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-sans">
                  No dossiers found matching telemetry criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
