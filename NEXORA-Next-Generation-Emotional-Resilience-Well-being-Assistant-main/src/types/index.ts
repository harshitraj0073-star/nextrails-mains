export type Role = 'victim' | 'counsellor' | 'admin' | null;

export type CaseStage = 'Investigation' | 'Trial' | 'Rehabilitation' | 'Compensation';
export type Priority = 'Low' | 'Moderate' | 'High' | 'Urgent';
export type Trend = 'increasing' | 'decreasing' | 'stable';

export interface Intervention {
  id: string;
  type: string;
  priority: Priority;
  assignedTo: string;
  followUpDate: string;
  notes: string;
  date: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'checkin' | 'alert' | 'intervention' | 'status_change';
  score?: number;
}

export interface Case {
  id: string;
  district: string;
  caseStage: CaseStage;
  priority: Priority;
  distressScore: number; // 0 - 100
  distressTrend: Trend;
  lastCheckIn: string;
  assignedCounsellor: string;
  sentiment: number; // 0 - 100
  emotionalIndicators: number; // 0 - 100
  engagement: number; // 0 - 100
  alerts: string[];
  interventions: Intervention[];
  timeline: TimelineEvent[];
}

export interface CheckInResponse {
  questionId: string;
  answer: string;
}
