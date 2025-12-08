import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/inventory') ||
                nextUrl.pathname.startsWith('/settings') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/service') ||
                nextUrl.pathname.startsWith('/sales');

            const isPublicRoute = nextUrl.pathname.startsWith('/public');

            if (isPublicRoute) return true;

            const isLoginPage = nextUrl.pathname.startsWith("/login");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isLoginPage) {
                return Response.redirect(new URL('/inventory', nextUrl));
            }
            return true;
        },
        // We can add simple JWT callbacks here if needed, but complex DB ones go in lib/auth.ts
        // Note: The authorized callback here is used by the generic NextAuth middleware logic if we use it directly.
        // Since we are writing custom middleware but using the config, this logic is portable.
    },
} satisfies NextAuthConfig
