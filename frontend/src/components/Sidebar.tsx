"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/api';

const ACCEPTED_UPLOAD_TYPES = [
  ".pdf", ".doc", ".docx", ".docm", ".dot", ".dotx", ".dotm",
  ".xls", ".xlsx", ".xlsm", ".xlt", ".xltx", ".xltm",
  ".ppt", ".pptx", ".pptm", ".pot", ".potx", ".pps", ".ppsx", ".ppsm",
  ".txt", ".md", ".rtf", ".csv", ".tsv", ".json", ".xml", ".html", ".htm",
  ".odt", ".ods", ".odp", ".eml", ".msg", ".mbox",
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff",
  ".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac",
  ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm"
].join(",");

interface SidebarProps {
  onKnowledgeProcessed: (chunks: number) => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
}

export default function Sidebar({ onKnowledgeProcessed, selectedProvider, setSelectedProvider }: SidebarProps) {
  const [providers, setProviders] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const preferredProvider = "OpenRouter";

  useEffect(() => {
    axios.get(`${API_BASE}/providers`).then(res => {
      const nextProviders = Array.isArray(res.data) ? res.data : [];
      setProviders(nextProviders);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (providers.length > 0 && !providers.includes(selectedProvider)) {
      setSelectedProvider(providers.includes(preferredProvider) ? preferredProvider : providers[0]);
    }
  }, [providers, selectedProvider, setSelectedProvider]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setIsProviderOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processKnowledge = async () => {
    setIsProcessing(true);
    setStatus("Processing...");
    
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    if (url) formData.append("url", url);

    try {
      const res = await axios.post(`${API_BASE}/process-knowledge`, formData);
      onKnowledgeProcessed(res.data.chunks_processed);
      const skippedCount = Array.isArray(res.data.skipped_files) ? res.data.skipped_files.length : 0;
      setStatus(skippedCount > 0 ? `Knowledge initialized with ${skippedCount} skipped file(s).` : "Knowledge Initialized!");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      const detail = axios.isAxiosError(error) ? error.response?.data?.detail : null;
      setStatus(typeof detail === "string" && detail.trim() ? detail : "Error processing knowledge");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <aside className="w-[278px] min-w-[278px] h-full">
      <div className="h-full w-full overflow-y-auto">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="h-10 px-3 rounded-full bg-[#f0f0f0] flex items-center">
              <span className="text-[16px] font-semibold text-[#1c1c1c] leading-6 whitespace-nowrap">
                ✦ Personal AI
              </span>
            </div>
            <div ref={providerMenuRef} className="h-10 flex-1 min-w-0 relative opacity-80">
              <button
                type="button"
                onClick={() => setIsProviderOpen((prev) => !prev)}
                className="h-10 w-full rounded-full bg-transparent px-0 flex items-center justify-between text-[#1c1c1c]"
                aria-label="Select provider"
                aria-expanded={isProviderOpen}
              >
                <span className="text-[14px] font-medium truncate pr-3">{selectedProvider}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isProviderOpen ? "rotate-180" : ""}`} />
              </button>

              {isProviderOpen && (
                <div className="absolute top-[46px] left-0 right-0 rounded-xl border border-[#CFD8DC] bg-white shadow-[0px_10px_24px_rgba(0,0,0,0.08)] p-1.5 z-20">
                  {(providers.length > 0 ? providers : [selectedProvider]).map((provider) => {
                    const isActive = provider === selectedProvider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setIsProviderOpen(false);
                        }}
                        className={`w-full h-9 px-3 rounded-lg text-left text-[14px] transition-colors ${
                          isActive
                            ? "bg-[#EEF0FA] text-[#2c3ca4] font-medium"
                            : "text-[#1c1c1c] hover:bg-[#F5F6FA]"
                        }`}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <section className="flex flex-col gap-6 mt-24">
            <label className="w-full rounded-xl border border-dashed border-[#455A64] bg-[#FAFAFA] px-4 py-6 flex flex-col items-center gap-6 text-center cursor-pointer">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[14px] leading-4 font-medium text-[#263238]">Upload documents, images, audio, or video</p>
                <p className="text-[11px] leading-[13px] text-[#607D8B]">PDF, Office, text, image, audio, video. Limit 200MB per file.</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-4 rounded bg-white border border-[#CFD8DC] text-[14px] leading-4 font-medium text-[#263238] inline-flex items-center hover:bg-[#f8f8f8] transition-colors cursor-pointer"
              >
                Browse
              </button>
              <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_UPLOAD_TYPES} className="hidden" onChange={handleFileChange} />
            </label>

            <div className="flex flex-col gap-2">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="h-10 rounded-xl bg-white px-3 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06),0px_1px_4px_1px_rgba(0,0,0,0.04)] flex items-center justify-between">
                  <span className="text-[14px] text-[#1c1c1c] truncate max-w-[200px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-[#1c1c1c] hover:opacity-70 transition-opacity"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] text-[#1c1c1c]">Open Website</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 rounded-xl border border-[#B0BEC5] bg-[#FAFAFA] px-3 text-[14px] text-[#1c1c1c] outline-none focus:border-[#2c3ca4]"
              />
            </div>

            <button
              onClick={processKnowledge}
              disabled={isProcessing}
              className="h-[52px] rounded-xl bg-[#2c3ca4] hover:bg-[#263694] text-white text-[16px] font-medium leading-5 flex items-center justify-center gap-2 transition-colors disabled:opacity-90"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span aria-hidden>✦</span>}
              Initiate Knowledge Base
            </button>

            {status && <p className="text-center text-[11px] text-[#2c3ca4]">{status}</p>}
          </section>
        </div>
      </div>
    </aside>
  );
}
