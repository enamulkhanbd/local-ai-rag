"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, FileText, Loader2, Search, Copy, Check, Sparkles, Database } from 'lucide-react';
import axios from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { API_BASE } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  providerUsed?: string;
  fallbackFrom?: string;
}

const setupSteps = [
  {
    icon: Sparkles,
    title: "Choose a provider",
    description: "Use the selector in the sidebar header to choose which AI model should answer.",
  },
  {
    icon: FileText,
    title: "Add your sources",
    description: "Upload Office files, PDFs, text files, images, audio, video, or paste a website URL.",
  },
  {
    icon: Database,
    title: "Initialize and ask",
    description: "Build the knowledge base once, then ask questions in the chat input below.",
  },
];

const starterPrompts = [
  "Summarize the key ideas across everything I uploaded.",
  "What are the most important facts, risks, and deadlines in these materials?",
  "Turn this knowledge base into a short briefing with action items.",
];

function TypingIndicator() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F7FB] px-4 py-3 shadow-[0px_8px_24px_rgba(15,23,42,0.05)]"
      aria-label="AI is typing"
      role="status"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2.5 w-2.5 rounded-full bg-[#2c3ca4]"
          animate={
            shouldReduceMotion
              ? { opacity: 0.75, y: 0, scale: 1 }
              : { opacity: [0.35, 1, 0.35], y: [0, -4, 0], scale: [0.88, 1, 0.88] }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: 1.05,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: index * 0.16,
                }
          }
        />
      ))}
      <span className="sr-only">Assistant is typing</span>
    </div>
  );
}

export default function Chat({ provider, knowledgeChunks }: { provider: string; knowledgeChunks: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasKnowledge = knowledgeChunks > 0;

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
        source: res.data.source,
        providerUsed: res.data.provider_used,
        fallbackFrom: res.data.fallback_from
      }]);
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: typeof detail === "string" && detail.trim()
          ? detail
          : "Error connecting to AI. Please ensure your backend is running." 
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

  const handleStarterPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-10"
      >
        {messages.length > 0 ? (
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
                      : "bg-transparent text-[#1c1c1c] assistant-response-enter"
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
                      {msg.providerUsed && <span className="text-gray-400">· {msg.providerUsed}</span>}
                      {msg.fallbackFrom && <span className="text-[#90A4AE]">fallback from {msg.fallbackFrom}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[72%] rounded-2xl px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-full flex items-center">
            <div className="max-w-[980px] mx-auto w-full space-y-6">
              <section className="rounded-[30px] border border-[#DCE3EA] bg-gradient-to-br from-white via-[#F7F8FC] to-[#EEF0FA] px-8 py-8 shadow-[0px_18px_45px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-[580px]">
                    <div className="inline-flex h-9 items-center rounded-full border border-[#D7DEEA] bg-white/80 px-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2c3ca4]">
                      {hasKnowledge ? "Knowledge Base Ready" : "Start Here"}
                    </div>
                    <h1 className="mt-5 text-[34px] leading-[1.05] font-semibold tracking-[-0.04em] text-[#17202A] sm:text-[42px]">
                      {hasKnowledge
                        ? "Your workspace is ready for the first question."
                        : "Turn your files and websites into a personal AI workspace."}
                    </h1>
                    <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[#607D8B]">
                      {hasKnowledge
                        ? `Your knowledge base has been initialized with ${knowledgeChunks} searchable chunks. Ask a question below or use one of the starter prompts to begin.`
                        : "Choose a provider, add files or a website from the left sidebar, and initialize the knowledge base. After that, the assistant will answer from your sources first and fall back to general AI when needed."}
                    </p>
                  </div>

                  <div className="w-full max-w-[280px] rounded-[24px] border border-white/80 bg-white/85 px-5 py-5 shadow-[0px_10px_30px_rgba(44,60,164,0.08)] backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#90A4AE]">
                      Active Provider
                    </p>
                    <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#17202A]">
                      {provider}
                    </p>
                    <div className="mt-4 rounded-2xl bg-[#F5F7FB] px-4 py-4">
                      <p className="text-[13px] font-medium text-[#263238]">
                        {hasKnowledge ? "Ready to chat with your indexed content." : "Setup takes less than a minute."}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-6 text-[#607D8B]">
                        {hasKnowledge
                          ? "Ask for summaries, comparisons, action items, or exact details from your uploaded sources."
                          : "Start in the sidebar: select a model, upload documents or media, or add a URL, then click Initiate Knowledge Base."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {hasKnowledge ? (
                <section className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-3">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleStarterPrompt(prompt)}
                        className="rounded-[24px] border border-[#DCE3EA] bg-white px-5 py-5 text-left shadow-[0px_8px_24px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#2c3ca4] hover:shadow-[0px_12px_28px_rgba(44,60,164,0.12)]"
                      >
                        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2c3ca4]">
                          <Sparkles className="h-4 w-4" />
                          Prompt Starter
                        </div>
                        <p className="mt-4 text-[15px] leading-7 text-[#263238]">
                          {prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[13px] text-[#78909C]">
                    Select a starter prompt or type your own question below.
                  </p>
                </section>
              ) : (
                <>
                  <section className="grid gap-4 md:grid-cols-3">
                    {setupSteps.map((step, index) => {
                      const Icon = step.icon;

                      return (
                        <article
                          key={step.title}
                          className="rounded-[24px] border border-[#E1E7EE] bg-white px-5 py-5 shadow-[0px_10px_30px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF0FA] text-[#2c3ca4]">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B0BEC5]">
                              Step {index + 1}
                            </span>
                          </div>
                          <h2 className="mt-5 text-[18px] font-semibold tracking-[-0.03em] text-[#17202A]">
                            {step.title}
                          </h2>
                          <p className="mt-2 text-[14px] leading-6 text-[#607D8B]">
                            {step.description}
                          </p>
                        </article>
                      );
                    })}
                  </section>

                  <section className="rounded-[24px] border border-[#E1E7EE] bg-[#FCFCFD] px-6 py-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#90A4AE]">
                      After Setup
                    </p>
                    <p className="mt-3 max-w-[760px] text-[14px] leading-7 text-[#607D8B]">
                      Ask for summaries, extract decisions, compare sections across documents, or pull facts from a website you added. The first useful state is to initialize your knowledge base in the sidebar.
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-0 pb-[72px] pt-0">
        <div className="max-w-[670px] mx-auto flex items-center gap-[14px]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1c1c1c]" strokeWidth={1.75} />
            <input 
              ref={inputRef}
              type="text" 
              placeholder={hasKnowledge ? "Ask about your knowledge base" : "Ask anything or start by adding knowledge on the left"} 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full h-12 pl-12 pr-6 bg-[#FAFAFA] rounded-[999px] border border-[#B0BEC5] text-[14px] text-[#1c1c1c] placeholder:text-[rgba(28,28,28,0.2)] outline-none focus:border-[#2c3ca4]"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="w-12 h-12 bg-[#2c3ca4] rounded-full flex items-center justify-center text-white hover:bg-[#263694] transition-colors shadow-[0px_4px_14px_rgba(44,60,164,0.28)] disabled:cursor-not-allowed disabled:bg-[#8090d6]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2.25} />}
          </button>
        </div>
      </div>
    </div>
  );
}
