import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getCurrentUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const session = await getCurrentUser()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, email, currentPassword, newPassword } = body

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (name && name.trim()) {
      updateData.name = String(name).trim()
    }

    if (email && email.trim() && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase()
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Email is already in use by another user' }, { status: 409 })
      }
      updateData.email = normalizedEmail
    }

    // Password change handling
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
      }

      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!isMatch) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
      }

      if (String(newPassword).length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }

      updateData.passwordHash = await bcrypt.hash(String(newPassword), 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error('Settings profile update error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 })
  }
}
