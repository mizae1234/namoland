import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Youtube, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function YouTubeBooksPage() {
    const session = await auth();
    if (!session?.user || session.user.type !== "USER") redirect("/user/login");

    const books = await prisma.book.findMany({
        where: { youtubeUrl: { not: null }, isActive: true },
        orderBy: { title: "asc" },
    });

    return (
        <div className="p-4 pb-24">
            {/* Back */}
            <Link href="/user" className="flex items-center gap-1.5 text-[#3d405b]/50 text-sm mb-4 hover:text-[#3d405b]/70 transition-colors">
                <ArrowLeft size={16} />
                กลับหน้าหลัก
            </Link>

            <h1 className="text-xl font-bold text-[#3d405b] mb-4">หนังสือใน YouTube</h1>

            {books.length === 0 ? (
                <div className="text-center py-16 text-[#3d405b]/40">
                    <Youtube size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">ยังไม่มีหนังสือใน YouTube</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {books.map((book) => (
                        <a
                            key={book.id}
                            href={book.youtubeUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-[#d1cce7]/20 hover:shadow-sm transition-shadow"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                <Youtube size={22} className="text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#3d405b] truncate">{book.title}</p>
                                <p className="text-xs text-[#3d405b]/40">{book.category || "หนังสือ"}</p>
                            </div>
                            <span className="text-xs text-red-500 font-medium shrink-0">ดู →</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
