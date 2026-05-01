import { next } from '@vercel/functions'
import {
  getAuthConfigState,
  getAuthCookieName,
  isAccessTokenValid,
} from './lib/site-auth.js'

const ALLOWED_PATHS = new Set(['/unlock.html', '/api/auth', '/api/logout'])

function readCookieValue(cookieHeader: string | undefined, key: string): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=')
    if (name === key) {
      return rest.join('=')
    }
  }

  return null
}

export default async function middleware(request: Request) {
  const requestUrl = new URL(request.url)

  if (
    ALLOWED_PATHS.has(requestUrl.pathname) ||
    requestUrl.pathname.startsWith('/.well-known/') ||
    requestUrl.pathname.startsWith('/_vercel/')
  ) {
    return next()
  }

  const { password, passwordHash, secret } = getAuthConfigState()
  if ((!password && !passwordHash) || !secret) {
    return new Response('Password protection is not configured.', { status: 503 })
  }

  const token = readCookieValue(request.headers.get('cookie') ?? undefined, getAuthCookieName())
  if (token && await isAccessTokenValid(secret, token)) {
    return next()
  }

  const nextPath = `${requestUrl.pathname}${requestUrl.search}`
  const redirectUrl = new URL('/unlock.html', requestUrl)
  if (nextPath && nextPath !== '/unlock.html') {
    redirectUrl.searchParams.set('next', nextPath)
  }

  return Response.redirect(redirectUrl.toString(), 302)
}
