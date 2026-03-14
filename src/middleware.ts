export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/',
    '/daily/:path*',
    '/predictions/:path*',
    '/profile/:path*',
    '/leaderboards/:path*',
    '/challenges/:path*',
    '/friends/:path*',
    '/results/:path*',
    '/shop/:path*',
    '/admin/:path*',
  ],
};
