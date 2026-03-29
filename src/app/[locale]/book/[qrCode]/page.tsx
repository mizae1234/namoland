import { getBookByQrCodePublic } from "@/actions/borrow";
import { notFound } from "next/navigation";
import { BookOpen, Youtube, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import ReserveButton from "./_components/ReserveButton";
import UserNav from "@/app/[locale]/(user)/UserNav";
import { getTranslations } from "next-intl/server";

export default async function BookLandingPage({
    params,
}: {
    params: Promise<{ qrCode: string; locale: string }>;
}) {
    const { qrCode } = await params;
    const book = await getBookByQrCodePublic(qrCode);

    if (!book || !book.isActive) notFound();

    const t = await getTranslations("BookQrLanding");
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const isUser = session?.user?.type === "USER";

    return (
        <div className={`min-h-screen bg-gradient-to-br from-[#f4f1de] via-[#f4f1de] to-[#d1cce7]/20 flex items-center justify-center p-4 ${isLoggedIn && isUser ? 'pb-24' : ''}`}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6">
                    <Image src="/namoland-logo.png" alt="Namoland" width={64} height={64} className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg shadow-[#81b29a]/30 mb-3" />
                    <h1 className="text-lg font-bold text-[#3d405b]">Namoland</h1>
                </div>

                {/* Book Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-[#d1cce7]/30/50 p-6 border border-[#d1cce7]/20">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <BookOpen size={28} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#3d405b]">{book.title}</h2>
                            {book.category && (
                                <span className="inline-block mt-1 text-xs bg-[#d1cce7]/15 text-[#3d405b]/50 px-2.5 py-0.5 rounded-full">
                                    {book.category}
                                </span>
                            )}
                            {book.ageRange && (
                                <span className="inline-block mt-1 ml-1 text-xs bg-[#81b29a]/10 text-[#609279] px-2.5 py-0.5 rounded-full">
                                    {book.ageRange}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="mb-6 p-3 rounded-xl bg-[#f4f1de]/50 border border-[#d1cce7]/20">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#3d405b]/50">{t("statusLabel")}</span>
                            <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${book.isAvailable
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                    }`}
                            >
                                {book.isAvailable ? t("available") : t("borrowed")}
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
                                {t("youtubeBtn")}
                            </a>
                        )}

                        {/* Reserve/Borrow Button */}
                        {book.isAvailable ? (
                            isLoggedIn && isUser ? (
                                <ReserveButton bookId={book.id} />
                            ) : (
                                <Link
                                    href={`/user/login?callbackUrl=/book/${book.qrCode}`}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30"
                                >
                                    <ShoppingCart size={20} />
                                    {t("loginToReserveBtn")}
                                </Link>
                            )
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 py-3 bg-[#d1cce7]/25 text-[#3d405b]/50 font-medium rounded-xl cursor-not-allowed">
                                <ShoppingCart size={20} />
                                {t("unavailableBtn")}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-[#3d405b]/40 mt-6">
                    {t("footer")}
                </p>
            </div>
            {isLoggedIn && isUser && <UserNav />}
        </div>
    );
}
