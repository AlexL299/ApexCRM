import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { AppShell } from '@/components/layout/AppShell'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ApexCRM — AI-Native CRM',
  description: 'AI-powered CRM for modern sales teams. Manage contacts, deals, and activities with intelligent insights.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  )
}
