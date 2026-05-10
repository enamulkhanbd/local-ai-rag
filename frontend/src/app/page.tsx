"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState("Gemini");

  return (
    <main className="fixed inset-0 flex bg-white overflow-hidden select-none">
      <Sidebar 
        onKnowledgeProcessed={() => {}} 
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
      />
      <Chat provider={selectedProvider} />
    </main>
  );
}
