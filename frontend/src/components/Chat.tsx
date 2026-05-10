"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Search, Globe, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

export default function Chat({ provider }: { provider: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", input);
      formData.append("provider", provider);

      const res = await axios.post(`${API_BASE}/chat`, formData);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.data.response,
        source: res.data.source
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Error connecting to AI. Please ensure your backend is running." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-10 space-y-10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <Bot className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-semibold">How can I help you today?</h2>
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto space-y-10">
            {messages.map((msg, i) => (
              <div key={i} className="flex gap-5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-[#10A37F]' : 'bg-gray-100'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-gray-500" />}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <div className="text-[15px] text-[#2D2D2D] leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </div>
                  {msg.source && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {msg.source === "Knowledge Base" ? <FileText className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {msg.source}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Area - Centered 600px Input */}
      <div className="p-8 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-[670px] mx-auto flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input 
              type="text" 
              placeholder="Type message..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full h-14 pl-14 pr-6 bg-[#F4F4F4] border border-[#E5E5E5] rounded-[28px] text-[15px] outline-none focus:bg-white focus:border-[#313DA7] transition-all"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-[#F4F4F4] border border-[#E5E5E5] rounded-full flex items-center justify-center hover:bg-white hover:border-[#313DA7] hover:text-[#313DA7] disabled:opacity-30 transition-all shadow-sm"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4 font-medium">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
