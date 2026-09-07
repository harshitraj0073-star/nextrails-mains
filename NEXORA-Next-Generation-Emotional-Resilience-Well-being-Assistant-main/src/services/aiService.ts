import { CheckInResponse } from '../types';

export const analyzeCheckIn = async (responses: CheckInResponse[]) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real application, this would send responses to a FastAPI/ML endpoint.
  // For the MVP, we simulate the analysis based on responses.
  
  let distressScore = 30; // base score
  let negativeCount = 0;
  
  responses.forEach(r => {
    const ans = r.answer.toLowerCase();
    if (ans.includes('worried') || ans.includes('afraid') || ans.includes('difficult')) {
      distressScore += 20;
      negativeCount++;
    }
    if (ans.includes('not able') || ans.includes('bad') || ans.includes('poor')) {
      distressScore += 15;
      negativeCount++;
    }
  });

  distressScore = Math.min(100, distressScore);
  
  let priority: 'Low' | 'Moderate' | 'High' | 'Urgent' = 'Low';
  if (distressScore > 80) priority = 'Urgent';
  else if (distressScore > 60) priority = 'High';
  else if (distressScore > 40) priority = 'Moderate';

  const indicators = [];
  if (negativeCount > 0) indicators.push("Negative sentiment detected");
  if (distressScore > 60) indicators.push("Elevated distress levels");
  
  return {
    sentiment: Math.max(0, 100 - (negativeCount * 25)),
    emotion: negativeCount > 1 ? "fear/anxiety" : "neutral",
    distressScore,
    trend: distressScore > 50 ? "increasing" : "stable",
    priority,
    indicators: indicators.length > 0 ? indicators : ["No significant risk indicators"]
  };
};
