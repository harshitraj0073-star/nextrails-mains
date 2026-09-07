import { Case } from '../types';

const today = new Date();
const formatDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const MOCK_CASES: Case[] = [
  {
    id: "NEXORA-14566",
    district: "Kolkata",
    caseStage: "Investigation",
    priority: "High",
    distressScore: 72,
    distressTrend: "increasing",
    lastCheckIn: formatDate(0),
    assignedCounsellor: "Dr. A. Sharma",
    sentiment: 30, // low is negative
    emotionalIndicators: 85, // high is distress
    engagement: 40,
    alerts: [
      "Increasing negative sentiment",
      "Increased fear-related responses",
      "Reduced engagement"
    ],
    interventions: [],
    timeline: [
      { id: "t1", date: formatDate(5), title: "Wellbeing check-in", description: "Score: 42", type: "checkin", score: 42 },
      { id: "t2", date: formatDate(3), title: "Wellbeing check-in", description: "Score: 51", type: "checkin", score: 51 },
      { id: "t3", date: formatDate(0), title: "Wellbeing check-in", description: "Score: 72", type: "checkin", score: 72 },
      { id: "t4", date: formatDate(0), title: "Priority review generated", description: "AI distress indicator crossed threshold", type: "alert" }
    ]
  },
  {
    id: "NEXORA-14567",
    district: "Nadia",
    caseStage: "Trial",
    priority: "Moderate",
    distressScore: 55,
    distressTrend: "stable",
    lastCheckIn: formatDate(1),
    assignedCounsellor: "S. Banerjee",
    sentiment: 60,
    emotionalIndicators: 45,
    engagement: 80,
    alerts: [],
    interventions: [],
    timeline: [
      { id: "t5", date: formatDate(7), title: "Wellbeing check-in", description: "Score: 54", type: "checkin", score: 54 },
      { id: "t6", date: formatDate(1), title: "Wellbeing check-in", description: "Score: 55", type: "checkin", score: 55 }
    ]
  },
  {
    id: "NEXORA-14568",
    district: "Hooghly",
    caseStage: "Rehabilitation",
    priority: "Low",
    distressScore: 30,
    distressTrend: "decreasing",
    lastCheckIn: formatDate(2),
    assignedCounsellor: "R. Das",
    sentiment: 80,
    emotionalIndicators: 20,
    engagement: 90,
    alerts: [],
    interventions: [
      { id: "i1", type: "Counselling", priority: "Low", assignedTo: "R. Das", followUpDate: formatDate(-5), notes: "Regular follow-up", date: formatDate(10) }
    ],
    timeline: [
      { id: "t7", date: formatDate(15), title: "Wellbeing check-in", description: "Score: 60", type: "checkin", score: 60 },
      { id: "t8", date: formatDate(2), title: "Wellbeing check-in", description: "Score: 30", type: "checkin", score: 30 }
    ]
  },
  {
    id: "NEXORA-14569",
    district: "Murshidabad",
    caseStage: "Investigation",
    priority: "Urgent",
    distressScore: 92,
    distressTrend: "increasing",
    lastCheckIn: formatDate(0),
    assignedCounsellor: "Unassigned",
    sentiment: 10,
    emotionalIndicators: 95,
    engagement: 20,
    alerts: [
      "Missed check-in (2 times)",
      "High distress indicators reported"
    ],
    interventions: [],
    timeline: [
      { id: "t9", date: formatDate(1), title: "Missed check-in", description: "System generated alert", type: "alert" },
      { id: "t10", date: formatDate(0), title: "Missed check-in", description: "System generated alert", type: "alert" }
    ]
  },
  {
    id: "NEXORA-14570",
    district: "North 24 Parganas",
    caseStage: "Compensation",
    priority: "Low",
    distressScore: 25,
    distressTrend: "stable",
    lastCheckIn: formatDate(3),
    assignedCounsellor: "Dr. A. Sharma",
    sentiment: 75,
    emotionalIndicators: 25,
    engagement: 85,
    alerts: [],
    interventions: [],
    timeline: [
      { id: "t11", date: formatDate(3), title: "Wellbeing check-in", description: "Score: 25", type: "checkin", score: 25 }
    ]
  },
  // Add more cases to make dashboard look populated
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `NEXORA-145${71 + i}`,
    district: ["Kolkata", "Nadia", "Hooghly", "Murshidabad", "North 24 Parganas", "South 24 Parganas"][i % 6],
    caseStage: (["Investigation", "Trial", "Rehabilitation", "Compensation"] as const)[i % 4],
    priority: (["Low", "Moderate", "High", "Low", "Moderate"][i % 5] as any),
    distressScore: 30 + (i * 3) % 40,
    distressTrend: (["stable", "decreasing", "increasing"][i % 3] as any),
    lastCheckIn: formatDate((i * 2) % 10),
    assignedCounsellor: ["Dr. A. Sharma", "S. Banerjee", "R. Das"][i % 3],
    sentiment: 40 + (i * 5) % 40,
    emotionalIndicators: 20 + (i * 4) % 50,
    engagement: 50 + (i * 3) % 40,
    alerts: i % 5 === 0 ? ["Requires review"] : [],
    interventions: [],
    timeline: []
  }))
];
