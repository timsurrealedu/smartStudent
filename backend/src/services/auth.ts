import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/db'
import { RegisterInput, LoginInput } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'smartstudent-secret-key'
const TOKEN_EXPIRY = '7d'

function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export async function register(req: Request, res: Response) {
  try {
    const { email, name, password } = req.body as RegisterInput

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword } as any
    })

    const token = generateToken(user.id)

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (err: any) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as LoginInput

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, (user as any).password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(user.id)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
  } catch (err: any) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const userId = (req as any).userId
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (err: any) {
    console.error('GetMe error:', err)
    res.status(500).json({ error: 'Failed to get user' })
  }
}
