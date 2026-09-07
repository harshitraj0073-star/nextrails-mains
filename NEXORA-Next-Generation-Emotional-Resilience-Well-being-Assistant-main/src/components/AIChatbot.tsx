import React, { useRef, useEffect, useState } from 'react';
import { MessageCircle, X, Minus, Send, Bot, Trash2, ShieldAlert, Activity, Loader2 } from 'lucide-react';
import { useChatbot } from '../hooks/useChatbot';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { StressReportModal } from './StressReportModal';

export const AIChatbot: React.FC = () => {
  const { 
    messages, 
    isTyping, 
    isOpen, 
    setIsOpen, 
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

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
    } else {
      alert('Action triggered: ' + action);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-slate-950/40 hover:bg-slate-900/60 border border-sky-400/40 shadow-xl shadow-sky-500/25 flex items-center justify-center backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none cursor-pointer"
        aria-label="Open NEXORA AI Assistant"
        title="Talk to NEX AI"
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-500/30 to-purple-500/30 animate-pulse pointer-events-none"></span>
        <span className="absolute -inset-1 rounded-full border border-sky-400/30 animate-ping opacity-25 pointer-events-none"></span>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-sky-400/60 bg-slate-900 flex items-center justify-center">
          <Bot className="w-6 h-6 text-sky-300" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-sm"></span>
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-[100dvh] sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl flex flex-col border border-slate-200 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-4 py-3 flex items-center justify-between text-white shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-full relative">
              <Bot className="w-5 h-5" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-primary"></span>
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">NEXORA AI Companion</h3>
              <p className="text-[11px] text-blue-100 opacity-90">Conversational Stress Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={clearConversation}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-blue-100 hover:text-white"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-blue-100 hover:text-white hidden sm:block"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-blue-100 hover:text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stress Monitor Action Sub-Bar */}
        <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Activity className="w-3.5 h-3.5 text-primary" />
            {liveStressEstimate !== null ? (
              <span className="font-bold text-slate-800">
                Stress: <span className="text-amber-600">{liveStressEstimate}%</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Live Stress Monitor Active</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {stressResult && (
              <button
                onClick={() => setIsStressModalOpen(true)}
                className="px-2 py-1 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-all shadow-2xs"
              >
                Report: {stressResult.score}%
              </button>
            )}

            <button
              onClick={() => endConversationAndAnalyzeStress()}
              disabled={userMessagesCount === 0 || isAnalyzingStress}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold rounded-lg shadow-2xs text-[11px] transition-all disabled:opacity-50"
              title={userMessagesCount === 0 ? "Send a message first" : "Finish chat and view stress score"}
            >
              {isAnalyzingStress ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Scoring...
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3" />
                  End & View Stress
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-full mb-1">
              Trauma-Informed Safe Space
            </span>
            <p className="text-[11px] text-slate-400 px-2">
              Share how you feel. Click <strong>"End & View Stress"</strong> at any time to receive your 0–100% stress evaluation.
            </p>
          </div>

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const showSuggestions = msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1;
            const showAction = msg.action && idx === messages.length - 1;
            const isStressSummary = msg.content.includes('CONVERSATION CONCLUDED — EMOTIONAL STRESS ASSESSMENT');
            
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-100 text-indigo-600' : isStressSummary ? 'bg-amber-500 text-white' : 'bg-primary text-white'}`}>
                    {isUser ? <span className="text-xs font-bold">U</span> : isStressSummary ? <Activity className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-3 rounded-2xl ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : isStressSummary
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 text-slate-800 shadow-sm rounded-bl-sm p-3.5'
                        : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-bl-sm'
                  } whitespace-pre-wrap text-sm leading-relaxed`}>
                    {msg.content}

                    {isStressSummary && stressResult && (
                      <div className="mt-3 pt-2.5 border-t border-amber-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-amber-900">
                          {stressResult.score}% ({stressResult.level})
                        </span>
                        <button
                          onClick={() => setIsStressModalOpen(true)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-md shadow-2xs transition-all"
                        >
                          View Breakdown →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <span className={`text-[10px] text-slate-400 mt-1 ${isUser ? 'mr-9' : 'ml-9'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Actions & Suggestions (Only on last message) */}
                {!isUser && (showSuggestions || showAction) && (
                  <div className="ml-9 mt-2 flex flex-wrap gap-2 w-full max-w-[85%]">
                    {showAction && (
                      <button 
                        onClick={() => handleAction(msg.action!)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-medium transition-colors w-full justify-center shadow-sm"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        {msg.action === 'talk_to_counsellor' ? 'Connect with Counsellor' : msg.action === 'start_checkin' ? 'Start Wellbeing Check-in' : 'Take Action'}
                      </button>
                    )}
                    {showSuggestions && msg.suggestions?.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-600 rounded-full text-xs transition-colors text-left shadow-2xs"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex flex-col items-start">
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 ml-9">NEXORA AI is listening...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell NEXORA how you feel..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 bottom-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors flex items-center justify-center shadow-2xs"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
            <span>Press Enter to send</span>
            {userMessagesCount > 0 && (
              <button
                onClick={() => endConversationAndAnalyzeStress()}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                End chat & score stress
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
    </>
  );
};

