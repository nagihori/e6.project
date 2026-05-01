const COOKIE_NAME = 'e6_site_access'
const COOKIE_VALUE = 'granted'
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7

const textEncoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value))
  return toHex(digest)
}

async function hmacSha256(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value))
  return toHex(signature)
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return mismatch === 0
}

export function getAuthConfigState() {
  return {
    password: process.env.SITE_PASSWORD,
    passwordHash: process.env.SITE_PASSWORD_SHA256,
    secret: process.env.SITE_AUTH_SECRET,
  }
}

export async function isPasswordValid(input: string): Promise<boolean> {
  const { password, passwordHash } = getAuthConfigState()

  if (passwordHash) {
    const inputHash = await sha256(input)
    return constantTimeEqual(inputHash, passwordHash.toLowerCase())
  }

  if (password) {
    return constantTimeEqual(input, password)
  }

  return false
}

export async function createAccessToken(secret: string): Promise<string> {
  return hmacSha256(secret, COOKIE_VALUE)
}

export async function isAccessTokenValid(secret: string, token: string): Promise<boolean> {
  const expected = await createAccessToken(secret)
  return constantTimeEqual(token, expected)
}

export function getAuthCookieName(): string {
  return COOKIE_NAME
}

export function getAuthCookieMaxAge(): number {
  return ONE_WEEK_IN_SECONDS
}
