import { getBookByQrCodePublic } from "@/actions/borrow";
import { notFound } from "next/navigation";
import { BookOpen, Youtube, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import ReserveButton from "./_components/ReserveButton";

export default async function BookLandingPage({
    params,
}: {
    params: Promise<{ qrCode: string }>;
}) {
    const { qrCode } = await params;
    const book = await getBookByQrCodePublic(qrCode);

    if (!book || !book.isActive) notFound();

    const session = await auth();
    const isLoggedIn = !!session?.user;
    const isUser = session?.user?.type === "USER";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl mb-3 shadow-lg shadow-blue-200">
                        <span className="text-white text-2xl font-bold">N</span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-800">Namoland</h1>
                </div>

                {/* Book Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BookOpen size={28} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{book.title}</h2>
                            {book.category && (
                                <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                                    {book.category}
                                </span>
                            )}
                            {book.ageRange && (
                                <span className="inline-block mt-1 ml-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                                    {book.ageRange}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">สถานะ</span>
                            <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${book.isAvailable
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                            >
                                {book.isAvailable ? "ว่าง" : "ถูกยืม"}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {/* YouTube Button */}
                        {book.youtubeUrl && (
                            <a
                                href={book.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-200"
                            >
                                <Youtube size={20} />
                                ดู YouTube
                            </a>
                        )}

                        {/* Reserve/Borrow Button */}
                        {book.isAvailable ? (
                            isLoggedIn && isUser ? (
                                <ReserveButton bookId={book.id} />
                            ) : (
                                <Link
                                    href={`/user/login?callbackUrl=/book/${book.qrCode}`}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-200"
                                >
                                    <ShoppingCart size={20} />
                                    เข้าสู่ระบบเพื่อจองยืม
                                </Link>
                            )
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 py-3 bg-slate-200 text-slate-500 font-medium rounded-xl cursor-not-allowed">
                                <ShoppingCart size={20} />
                                หนังสือถูกยืมอยู่
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    © 2026 Namoland. ห้องสมุดนโมแลนด์
                </p>
            </div>
        </div>
    );
}
