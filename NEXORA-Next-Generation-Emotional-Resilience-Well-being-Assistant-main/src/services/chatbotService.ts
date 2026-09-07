export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  action?: 'talk_to_counsellor' | 'check_status' | 'start_checkin';
  suggestions?: string[];
}

interface ChatContext {
  history: ChatMessage[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are NEXORA AI Assistant, a compassionate and professional wellbeing support and navigation assistant for the NEXORA platform — a government/public-service mental health monitoring system for victims and complainants.

Your role is to:
- Listen empathetically and provide emotional support
- Help users navigate the NEXORA platform (check-ins, case status, counsellor access)
- Ask thoughtful follow-up questions to better understand the user's concerns
- Guide users to appropriate platform features or human support when needed

STRICT RULES you MUST follow:
1. NEVER diagnose any condition. Never say "you have depression/anxiety/PTSD" etc.
2. Instead say things like: "It sounds like you've been dealing with a lot of stress" or "This situation may be affecting your wellbeing."
3. NEVER provide medical or legal advice.
4. If the user seems in crisis or mentions self-harm, calmly encourage them to speak with a counsellor immediately.
5. Ask only 1-2 follow-up questions at a time — do NOT bombard the user.
6. Remember the full conversation context and never repeat the same question twice.
7. Be warm, human, and natural — NOT robotic or FAQ-like.
8. Keep responses concise and conversational (2-4 sentences max unless the user asks for more detail).
9. Occasionally offer relevant platform actions by ending your message with a JSON block in this exact format (only when truly relevant, not every message):
   ACTION:{"type":"talk_to_counsellor"|"start_checkin"|"check_status","suggestions":["suggestion 1","suggestion 2"]}
10. If no action is needed, just respond naturally without the ACTION block.

You are NOT a doctor, psychiatrist, therapist, emergency service, or legal authority.`;

export const INITIAL_MESSAGE: ChatMessage = {
  id: 'init_1',
  role: 'assistant',
  content: "Hello! I'm NEXORA AI Assistant. I'm here to help you understand your concerns, find the right support, and navigate the NEXORA platform.\n\nYou can tell me what you're experiencing in your own words. I'll listen and help you figure out what to do next.",
  timestamp: new Date().toISOString(),
  suggestions: [
    "I'm feeling worried",
    "I want to talk about my problem",
    "I need support",
    "Talk to a counsellor",
    "How does the wellbeing check-in work?"
  ]
};

const parseActionFromResponse = (text: string): { cleanText: string; action?: ChatMessage['action']; suggestions?: string[] } => {
  const actionMatch = text.match(/ACTION:(\{.*?\})/s);
  if (!actionMatch) return { cleanText: text.trim() };

  try {
    const actionData = JSON.parse(actionMatch[1]);
    const cleanText = text.replace(/ACTION:\{.*?\}/s, '').trim();
    return {
      cleanText,
      action: actionData.type,
      suggestions: actionData.suggestions || []
    };
  } catch {
    return { cleanText: text.replace(/ACTION:\{.*?\}/s, '').trim() };
  }
};

// Fallback mock in case API key is missing or fails
const mockFallback = async (message: string): Promise<Partial<ChatMessage>> => {
  await new Promise(resolve => setTimeout(resolve, 900));
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('counsellor') || lowerMsg.includes('human') || lowerMsg.includes('talk to someone')) {
    return { content: "I understand you'd like to speak with someone. Connecting you with a qualified counsellor is a great step. Would you like me to help you do that now?", action: 'talk_to_counsellor', suggestions: ["Yes, please", "Not right now"] };
  }
  if (lowerMsg.includes('stress') || lowerMsg.includes('worri') || lowerMsg.includes('anxious') || lowerMsg.includes('sad') || lowerMsg.includes('overwhelm')) {
    return { content: "I'm sorry you're going through a difficult time. I'm here to listen. Can you tell me a bit more about what's been making things feel this way lately?", suggestions: ["It's my case", "I feel overwhelmed", "I don't know"] };
  }
  if (lowerMsg.includes('case') || lowerMsg.includes('delay') || lowerMsg.includes('status')) {
    return { content: "That sounds frustrating, especially when you're waiting on something important. Would you like to talk more about how the delay is affecting you, or would you prefer help checking your case status?", action: 'check_status', suggestions: ["Check Case Status", "Talk about it"] };
  }
  if (lowerMsg.includes('check-in') || lowerMsg.includes('check in')) {
    return { content: "The wellbeing check-in is a quick conversational tool to help us understand how you're feeling over time. Would you like to try it now?", action: 'start_checkin', suggestions: ["Start Check-in", "Maybe later"] };
  }
  return { content: "I hear you. How has that been impacting your daily life? I'm here to listen and help.", suggestions: ["Talk to a counsellor", "Start wellbeing check-in"] };
};

export const chatWithAssistant = async (
  message: string,
  context: ChatContext
): Promise<Partial<ChatMessage>> => {
  if (!GEMINI_API_KEY) {
    console.warn('NEXORA AI: No Gemini API key found. Using mock fallback.');
    return mockFallback(message);
  }

  // Build conversation history for Gemini
  const conversationHistory = context.history
    .filter(m => m.id !== 'init_1') // Skip the initial static message
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  // Add current user message
  conversationHistory.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: conversationHistory,
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return mockFallback(message);
    }

    const data = await response.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) return mockFallback(message);

    const { cleanText, action, suggestions } = parseActionFromResponse(rawText);

    return {
      content: cleanText,
      action,
      suggestions: suggestions && suggestions.length > 0 ? suggestions : undefined
    };

  } catch (err) {
    console.error('NEXORA AI: Gemini API call failed, using mock fallback.', err);
    return mockFallback(message);
  }
};
