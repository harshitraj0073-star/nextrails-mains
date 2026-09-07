import React, { useRef, useEffect, useState } from 'react';
import { MessageCircle, Send, Bot, Trash2, ShieldAlert, Sparkles, Activity, Loader2, HeartHandshake } from 'lucide-react';
import { useChatbot } from '../hooks/useChatbot';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { StressReportModal } from '../components/StressReportModal';
import { AIStatusOrb } from '../components/AIStatusOrb';

export const NexoraAIPage: React.FC = () => {
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    clearConversation,
    stressResult,
    isAnalyzingStress,
    isStressModalOpen,
    setIsStressModalOpen,
    liveStressEstimate,
    userMessagesCount,
    endConversationAndAnalyzeStress
  } = useChatbot();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setRole } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = (action: string) => {
    if (action === 'talk_to_counsellor' || action === 'start_checkin') {
      setRole('victim');
      navigate('/victim');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('view full report') || suggestion.toLowerCase().includes('report')) {
      if (stressResult) {
        setIsStressModalOpen(true);
      } else {
        endConversationAndAnalyzeStress();
      }
    } else if (suggestion.toLowerCase().includes('start new chat')) {
      clearConversation();
    } else if (suggestion.toLowerCase().includes('counsellor')) {
      setRole('victim');
      navigate('/victim');
    } else {
      sendMessage(suggestion);
    }
  };

  const getLiveBadgeColor = (val: number) => {
    if (val >= 85) return 'bg-red-500/20 text-red-200 border-red-400/40';
    if (val >= 65) return 'bg-orange-500/20 text-orange-200 border-orange-400/40';
    if (val >= 40) return 'bg-amber-500/20 text-amber-200 border-amber-400/40';
    return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40';
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              NEXORA AI
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Stress Monitor
              </span>
            </h2>
            <p className="text-sm text-slate-500">Empathetic chat companion with conversational stress scoring (0–100%)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <AIStatusOrb size="sm" showBadge={true} />

          {stressResult && (
            <button
              onClick={() => setIsStressModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-sm"
              title="Open stress assessment"
            >
              <Activity className="w-4 h-4 text-indigo-600" />
              Stress Report: {stressResult.score}%
            </button>
          )}

          <button
            onClick={() => endConversationAndAnalyzeStress()}
            disabled={userMessagesCount === 0 || isAnalyzingStress}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            title={userMessagesCount === 0 ? "Send at least one message to evaluate stress" : "End session and view 0-100% stress analysis"}
          >
            {isAnalyzingStress ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Stress...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                End Chat & View Stress
              </>
            )}
          </button>

          <button
            onClick={clearConversation}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 bg-white rounded-xl transition-colors"
            title="Clear chat and restart"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-3 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Conversational Stress Monitor:</strong> Express how you feel freely. When you finish, click <strong>"End Chat & View Stress"</strong> to receive your calculated emotional stress score (0–100%) and tailored clinical guidance.
        </p>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-0">
        
        {/* Chat Header Bar */}
        <div className="bg-primary px-5 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-primary"></span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">NEXORA AI Companion</p>
              <p className="text-blue-100 text-xs">Empathetic listener & live stress assessment</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {liveStressEstimate !== null && (
              <div 
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${getLiveBadgeColor(liveStressEstimate)}`}
                title="Live conversational stress estimate based on user messages"
              >
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Live Stress: {liveStressEstimate}%
              </div>
            )}
            <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
              {messages.length} messages
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 min-h-0">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const showSuggestions = msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1;
            const showAction = msg.action && idx === messages.length - 1;
            const isStressSummary = msg.content.includes('CONVERSATION CONCLUDED — EMOTIONAL STRESS ASSESSMENT');

            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isUser ? 'bg-indigo-100 text-indigo-700' : isStressSummary ? 'bg-amber-500 text-white' : 'bg-primary text-white'}`}>
                    {isUser ? 'U' : isStressSummary ? <Activity className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : isStressSummary
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-slate-800 shadow-md rounded-bl-sm p-5'
                        : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.content}

                    {isStressSummary && stressResult && (
                      <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-amber-800">
                          Score: {stressResult.score}% ({stressResult.level} Stress)
                        </span>
                        <button
                          onClick={() => setIsStressModalOpen(true)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                        >
                          View Full Breakdown →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] text-slate-400 mt-1 ${isUser ? 'mr-10' : 'ml-10'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Suggestions & Actions on last AI message */}
                {!isUser && (showSuggestions || showAction) && (
                  <div className="ml-10 mt-2 flex flex-wrap gap-2 max-w-[75%]">
                    {showAction && (
                      <button
                        onClick={() => handleAction(msg.action!)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        {msg.action === 'talk_to_counsellor' ? 'Connect with Counsellor' : 'Start Wellbeing Check-in'}
                      </button>
                    )}
                    {showSuggestions && msg.suggestions?.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-600 rounded-full text-xs transition-colors shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start">
              <div className="flex items-end gap-2 max-w-[75%]">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 ml-10">NEXORA AI is listening...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-end gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell NEXORA AI how you are feeling... (e.g. 'I feel anxious about my court hearing')"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none min-h-[48px] max-h-[120px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover disabled:opacity-40 transition-colors shrink-0 flex items-center justify-center shadow-sm"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-2 px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-primary" />
              NEXORA AI evaluates emotional distress markers in real time.
            </span>
            {userMessagesCount > 0 && (
              <button
                onClick={() => endConversationAndAnalyzeStress()}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                Finish chat & evaluate stress score
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stress Report Modal */}
      <StressReportModal
        isOpen={isStressModalOpen}
        onClose={() => setIsStressModalOpen(false)}
        result={stressResult}
        onStartNewChat={clearConversation}
      />
    </div>
  );
};

