'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AICopilotDrawer } from '@/components/ai/AICopilotDrawer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) {
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
