"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Trash2, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://localhost:8000";

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

  useEffect(() => {
    axios.get(`${API_BASE}/providers`).then(res => setProviders(res.data)).catch(() => {});
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
      setStatus("Knowledge Initialized!");
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus("Error processing knowledge");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <aside className="w-[278px] min-w-[278px] border-r border-[#E5E5E5] bg-white flex flex-col h-full overflow-y-auto p-4 gap-6">
      {/* Logo Area (matches Figma Header) */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-6 h-6 text-[#313DA7]" />
        <span className="font-semibold text-lg">Personal AI</span>
      </div>

      {/* Model Setup */}
      <section>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Model Setup</h3>
        <select 
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="w-full h-10 px-3 bg-white border border-[#E5E5E5] rounded-lg text-sm outline-none appearance-none cursor-pointer hover:border-gray-300 transition-colors"
        >
          {providers.length > 0 ? providers.map(p => (
            <option key={p} value={p}>{p}</option>
          )) : <option>Gemini</option>}
        </select>
      </section>

      {/* Knowledge Base */}
      <section className="flex flex-col gap-4">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Knowledge Base</h3>
        
        {/* Figma Dashed Uploader */}
        <label className="border-[1.5px] border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#313DA7] hover:bg-[#F8F9FF] transition-all group">
          <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#313DA7]" />
          <div className="text-center">
            <p className="text-[13px] font-medium text-gray-600">Drag and drop files here</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Limit 200MB per file</p>
          </div>
          <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileChange} />
          <button className="mt-2 px-6 py-1.5 bg-white border border-gray-200 rounded-md text-[11px] font-semibold hover:bg-gray-50">Browse</button>
        </label>

        {/* File List */}
        <div className="flex flex-col gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between h-10 px-3 bg-white border border-[#E5E5E5] rounded-lg group">
              <span className="text-[12px] text-gray-600 truncate max-w-[180px]">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* URL Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-gray-500">Open Website</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter URL here..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E5E5E5] rounded-lg text-sm outline-none focus:border-[#313DA7] transition-colors"
            />
          </div>
        </div>

        {/* Action Button - Exact Indigo */}
        <button 
          onClick={processKnowledge}
          disabled={isProcessing || (files.length === 0 && !url)}
          className="w-full h-11 bg-[#313DA7] hover:bg-[#252E8C] disabled:bg-gray-200 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Initiate Knowledge Base
        </button>

        {status && (
          <p className="text-center text-[11px] font-medium text-[#313DA7] mt-1">{status}</p>
        )}
      </section>

      <div className="mt-auto pt-4 border-t border-gray-50">
        <button 
          onClick={() => axios.post(`${API_BASE}/clear`)}
          className="w-full h-10 text-gray-400 hover:text-red-500 text-[12px] font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Knowledge
        </button>
      </div>
    </aside>
  );
}

function Sparkles(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}
