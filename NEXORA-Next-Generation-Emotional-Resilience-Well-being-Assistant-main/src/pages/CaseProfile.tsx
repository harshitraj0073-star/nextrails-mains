import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { TrendBadge, StageBadge } from '../components/StatusBadge';
import { CaseTimeline } from '../components/CaseTimeline';
import { InterventionModal } from '../components/InterventionModal';
import { ArrowLeft, User, MapPin, Brain, Activity, ShieldPlus } from 'lucide-react';

const ScoreBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export const CaseProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getCase, addIntervention } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const caseData = id ? getCase(id) : undefined;

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl text-slate-600 mb-4">Case not found</h2>
        <Link to="/cases" className="text-primary hover:underline">Return to Cases</Link>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/cases" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Case Profile: {caseData.id}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info & AI Indicators */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Case Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">District</p>
                  <p className="font-medium text-slate-800">{caseData.district}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Case Stage</p>
                  <div className="mt-1"><StageBadge stage={caseData.caseStage} /></div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Assigned Counsellor</p>
                  <p className="font-medium text-slate-800">{caseData.assignedCounsellor}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Indicators
            </h3>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <InfoIcon /> Important Notice
              </p>
              <p className="text-sm text-blue-700 leading-relaxed">
                These are AI-generated distress indicators designed to assist support staff. This is <strong>not a clinical diagnosis</strong> and requires human review.
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Distress Score</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{caseData.distressScore}</span>
                  <span className="text-sm text-slate-400">/ 100</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Trend</p>
                <TrendBadge trend={caseData.distressTrend} />
              </div>
            </div>

            <ScoreBar label="Sentiment (Lower is more negative)" value={caseData.sentiment} colorClass="bg-indigo-500" />
            <ScoreBar label="Emotional Distress Signals" value={caseData.emotionalIndicators} colorClass="bg-rose-500" />
            <ScoreBar label="Engagement" value={caseData.engagement} colorClass="bg-emerald-500" />
          </div>
          
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              Explainable AI Reasons
            </h3>
            <ul className="space-y-2">
              {caseData.alerts.length > 0 ? caseData.alerts.map((alert, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                  {alert}
                </li>
              )) : (
                <li className="text-sm text-slate-500 italic">No specific risk patterns detected in recent check-ins.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Timeline & Interventions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800">Case Timeline</h3>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                <ShieldPlus className="w-4 h-4" />
                Add Intervention
              </button>
            </div>
            <div className="p-6">
              <CaseTimeline events={caseData.timeline} />
            </div>
          </div>
        </div>
      </div>
      
      <InterventionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={(intervention) => addIntervention(caseData.id, intervention)}
      />
    </div>
  );
};

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
