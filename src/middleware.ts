// frontend/src/middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  // Get the current date/time for logging
  const currentDateTimeUTC = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  // Log for debugging
  console.log(`[${currentDateTimeUTC}] Middleware - User: ${session?.user?.email || 'Guest'} - Path: ${req.nextUrl.pathname}`)

  // If user is logged in and trying to access login/register pages
  if (session && (
    req.nextUrl.pathname.startsWith('/auth/login') ||
    req.nextUrl.pathname.startsWith('/auth/register')
  )) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Protected routes - user must be logged in
  const protectedRoutes = [
    '/profile',
    '/bookings',
    '/booking/confirmation',
    '/booking/', // This protects all booking routes including the [flightId] routes
    '/account',
    '/dashboard'
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Check for protected API routes
  const protectedApiRoutes = [
    '/api/user',
    '/api/bookings',
    '/api/account',
    '/api/profile'
  ]

  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (!session && isProtectedRoute) {
    // Store the original URL for redirection after login
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    console.log(`[${currentDateTimeUTC}] Redirecting to login from: ${req.nextUrl.pathname}`)
    return NextResponse.redirect(redirectUrl)
  }

  // Handle API routes that require authentication
  if (isProtectedApiRoute && !session) {
    console.log(`[${currentDateTimeUTC}] Unauthorized API access: ${req.nextUrl.pathname}`)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Authentication required', 
        timestamp: currentDateTimeUTC, 
        path: req.nextUrl.pathname 
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Special handling for booking cancellation API
  if (req.nextUrl.pathname === '/api/bookings/cancel' && !session) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Authentication required to cancel bookings', 
        timestamp: currentDateTimeUTC
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Allow public access to flight search and airport info APIs
  const publicApiRoutes = [
    '/api/flights/search',
    '/api/airports',
    '/api/auth/'
  ]

  const isPublicApiRoute = publicApiRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // For all other API routes, require authentication
  if (req.nextUrl.pathname.startsWith('/api/') && 
      !isPublicApiRoute && 
      !session) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return res
}

// Only run middleware on specific paths, excluding static assets
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * 1. All static files (e.g. _next/static/*, _next/image/*, etc.)
     * 2. Favicon, fonts, and other browser-specific files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}