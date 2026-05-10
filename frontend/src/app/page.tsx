"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';

export default function Home() {
  const [selectedProvider, setSelectedProvider] = useState("Gemini");
  const [knowledgeChunks, setKnowledgeChunks] = useState(0);

  return (
    <main className="fixed inset-0 bg-white overflow-hidden select-none p-4">
      <div className="h-full w-full rounded-3xl bg-white overflow-hidden flex">
        <Sidebar
          onKnowledgeProcessed={setKnowledgeChunks}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
        />
        <Chat provider={selectedProvider} knowledgeChunks={knowledgeChunks} />
      </div>
    </main>
  );
}
