import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { BookOpen, QrCode, Coins, Youtube } from "lucide-react";

export default async function UserHomePage() {
    const session = await auth();
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            children: true,
            coinPackages: { where: { isExpired: false, remainingCoins: { gt: 0 } } },
            borrowRecords: { where: { status: "BORROWED" }, include: { items: { include: { book: true } } } },
        },
    });

    if (!user) return <div className="p-4 text-center text-slate-400">ไม่พบข้อมูล</div>;

    const totalCoins = user.coinPackages.reduce((s, p) => s + p.remainingCoins, 0);
    const activeBorrows = user.borrowRecords.length;

    const youtubeBooks = await prisma.book.findMany({
        where: { youtubeUrl: { not: null } },
        take: 3,
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-4">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <h1 className="text-xl font-bold">สวัสดี {user.parentName} 👋</h1>
                <p className="text-blue-100 text-sm mt-1">ยินดีต้อนรับสู่ Namoland</p>
                <div className="flex gap-3 mt-4">
                    <Link
                        href="/user/qr"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                        <QrCode size={16} />
                        QR Code
                    </Link>
                    <Link
                        href="/youtube"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 rounded-xl text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                        <Youtube size={16} />
                        YouTube
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Coins size={18} className="text-amber-500" />
                        <span className="text-xs text-slate-500">เหรียญคงเหลือ</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalCoins}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={18} className="text-blue-500" />
                        <span className="text-xs text-slate-500">กำลังยืม</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{activeBorrows} <span className="text-sm font-normal text-slate-400">รายการ</span></p>
                </div>
            </div>

            {/* Current Borrows */}
            {user.borrowRecords.length > 0 && (
                <div className="mb-6">
                    <h2 className="font-semibold text-slate-800 mb-3">หนังสือที่กำลังยืม</h2>
                    <div className="space-y-2">
                        {user.borrowRecords.flatMap((br) =>
                            br.items.map((item) => (
                                <div key={item.id} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BookOpen size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{item.book.title}</p>
                                        <p className="text-xs text-slate-400">
                                            กำหนดคืน: {new Date(br.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* YouTube books preview */}
            {youtubeBooks.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-slate-800">หนังสือใน YouTube</h2>
                        <Link href="/youtube" className="text-xs text-blue-500 font-medium">ดูทั้งหมด →</Link>
                    </div>
                    <div className="space-y-2">
                        {youtubeBooks.map((book) => (
                            <a
                                key={book.id}
                                href={book.youtubeUrl!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100 hover:shadow-sm transition-shadow"
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Youtube size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">{book.title}</p>
                                    <p className="text-xs text-slate-400">{book.category || "หนังสือ"}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
