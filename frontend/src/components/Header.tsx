"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
        <Sparkles className="w-6 h-6 text-indigo-custom" />
        <span>Personal AI</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for user profile or status */}
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
          EK
        </div>
      </div>
    </header>
  );
}
