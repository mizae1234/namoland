import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { SessionProvider } from "next-auth/react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <SessionProvider session={session}>
            <div className="min-h-screen bg-slate-50">
                <Sidebar userName={session.user.name || "Admin"} />
                <main className="ml-64 p-8">
                    {children}
                </main>
            </div>
        </SessionProvider>
    );
}
