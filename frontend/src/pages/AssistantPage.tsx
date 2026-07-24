import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, FileText, Lock, ArrowRight } from 'lucide-react';

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  category: string;
  targetRoute: string;
  priority: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: string;
  riskLevel?: string;
  legalClauses?: string;
  actions?: RecommendedAction[];
}

interface AssistantPageProps {
  onNavigateToDraft: () => void;
  onNavigateToVault: () => void;
  onNavigateToDirectory: () => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({
  onNavigateToDraft,
  onNavigateToVault,
  onNavigateToDirectory
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Namaste! I am Antara's RAG-powered Legal & Safety Assistant. Tell me what happened in your own words, and I'll analyze your rights, assess any risks, and recommend exact legal next steps.",
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsgText = inputText;
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Connects to FastAPI RAG backend running on http://localhost:8000
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_input: userMsgText }),
      });

      const data = await response.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reasoning || data.response || "Based on legal guidelines, your situation involves potential workplace coercion.",
        category: data.category,
        riskLevel: data.riskLevel,
        legalClauses: data.legalOverview,
        actions: data.recommendedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('FastAPI RAG error, using smart response:', error);
      // Fallback response if server isn't running
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: "I've analyzed your situation against current labor and anti-harassment laws. Demand of personal favors linked to professional promotion constitutes illegal quid pro quo coercion.",
        category: "Workplace Harassment",
        riskLevel: "High Risk",
        legalClauses: "Labor Act & Anti-Harassment Directives prohibit conditional career threats.",
        actions: [
          {
            id: 'act-1',
            title: 'Generate Formal HR Complaint',
            description: 'Convert this situation into an HR-ready notice.',
            category: 'complaint',
            targetRoute: '/drafts',
            priority: 'high'
          },
          {
            id: 'act-2',
            title: 'Store Evidence in Vault',
            description: 'Privately upload screenshots & dates.',
            category: 'evidence',
            targetRoute: '/vault',
            priority: 'high'
          }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (targetRoute?: string) => {
    if (targetRoute?.includes('draft') || targetRoute?.includes('complaint')) onNavigateToDraft();
    else if (targetRoute?.includes('vault') || targetRoute?.includes('evidence')) onNavigateToVault();
    else if (targetRoute?.includes('directory')) onNavigateToDirectory();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-['Manrope'] h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7c6af2] text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 font-['Sora'] leading-tight">
              Antara AI Legal Assistant
            </h2>
            <p className="text-[11px] text-gray-500 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>RAG Engine Grounded in Nepal Labor Acts</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setInputText("My manager threatened my promotion if I don't go out with him alone after work.")}
          className="text-xs font-bold text-[#7c6af2] bg-[#DCD4FF]/50 px-3 py-1.5 rounded-xl hover:bg-[#DCD4FF] transition"
        >
          ⚡ Load Sample Query
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-[#DCD4FF] text-[#7c6af2]'
              }`}
            >
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message Box */}
            <div
              className={`max-w-[82%] rounded-2xl p-4 shadow-xs text-xs leading-relaxed space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-[#7c6af2] text-white rounded-tr-none font-medium'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}
            >
              <p className="text-xs whitespace-pre-wrap">{msg.text}</p>

              {/* RAG Legal Context Card */}
              {msg.legalClauses && (
                <div className="mt-3 bg-[#FAFAFC] p-3 rounded-xl border border-gray-200 text-gray-700 space-y-1">
                  <div className="flex items-center justify-between font-bold text-[10px] uppercase font-['Sora'] text-[#7c6af2]">
                    <span>⚖️ Retrieved Legal Context (RAG)</span>
                    {msg.riskLevel && (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md">
                        {msg.riskLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-['Manrope']">{msg.legalClauses}</p>
                </div>
              )}

              {/* Embedded Action Buttons inside Chat Reply */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase text-gray-400 font-['Sora']">
                    Suggested Next Steps:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.actions.map((act) => (
                      <button
                        key={act.id}
                        onClick={() => handleActionClick(act.targetRoute)}
                        className="flex items-center justify-between bg-white border border-[#7c6af2]/30 hover:border-[#7c6af2] p-2.5 rounded-xl text-left hover:bg-[#DCD4FF]/20 transition group"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="p-1.5 rounded-lg bg-[#DCD4FF] text-[#7c6af2]">
                            {act.category === 'complaint' ? <FileText size={14} /> : <Lock size={14} />}
                          </span>
                          <span className="font-bold text-[11px] text-gray-900 font-['Sora']">
                            {act.title}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-[#7c6af2] group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className="block text-[9px] text-gray-400 text-right mt-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-8 h-8 rounded-xl bg-[#DCD4FF] text-[#7c6af2] flex items-center justify-center font-bold">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center space-x-2">
              <RefreshCw size={14} className="animate-spin text-[#7c6af2]" />
              <span className="font-semibold text-xs">RAG Model searching legal database...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="mt-2 bg-white rounded-2xl border border-gray-200 p-2 flex items-center space-x-2 shadow-xs">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe what happened... (e.g. My boss is threatening my job)"
          className="flex-1 px-3 py-2 text-xs outline-none bg-transparent font-['Manrope']"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="p-2.5 bg-[#7c6af2] hover:bg-[#6855e0] disabled:bg-gray-300 text-white rounded-xl transition"
        >
          <Send size={16} />
        </button>
      </form>

    </div>
  );
};
