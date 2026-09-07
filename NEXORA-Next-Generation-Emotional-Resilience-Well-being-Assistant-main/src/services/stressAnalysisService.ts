import { ChatMessage } from './chatbotService';

export interface EmotionalTone {
  anxiety: number;     // 0 - 100%
  sadness: number;     // 0 - 100%
  frustration: number; // 0 - 100%
  hope: number;        // 0 - 100%
  calm: number;        // 0 - 100%
}

export interface StressAnalysisResult {
  score: number; // 0 to 100%
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  headline: string;
  summary: string;
  emotionalTone: EmotionalTone;
  keyTriggers: string[];
  positiveMarkers: string[];
  recommendations: string[];
  counsellorRecommended: boolean;
  urgentCrisisDetected: boolean;
  analyzedMessagesCount: number;
  timestamp: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Word clusters for clinical NLP distress detection
const ANXIETY_WORDS = [
  'anxious', 'anxiety', 'worried', 'worry', 'scared', 'afraid', 'panic',
  'terrified', 'nervous', 'shaking', 'sweating', 'dread', 'paralyzed', 'stress', 'stressed'
];

const SLEEP_PHYSICAL_WORDS = [
  'sleep', "can't sleep", 'insomnia', 'nightmare', 'nightmares', 'tired',
  'exhausted', 'headache', 'crying', 'tears', 'heart racing', 'nauseous', 'pain'
];

const TRAUMA_LEGAL_WORDS = [
  'court', 'hearing', 'judge', 'lawyer', 'police', 'fir', 'case', 'threat',
  'threatened', 'attacker', 'abuser', 'harassed', 'fear', 'deposition', 'testify', 'trial'
];

const HELPLESSNESS_WORDS = [
  'hopeless', 'helpless', 'alone', 'nobody cares', 'nobody understands', 'give up',
  'giving up', 'broken', 'lost', 'overwhelmed', "can't take it", 'burden', 'suffering'
];

const CRISIS_WORDS = [
  'kill', 'die', 'dying', 'suicide', 'hurt myself', 'end my life', 'end it all',
  'want to disappear', 'no point living'
];

const RESILIENCE_WORDS = [
  'better', 'hopeful', 'hope', 'calm', 'safe', 'relief', 'relieved', 'thank you',
  'managing', 'trying', 'improving', 'strong', 'peace', 'peaceful', 'supported'
];

export const calculateRuleBasedStress = (userMessages: string[]): StressAnalysisResult => {
  if (userMessages.length === 0) {
    return {
      score: 15,
      level: 'Low',
      headline: 'Low / Normal Stress Level',
      summary: 'No active signs of distress detected in this conversation.',
      emotionalTone: { anxiety: 10, sadness: 10, frustration: 5, hope: 40, calm: 35 },
      keyTriggers: ['No significant stress triggers reported'],
      positiveMarkers: ['Neutral baseline conversation'],
      recommendations: ['Maintain regular daily routines and wellbeing habits.'],
      counsellorRecommended: false,
      urgentCrisisDetected: false,
      analyzedMessagesCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  const combinedText = userMessages.join(' ').toLowerCase();

  let rawScore = 25; // Baseline human stress score
  let anxietyCount = 0;
  let physicalCount = 0;
  let legalCount = 0;
  let helplessCount = 0;
  let crisisCount = 0;
  let resilienceCount = 0;

  ANXIETY_WORDS.forEach(word => {
    if (combinedText.includes(word)) {
      rawScore += 9;
      anxietyCount++;
    }
  });

  SLEEP_PHYSICAL_WORDS.forEach(word => {
    if (combinedText.includes(word)) {
      rawScore += 11;
      physicalCount++;
    }
  });

  TRAUMA_LEGAL_WORDS.forEach(word => {
    if (combinedText.includes(word)) {
      rawScore += 10;
      legalCount++;
    }
  });

  HELPLESSNESS_WORDS.forEach(word => {
    if (combinedText.includes(word)) {
      rawScore += 14;
      helplessCount++;
    }
  });

  CRISIS_WORDS.forEach(word => {
    if (combinedText.includes(word)) {
      rawScore += 45;
      crisisCount++;
    }
  });

  RESILIENCE_WORDS.forEach(word => {
    if (combinedText.includes(word)) {
      rawScore -= 8;
      resilienceCount++;
    }
  });

  // Punctuation & Style intensity check
  const allUserText = userMessages.join(' ');
  const exclamationCount = (allUserText.match(/!/g) || []).length;
  if (exclamationCount >= 3) rawScore += 6;

  // ALL CAPS words indicator
  const words = allUserText.split(/\s+/);
  const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /^[A-Z]+$/.test(w));
  if (capsWords.length >= 2) rawScore += 8;

  // Clamp final score strictly between 10 and 100
  let score = Math.max(10, Math.min(100, Math.round(rawScore)));

  // If crisis detected, guarantee critical threshold
  if (crisisCount > 0) {
    score = Math.max(88, score);
  }

  let level: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  if (score >= 85) level = 'Critical';
  else if (score >= 65) level = 'High';
  else if (score >= 40) level = 'Moderate';

  // Construct detected triggers
  const keyTriggers: string[] = [];
  if (crisisCount > 0) keyTriggers.push('Urgent crisis markers & critical emotional strain');
  if (legalCount > 0) keyTriggers.push('Legal proceeding pressure & case-related apprehension');
  if (helplessCount > 0) keyTriggers.push('Feelings of helplessness and isolation');
  if (physicalCount > 0) keyTriggers.push('Somatic fatigue, sleep disturbance, or physical distress');
  if (anxietyCount > 0) keyTriggers.push('Heightened anxiety & nervous apprehension');
  if (keyTriggers.length === 0) keyTriggers.push('Routine situational stressors');

  // Positive markers
  const positiveMarkers: string[] = [];
  if (resilienceCount > 0) positiveMarkers.push('Expressed resilience and hope for recovery');
  positiveMarkers.push('Proactively shared thoughts with NEXORA AI');
  if (userMessages.length >= 3) positiveMarkers.push('Engaged openly throughout conversation');

  // Emotional Tone breakdown (normalized to ~100%)
  let anxiVal = Math.min(85, Math.max(5, anxietyCount * 18 + (level === 'High' || level === 'Critical' ? 30 : 10)));
  let sadVal = Math.min(85, Math.max(5, helplessCount * 20 + physicalCount * 10));
  let frustVal = Math.min(75, Math.max(5, legalCount * 15 + (capsWords.length > 0 ? 20 : 5)));
  let hopeVal = Math.max(5, Math.min(70, resilienceCount * 25 + (level === 'Low' ? 45 : 10)));
  let calmVal = Math.max(5, Math.min(80, 100 - score));

  // Empathetic summaries tailored to score
  let headline = '';
  let summary = '';
  const recommendations: string[] = [];

  if (level === 'Critical') {
    headline = 'Critical Emotional Distress Detected';
    summary = 'Your conversation indicates severe emotional distress and acute overwhelm. You should not have to carry this alone, and immediate compassionate support is strongly advised.';
    recommendations.push('Connect with a licensed trauma counsellor immediately.');
    recommendations.push('Reach out to the 24/7 National Helpline (Tele-MANAS: 14416).');
    recommendations.push('Inform a trusted family member or support advocate about how you feel.');
  } else if (level === 'High') {
    headline = 'Elevated Stress & Anxiety Detected';
    summary = 'Your responses reflect significant emotional strain, worry, or fatigue linked to your current situation. Professional guidance can help ease this burden.';
    recommendations.push('Schedule a one-on-one session with your assigned counsellor.');
    recommendations.push('Practice slow diaphragmatic breathing to regulate nervous system tension.');
    recommendations.push('Take temporary rest from reviewing court or case documents today.');
  } else if (level === 'Moderate') {
    headline = 'Moderate Situational Stress';
    summary = 'You are experiencing noticeable stress and worry, though you are maintaining emotional control. Staying proactive will keep your stress from escalating.';
    recommendations.push('Complete daily micro-checkins on NEXORA to monitor emotional changes.');
    recommendations.push('Engage in 15 minutes of calming physical activity or meditation.');
    recommendations.push('Write down your main worries to discuss in your next session.');
  } else {
    headline = 'Balanced / Low Stress State';
    summary = 'Your conversation indicates a relatively grounded and stable emotional state. Continue nurturing your healthy coping habits.';
    recommendations.push('Keep maintaining your daily wellbeing routine.');
    recommendations.push('Continue checking in with NEXORA whenever you need a safe space.');
  }

  return {
    score,
    level,
    headline,
    summary,
    emotionalTone: {
      anxiety: anxiVal,
      sadness: sadVal,
      frustration: frustVal,
      hope: hopeVal,
      calm: calmVal
    },
    keyTriggers,
    positiveMarkers,
    recommendations,
    counsellorRecommended: level === 'High' || level === 'Critical',
    urgentCrisisDetected: level === 'Critical',
    analyzedMessagesCount: userMessages.length,
    timestamp: new Date().toISOString()
  };
};

// Analyze stress using Gemini API if available, with robust rule-based fallback
export const analyzeConversationStressWithAI = async (
  allMessages: ChatMessage[]
): Promise<StressAnalysisResult> => {
  const userMessages = allMessages
    .filter(m => m.role === 'user')
    .map(m => m.content.trim());

  const fallback = calculateRuleBasedStress(userMessages);

  if (!GEMINI_API_KEY || userMessages.length === 0) {
    return fallback;
  }

  try {
    const prompt = `You are a clinical AI stress evaluation module for NEXORA (a mental health support platform for victims).
Analyze the following messages sent by a person in a conversation and evaluate their STRESS LEVEL from 0 to 100%.

User messages:
${userMessages.map((msg, i) => `${i + 1}. "${msg}"`).join('\n')}

Provide your clinical evaluation strictly as JSON without backticks or markdown in this exact JSON structure:
{
  "score": <number between 0 and 100>,
  "level": "<Low | Moderate | High | Critical>",
  "headline": "<brief 4-6 word headline>",
  "summary": "<2 empathetic, supportive sentences describing their emotional state>",
  "keyTriggers": ["<trigger 1>", "<trigger 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 512,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const aiScore = typeof parsed.score === 'number' ? Math.round(Math.max(10, Math.min(100, parsed.score))) : fallback.score;
        let aiLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = fallback.level;
        if (aiScore >= 85) aiLevel = 'Critical';
        else if (aiScore >= 65) aiLevel = 'High';
        else if (aiScore >= 40) aiLevel = 'Moderate';
        else aiLevel = 'Low';

        return {
          score: aiScore,
          level: aiLevel,
          headline: parsed.headline || fallback.headline,
          summary: parsed.summary || fallback.summary,
          emotionalTone: fallback.emotionalTone,
          keyTriggers: Array.isArray(parsed.keyTriggers) && parsed.keyTriggers.length > 0 ? parsed.keyTriggers : fallback.keyTriggers,
          positiveMarkers: fallback.positiveMarkers,
          recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0 ? parsed.recommendations : fallback.recommendations,
          counsellorRecommended: aiLevel === 'High' || aiLevel === 'Critical',
          urgentCrisisDetected: aiLevel === 'Critical',
          analyzedMessagesCount: userMessages.length,
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('Gemini Stress Analysis failed, returning clinical heuristic score:', err);
  }

  return fallback;
};
