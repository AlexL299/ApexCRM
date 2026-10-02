'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AICopilotDrawer } from '@/components/ai/AICopilotDrawer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that render without the sidebar/topbar shell
  const isBarePage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/lead-capture';

  // Lead capture is full-width, auth pages are centered cards
  if (pathname === '/lead-capture') {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a' }}>
        {children}
      </main>
    );
  }

  if (isBarePage) {
    return (
      <main className="min-h-screen w-full bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {children}
      </main>
    );
  }


  return (
    <>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <Topbar />
          <main className="page-content animate-fade-in">
            {children}
          </main>
        </div>
      </div>
      <AICopilotDrawer />
    </>
  );
}
