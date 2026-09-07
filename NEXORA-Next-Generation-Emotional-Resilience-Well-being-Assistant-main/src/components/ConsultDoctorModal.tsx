import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Star, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  HeartPulse,
  UserCheck
} from 'lucide-react';
import { StressAnalysisResult } from '../services/stressAnalysisService';

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  experience: string;
  rating: number;
  available: string;
  isAvailableNow: boolean;
  avatar: string;
}

export const DOCTORS_LIST: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Ananya Sharma',
    qualification: 'MD (Psychiatry), AIIMS',
    specialty: 'Trauma, PTSD & Legal Stress Specialist',
    experience: '12 years exp.',
    rating: 4.9,
    available: 'Available Now',
    isAvailableNow: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=160'
  },
  {
    id: 'doc_2',
    name: 'Dr. Rajesh Verma',
    qualification: 'Ph.D. (Clinical Psychology)',
    specialty: 'Cognitive Behavioural & Crisis Intervention',
    experience: '15 years exp.',
    rating: 4.8,
    available: 'Next slot in 15 mins',
    isAvailableNow: true,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=160'
  },
  {
    id: 'doc_3',
    name: 'Dr. Priya Nair',
    qualification: 'M.Phil (Medical Psychology)',
    specialty: 'Anxiety, Sleep Disturbance & Victim Care',
    experience: '9 years exp.',
    rating: 4.9,
    available: 'Today at 5:30 PM',
    isAvailableNow: false,
    avatar: 'https://images.unsplash.com/photo-1594824813579-247c433383a1?auto=format&fit=crop&q=80&w=160'
  }
];

interface ConsultDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stressResult: StressAnalysisResult | null;
  initialDoctorId?: string;
}

export const ConsultDoctorModal: React.FC<ConsultDoctorModalProps> = ({
  isOpen,
  onClose,
  stressResult,
  initialDoctorId = 'doc_1'
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId);
  const [consultType, setConsultType] = useState<'video' | 'audio' | 'clinic'>('video');
  const [isBooked, setIsBooked] = useState(false);
  const [preferredTime, setPreferredTime] = useState('Immediate / Next Available');
  const [patientNote, setPatientNote] = useState('');

  if (!isOpen) return null;

  const selectedDoctor = DOCTORS_LIST.find(d => d.id === selectedDoctorId) || DOCTORS_LIST[0];

  const handleConfirmBooking = () => {
    setIsBooked(true);
  };

  const resetAndClose = () => {
    setIsBooked(false);
    onClose();
  };

  const getSeverityBadge = () => {
    if (!stressResult) return null;
    const level = stressResult.level;
    if (level === 'Critical' || level === 'High') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          High Stress ({stressResult.score}%) — Priority Consultation
        </span>
      );
    }
    if (level === 'Moderate') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
          Medium Stress ({stressResult.score}%) — Routine Consultation
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        Low Stress ({stressResult.score}%) — Preventive Consultation
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <HeartPulse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Consult a Clinical Doctor
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Certified Specialists
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct medical & psychological support grounded in your recent emotional check-in
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {isBooked ? (
            /* Booking Confirmation Screen */
            <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">
                  Consultation Confirmed!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your appointment with <strong>{selectedDoctor.name}</strong> has been scheduled. A secure encrypted room link has been generated.
                </p>
              </div>

              {/* Consultation Details Card */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedDoctor.avatar} 
                    alt={selectedDoctor.name} 
                    className="w-12 h-12 rounded-full object-cover border border-slate-300"
                  />
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-white">{selectedDoctor.name}</h5>
                    <p className="text-xs text-primary font-medium">{selectedDoctor.specialty}</p>
                    <p className="text-[11px] text-slate-400">{selectedDoctor.qualification}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Format:</span>
                    <strong className="capitalize text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      {consultType === 'video' && <Video className="w-3.5 h-3.5 text-primary" />}
                      {consultType === 'audio' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                      {consultType === 'clinic' && <Building2 className="w-3.5 h-3.5 text-amber-600" />}
                      {consultType} Consultation
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Scheduled For:</span>
                    <strong className="text-slate-700 dark:text-slate-200 mt-0.5 block">{preferredTime}</strong>
                  </div>
                </div>

                {stressResult && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>Clinical Stress Data Shared:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {stressResult.score}% ({stressResult.level})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {consultType === 'video' && (
                  <button
                    onClick={() => alert(`Starting secure video consultation room with ${selectedDoctor.name}...`)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Enter Video Room
                  </button>
                )}
                <button
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Booking Flow */
            <>
              {/* Context Banner */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Connected to Your Emotional Profile
                    </span>
                    {getSeverityBadge()}
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    Doctors on the NEXORA panel are accredited clinical psychologists and trauma specialists trained in legal and crisis casework.
                  </p>
                </div>
              </div>

              {/* Step 1: Choose Doctor */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  1. Select Clinical Specialist
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DOCTORS_LIST.map((doc) => {
                    const isSelected = doc.id === selectedDoctorId;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 dark:bg-primary/10 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={doc.avatar}
                            alt={doc.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                              {doc.name}
                            </h5>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              {doc.qualification}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mb-2 font-medium">
                          {doc.specialty}
                        </p>

                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {doc.rating}
                          </span>
                          <span className={`font-semibold ${doc.isAvailableNow ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {doc.available}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Choose Consultation Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  2. Choose Consultation Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultType('video')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                      consultType === 'video'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                    Video Call
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultType('audio')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                      consultType === 'audio'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Phone className="w-5 h-5" />
                    Audio Call
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultType('clinic')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                      consultType === 'clinic'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    Clinic Visit
                  </button>
                </div>
              </div>

              {/* Step 3: Preferred Timing */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  3. Preferred Timing
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Immediate / Next Available">⚡ Immediate Priority (Next Available in 5 mins)</option>
                  <option value="Today at 4:00 PM">Today at 4:00 PM</option>
                  <option value="Today at 6:30 PM">Today at 6:30 PM</option>
                  <option value="Tomorrow Morning (10:00 AM)">Tomorrow Morning (10:00 AM)</option>
                  <option value="Tomorrow Afternoon (2:00 PM)">Tomorrow Afternoon (2:00 PM)</option>
                </select>
              </div>

              {/* Step 4: Optional Note */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  4. Note for the Doctor (Optional)
                </label>
                <textarea
                  value={patientNote}
                  onChange={(e) => setPatientNote(e.target.value)}
                  placeholder="Share any specific concern (e.g., 'Feeling intense panic before my court hearing on Monday')..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none h-16"
                />
              </div>

              {/* Summary Pre-booking confirmation bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span>Selected Specialist: <strong>{selectedDoctor.name}</strong></span>
                  <span className="block text-[11px] text-slate-400">
                    Confidential session covered under NEXORA victim health grant
                  </span>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  Confirm & Schedule Consultation
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
