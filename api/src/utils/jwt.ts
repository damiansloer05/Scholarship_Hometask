import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const EXPIRES_IN = '30d'

export interface TokenPayload {
  sub: string
  email: string
}

export function signToken(profileId: string, email: string): string {
  return jwt.sign({ sub: profileId, email }, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload
  } catch {
    return null
  }
}
