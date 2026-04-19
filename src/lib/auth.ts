import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            id: "admin-login",
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.adminUser.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user) return null;

                // Use dynamic import for bcryptjs to handle ESM/CJS compatibility
                const bcryptModule = await import("bcryptjs");
                const bcrypt = bcryptModule.default || bcryptModule;

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        type: "ADMIN",
                    };
                }

                return null;
            },
        }),
        CredentialsProvider({
            id: "user-login",
            name: "User Login",
            credentials: {
                phone: { label: "Phone", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.password) return null;

                const phoneInput = credentials.phone as string;
                const phone = phoneInput.replace(/\D/g, "");
                
                const user = await prisma.user.findUnique({
                    where: { phone },
                });

                if (!user || !user.password) return null;

                const bcryptModule = await import("bcryptjs");
                const bcrypt = bcryptModule.default || bcryptModule;

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        name: user.parentName,
                        email: phone,
                        role: "USER",
                        type: "USER",
                    };
                }

                return null;
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.type = user.type;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.type = token.type as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
