import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  let dbStatus = 'disconnected'
  let dbLatency = 0
  let dbError = null

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - dbStart
    dbStatus = 'connected'
  } catch (err: any) {
    dbStatus = 'error'
    dbError = err?.message || 'Database connection error'
  }

  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const hasSupabaseUrl = !!process.env.DATABASE_URL

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startTime,
    database: {
      provider: 'Supabase PostgreSQL',
      poolerHost: 'aws-0-ap-southeast-2.pooler.supabase.com',
      poolerPort: 6543,
      directPort: 5432,
      configured: hasSupabaseUrl,
      status: dbStatus,
      latencyMs: dbLatency,
      error: dbError,
    },
    ai: {
      provider: "Google Cloud Gemini",
      sdk: "@google/genai",
      configured: hasGeminiKey,
      status: hasGeminiKey ? 'active' : 'missing_key',
      primaryModel: 'gemini-3.5-flash',
      fallbackModels: ['gemini-flash-latest', 'gemini-3.1-flash-lite'],
      features: ['Smart Notes', 'Predictive Next-Action', 'Email Drafting', 'Copilot Drawer'],
    },
    runtime: {
      framework: 'Next.js 16.3.7',
      react: 'React 19.2.8',
      orm: 'Prisma Client 6.19.3',
      turbopack: true,
      environment: process.env.NODE_ENV || 'development',
    },
  })
}
