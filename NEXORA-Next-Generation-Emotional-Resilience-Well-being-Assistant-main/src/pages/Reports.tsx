import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle2 } from 'lucide-react';

export const Reports: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
      
      // Reset after 3 seconds
      setTimeout(() => setGenerated(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reports & Export</h2>
        <p className="text-sm text-slate-500">Generate compliance and monitoring reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-800 text-lg border-b border-slate-100 pb-2">Available Reports</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="radio" name="reportType" className="mt-1" defaultChecked />
                <div>
                  <p className="font-medium text-slate-800">Monthly Wellbeing Summary</p>
                  <p className="text-sm text-slate-500">Aggregated distress scores, trends, and intervention rates across all districts.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="radio" name="reportType" className="mt-1" />
                <div>
                  <p className="font-medium text-slate-800">High Priority Cases Log</p>
                  <p className="text-sm text-slate-500">Detailed export of cases marked High or Urgent, including AI indicators.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="radio" name="reportType" className="mt-1" />
                <div>
                  <p className="font-medium text-slate-800">Intervention Compliance</p>
                  <p className="text-sm text-slate-500">Tracking of recommended interventions vs completed actions by staff.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-lg">Report Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary">
                  <option>Current Month</option>
                  <option>Last Month</option>
                  <option>Last 3 Months</option>
                  <option>Custom Range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="format" defaultChecked /> PDF
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="format" /> CSV
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="format" /> Excel
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || generated}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-medium transition-all ${
                  generated 
                    ? 'bg-emerald-500' 
                    : 'bg-primary hover:bg-primary-hover disabled:bg-slate-400'
                }`}
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating Report...</>
                ) : generated ? (
                  <><CheckCircle2 className="w-5 h-5" /> Download Complete</>
                ) : (
                  <><Download className="w-5 h-5" /> Generate & Download</>
                )}
              </button>
              
              <p className="text-xs text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5" /> All exports are securely logged for audit purposes.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
