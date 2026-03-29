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
            <div className="min-h-screen bg-[#f4f1de] text-[17px]">
                <Sidebar userName={session.user.name || "Admin"} userRole={session.user.role || "ADMIN"} />
                <main className="md:ml-64 p-4 pt-16 md:pt-8 md:p-8">
                    {children}
                </main>
            </div>
        </SessionProvider>
    );
}
