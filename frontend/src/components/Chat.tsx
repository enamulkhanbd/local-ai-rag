"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, FileText, Loader2, Search, Copy, Check } from 'lucide-react';
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
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
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
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Error connecting to AI. Please ensure your backend is running." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 1400);
    } catch {
      setCopiedMessageIndex(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-10 space-y-10"
      >
        {messages.length > 0 && (
          <div className="max-w-[900px] mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[72%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#f0f0f0] text-[#1c1c1c]"
                      : "bg-transparent text-[#1c1c1c]"
                  }`}
                >
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, i)}
                      className="mt-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#607D8B] hover:bg-[#F5F6FA] hover:text-[#2c3ca4] transition-colors"
                      aria-label={copiedMessageIndex === i ? "Copied" : "Copy answer"}
                      title={copiedMessageIndex === i ? "Copied" : "Copy"}
                    >
                      {copiedMessageIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                  {msg.role === "assistant" && msg.source && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">
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

      <div className="px-0 pb-[72px] pt-0">
        <div className="max-w-[670px] mx-auto flex items-center gap-[14px]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1c1c1c]" strokeWidth={1.75} />
            <input 
              type="text" 
              placeholder="Type message" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full h-12 pl-12 pr-6 bg-[#FAFAFA] rounded-[999px] border border-[#B0BEC5] text-[14px] text-[#1c1c1c] placeholder:text-[rgba(28,28,28,0.2)] outline-none focus:border-[#2c3ca4]"
            />
          </div>
          <button 
            onClick={handleSend}
            className="w-12 h-12 bg-[#2c3ca4] rounded-full flex items-center justify-center text-white hover:bg-[#263694] transition-colors shadow-[0px_4px_14px_rgba(44,60,164,0.28)]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2.25} />}
          </button>
        </div>
      </div>
    </div>
  );
}
