import { getAuthCookieName } from '../lib/site-auth'

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

export function POST() {
  const cookie = [
    `${getAuthCookieName()}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    'Max-Age=0',
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
