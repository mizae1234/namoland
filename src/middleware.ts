import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Force Node.js runtime to support crypto/bcryptjs
export const runtime = "nodejs";

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

    // Check if trying to access an admin route
    const isAdminRoute = adminRoutes.some(
        (route) =>
            nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
    );

    if (isAdminRoute) {
        if (!isLoggedIn || userType !== "ADMIN") {
            return NextResponse.redirect(new URL("/login", nextUrl));
        }
    }

    // Check Super Admin route restriction
    if (nextUrl.pathname.startsWith("/reports/revenue")) {
        if (userRole !== "SUPER_ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
