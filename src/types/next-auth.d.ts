import "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;
        type?: string; // "ADMIN" or "PARENT"
    }

    interface Session {
        user: User & {
            id: string;
            name: string;
            email: string;
            role: string;
            type?: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        name: string;
        email: string;
        role: string;
        type?: string;
    }
}
