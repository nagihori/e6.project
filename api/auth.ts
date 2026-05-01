import {
  createAccessToken,
  getAuthConfigState,
  getAuthCookieMaxAge,
  getAuthCookieName,
  isPasswordValid,
} from '../lib/site-auth'

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  })
}

export async function POST(request: Request) {
  const { password, passwordHash, secret } = getAuthConfigState()
  if ((!password && !passwordHash) || !secret) {
    return jsonResponse(
      {
        ok: false,
        message: 'Password protection is not configured on the server.',
      },
      { status: 500 },
    )
  }

  const payload = await request.json().catch(() => null)
  const rawPassword = payload && typeof payload === 'object' ? payload.password : null
  const submittedPassword = typeof rawPassword === 'string' ? rawPassword : ''
  const valid = await isPasswordValid(submittedPassword)

  if (!valid) {
    return jsonResponse({ ok: false, message: 'Incorrect password.' }, { status: 401 })
  }

  const token = await createAccessToken(secret)
  const cookie = [
    `${getAuthCookieName()}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${getAuthCookieMaxAge()}`,
  ].join('; ')

  return jsonResponse(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
      },
    },
  )
}

export function GET() {
  return jsonResponse({ ok: false, message: 'Method not allowed.' }, {
    status: 405,
    headers: {
      Allow: 'POST',
    },
  })
}
