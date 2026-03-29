import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Force Node.js runtime to support crypto/bcryptjs
export const runtime = "nodejs";

const handleI18nRouting = createMiddleware(routing);

const adminRoutes = [
    "/dashboard",
    "/members",
    "/coins",
    "/books",
    "/borrows",
    "/activities",
    "/classes",
    "/reports",
    "/settings",
    "/owner",
];

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const userType = req.auth?.user?.type;
    const userRole = req.auth?.user?.role;

    // Strip the locale prefix for authorization checks
    // This allows '/th/dashboard' and '/en/dashboard' to both match '/dashboard'
    const pathWithoutLocale = nextUrl.pathname.replace(new RegExp(`^/(${routing.locales.join('|')})`), '');
    const cleanPath = pathWithoutLocale || '/';

    // Check if trying to access an admin route
    const isAdminRoute = adminRoutes.some(
        (route) =>
            cleanPath === route || cleanPath.startsWith(`${route}/`)
    );

    if (isAdminRoute) {
        if (!isLoggedIn || userType !== "ADMIN") {
            // Redirect to the login page, preserving the current locale if present, else default to 'th'
            const localeMatch = nextUrl.pathname.match(new RegExp(`^/(${routing.locales.join('|')})`));
            const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
            return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
        }
    }

    // Check Super Admin route restriction
    if (cleanPath.startsWith("/reports/revenue") || cleanPath.startsWith("/owner")) {
        if (userRole !== "SUPER_ADMIN") {
            const localeMatch = nextUrl.pathname.match(new RegExp(`^/(${routing.locales.join('|')})`));
            const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
            return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl));
        }
    }

    // Process the internationalization routing (Sets cookies, headers, handles default locale redirects)
    return handleI18nRouting(req);
});

export const config = {
    // Match all paths except API, static assets, images, and public static files
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)"],
};
