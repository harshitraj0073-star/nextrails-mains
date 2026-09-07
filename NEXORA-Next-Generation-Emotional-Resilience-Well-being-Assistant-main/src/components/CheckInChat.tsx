import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../utils/i18n';
import { useStore } from '../hooks/useStore';
import { analyzeCheckIn } from '../services/aiService';
import { CheckInResponse } from '../types';
import { Send, Mic, Loader2, CheckCircle } from 'lucide-react';

const QUESTIONS = [
  { id: 'q1', text: 'How have you been feeling recently?' },
  { id: 'q2', text: 'Have you been feeling worried or afraid?' },
  { id: 'q3', text: 'How has your sleep been recently?' },
  { id: 'q4', text: 'Have you been able to continue your normal activities?' },
  { id: 'q5', text: 'Would you like someone from your support team to contact you?' },
];

const QUICK_RESPONSES = [
  '😊 Very good',
  '🙂 Good',
  '😐 Okay',
  '😟 Worried',
  '😞 Very difficult'
];

interface ChatMessage {
  id: string;
  sender: 'system' | 'user';
  text: string;
}

export const CheckInChat: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { state } = useStore();
  const t = useTranslation(state.language);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [responses, setResponses] = useState<CheckInResponse[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentQuestionIdx === 0 && messages.length === 0) {
      setMessages([{ id: 'msg_0', sender: 'system', text: QUESTIONS[0].text }]);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQuestionIdx, messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isProcessing || isCompleted) return;
    
    const newUserMsg: ChatMessage = { id: `msg_${Date.now()}`, sender: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    
    const newResponses = [...responses, { questionId: QUESTIONS[currentQuestionIdx].id, answer: text }];
    setResponses(newResponses);

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setIsProcessing(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: `msg_${Date.now()}`, 
          sender: 'system', 
          text: QUESTIONS[currentQuestionIdx + 1].text 
        }]);
        setCurrentQuestionIdx(prev => prev + 1);
        setIsProcessing(false);
      }, 600);
    } else {
      // Completed all questions
      setIsProcessing(true);
      setIsCompleted(true);
      
      // Simulate AI Analysis
      const analysisResult = await analyzeCheckIn(newResponses);
      
      // We would normally save this to backend. 
      // For MVP, we just store it in local storage to demonstrate it works.
      localStorage.setItem('latest_checkin_analysis', JSON.stringify(analysisResult));
      
      setIsProcessing(false);
      onComplete();
    }
  };

  if (isCompleted && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Thank you for sharing</h3>
        <p className="text-slate-600 max-w-md">
          {t('victim.responsesRecorded')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Wellbeing Check-in</h3>
        <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
          {currentQuestionIdx + 1} / {QUESTIONS.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.sender === 'user' 
                ? 'bg-primary text-white rounded-tr-sm' 
                : 'bg-slate-100 text-slate-800 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isCompleted ? "Analysing your responses..." : "Typing..."}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_RESPONSES.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qr)}
              disabled={isProcessing || isCompleted}
              className="px-4 py-2 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {qr}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-full">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
            placeholder="Type your response..."
            disabled={isProcessing || isCompleted}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
          />
          <button 
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || isProcessing || isCompleted}
            className="p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
