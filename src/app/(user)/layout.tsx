import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserNav from "./UserNav";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session?.user || session.user.type !== "USER") {
        redirect("/user/login");
    }

    return (
        <div className="min-h-screen bg-[#f4f1de] pb-20">
            <main className="max-w-lg mx-auto">{children}</main>
            <UserNav />
        </div>
    );
}
