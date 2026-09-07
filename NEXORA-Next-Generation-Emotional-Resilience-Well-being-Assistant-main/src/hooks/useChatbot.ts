import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, INITIAL_MESSAGE, chatWithAssistant } from '../services/chatbotService';
import { 
  StressAnalysisResult, 
  analyzeConversationStressWithAI, 
  calculateRuleBasedStress 
} from '../services/stressAnalysisService';

export const useChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nexora_chatbot_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse chatbot history", e);
      }
    }
    return [INITIAL_MESSAGE];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzingStress, setIsAnalyzingStress] = useState(false);
  const [isStressModalOpen, setIsStressModalOpen] = useState(false);
  const [stressResult, setStressResult] = useState<StressAnalysisResult | null>(() => {
    const saved = localStorage.getItem('nexora_stress_result');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved stress result", e);
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('nexora_chatbot_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (stressResult) {
      localStorage.setItem('nexora_stress_result', JSON.stringify(stressResult));
    }
  }, [stressResult]);

  // Real-time live stress estimate based on current conversation
  const userMessages = useMemo(() => {
    return messages.filter(m => m.role === 'user').map(m => m.content);
  }, [messages]);

  const liveStressEstimate = useMemo(() => {
    if (userMessages.length === 0) return null;
    return calculateRuleBasedStress(userMessages).score;
  }, [userMessages]);

  const clearConversation = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setStressResult(null);
    setIsStressModalOpen(false);
    localStorage.removeItem('nexora_chatbot_history');
    localStorage.removeItem('nexora_stress_result');
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await chatWithAssistant(content, { history: messages });
      
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.content || "I'm sorry, I encountered an error. How can I help you?",
        timestamp: new Date().toISOString(),
        action: response.action,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chatbot error", error);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  // End conversation & calculate full stress assessment
  const endConversationAndAnalyzeStress = useCallback(async () => {
    setIsAnalyzingStress(true);

    try {
      const result = await analyzeConversationStressWithAI(messages);
      setStressResult(result);

      // Add a conversational closing message from NEXORA AI detailing the score
      const conclusionMsg: ChatMessage = {
        id: `conclusion_${Date.now()}`,
        role: 'assistant',
        content: `📋 **CONVERSATION CONCLUDED — EMOTIONAL STRESS ASSESSMENT**\n\nBased on your expressions during our conversation, your calculated Stress Score is **${result.score}% / 100 (${result.level} Stress)**.\n\n**${result.headline}**\n${result.summary}\n\n*Click "View Full Stress Report" above or below to review your emotional tone breakdown and tailored clinical recommendations.*`,
        timestamp: new Date().toISOString(),
        suggestions: result.counsellorRecommended 
          ? ['Talk to a counsellor', 'View full report', 'Start new chat']
          : ['View full report', 'Start new chat']
      };

      setMessages(prev => [...prev, conclusionMsg]);
      setIsStressModalOpen(true);
      return result;
    } catch (error) {
      console.error('Error analyzing stress:', error);
      const fallback = calculateRuleBasedStress(userMessages);
      setStressResult(fallback);
      setIsStressModalOpen(true);
      return fallback;
    } finally {
      setIsAnalyzingStress(false);
    }
  }, [messages, userMessages]);

  return {
    messages,
    isTyping,
    isOpen,
    setIsOpen,
    sendMessage,
    clearConversation,
    // Stress Monitor API
    stressResult,
    isAnalyzingStress,
    isStressModalOpen,
    setIsStressModalOpen,
    liveStressEstimate,
    userMessagesCount: userMessages.length,
    endConversationAndAnalyzeStress
  };
};

