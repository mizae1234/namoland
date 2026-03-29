"use client";

import { useState, useEffect, useRef } from "react";
import { getMemberByQrCode } from "@/actions/member";
import { getBookByQrCode } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, User, BookOpen } from "lucide-react";
import BackLink from "@/components/ui/BackLink";
import AlertMessage from "@/components/ui/AlertMessage";
import Card from "@/components/ui/Card";

type ScanResult =
    | { type: "member"; data: Awaited<ReturnType<typeof getMemberByQrCode>> }
    | { type: "book"; data: Awaited<ReturnType<typeof getBookByQrCode>> }
    | null;

export default function ScanPage() {
    const router = useRouter();
    const t = useTranslations("AdminBorrows.scan");
    const [scanning, setScanning] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [result, setResult] = useState<ScanResult>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef<HTMLDivElement>(null);
    const html5QrRef = useRef<unknown>(null);

    const lookupQrCode = async (code: string) => {
        setLoading(true);
        setError("");
        setResult(null);

        // Try member QR first
        if (code.startsWith("NML-")) {
            const member = await getMemberByQrCode(code);
            if (member) {
                setResult({ type: "member", data: member });
                setLoading(false);
                return;
            }
        }

        // Try book QR
        if (code.startsWith("BOOK-")) {
            const book = await getBookByQrCode(code);
            if (book) {
                setResult({ type: "book", data: book });
                setLoading(false);
                return;
            }
        }

        // Try both if prefix doesn't match
        const [member, book] = await Promise.all([
            getMemberByQrCode(code),
            getBookByQrCode(code),
        ]);

        if (member) {
            setResult({ type: "member", data: member });
        } else if (book) {
            setResult({ type: "book", data: book });
        } else {
            setError(t("notFound"));
        }

        setLoading(false);
    };

    const startScanner = async () => {
        setScanning(true);
        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const scanner = new Html5Qrcode("qr-reader");
            html5QrRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText: string) => {
                    await scanner.stop();
                    setScanning(false);
                    lookupQrCode(decodedText);
                },
                () => { }
            );
        } catch {
            setError(t("cameraError"));
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        const scanner = html5QrRef.current as { stop: () => Promise<void> } | null;
        if (scanner) {
            try { await scanner.stop(); } catch { }
        }
        setScanning(false);
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) lookupQrCode(manualCode.trim());
    };

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const totalCoins = result?.type === "member" && result.data
        ? result.data.coinPackages.reduce((s, p) => s + p.remainingCoins, 0)
        : 0;

    return (
        <div className="max-w-2xl mx-auto">
            <BackLink href="/borrows" label={t("backToBorrows")} />

            <h1 className="text-2xl font-bold text-[#3d405b] mb-6">{t("title")}</h1>

            {/* Scanner Area */}
            <Card className="mb-6">
                {scanning ? (
                    <div>
                        <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden mb-4" />
                        <button
                            onClick={stopScanner}
                            className="w-full py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
                        >
                            {t("stopScan")}
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <button
                            onClick={startScanner}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#609279] text-white rounded-xl font-medium hover:bg-[#609279] transition-colors shadow-md shadow-[#81b29a]/30"
                        >
                            <Camera size={20} />
                            {t("startScan")}
                        </button>
                    </div>
                )}

                {/* Manual Input */}
                <div className="mt-6 pt-6 border-t border-[#d1cce7]/20">
                    <p className="text-sm text-[#3d405b]/50 mb-3">{t("manualInput")}</p>
                    <form onSubmit={handleManualSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder={t("placeholder")}
                            className="flex-1 px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2.5 bg-[#3d405b] text-white rounded-xl text-sm font-medium hover:bg-[#3d405b]/80 disabled:opacity-50"
                        >
                            {t("searchBtn")}
                        </button>
                    </form>
                </div>
            </Card>

            <AlertMessage message={error} />

            {loading && (
                <div className="text-center py-8 text-[#3d405b]/40">
                    <div className="w-8 h-8 border-2 border-[#609279] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t("searching")}
                </div>
            )}

            {/* Member Result */}
            {result?.type === "member" && result.data && (
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[#81b29a]/15 rounded-2xl flex items-center justify-center">
                            <User size={24} className="text-[#609279]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#3d405b]">{result.data.parentName}</h2>
                            <p className="text-sm text-[#3d405b]/50">{result.data.phone}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-xs text-[#3d405b]/40">{t("memberCoins")}</p>
                            <p className="text-xl font-bold text-emerald-600">{totalCoins}</p>
                        </div>
                    </div>

                    {result.data.children.length > 0 && (
                        <div className="flex gap-2 mb-4">
                            {result.data.children.map((c) => (
                                <span key={c.id} className="text-xs bg-[#81b29a]/10 text-[#609279] px-2 py-0.5 rounded-full">{c.name}</span>
                            ))}
                        </div>
                    )}

                    {result.data.borrowRecords.length > 0 && (
                        <div className="bg-amber-50 rounded-xl p-3 mb-4">
                            <p className="text-xs font-semibold text-amber-700 mb-1">
                                {t("borrowingCount", { count: result.data.borrowRecords.length })}
                            </p>
                            {result.data.borrowRecords.map((br) => (
                                <p key={br.id} className="text-xs text-amber-600">
                                    {br.items.map((i) => i.book.title).join(", ")}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push(`/borrows/new/${result.data!.id}`)}
                            className="flex-1 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#609279] transition-colors"
                        >
                            {t("borrowBtn")}
                        </button>
                        {result.data.borrowRecords.length > 0 && (
                            <button
                                onClick={() => router.push(`/borrows/${result.data!.borrowRecords[0].id}`)}
                                className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                            >
                                {t("returnBtn")}
                            </button>
                        )}
                        <button
                            onClick={() => router.push(`/members/${result.data!.id}`)}
                            className="flex-1 py-2.5 bg-[#d1cce7]/25 text-[#3d405b]/80 rounded-xl text-sm font-medium hover:bg-[#3d405b]/30 transition-colors"
                        >
                            {t("profileBtn")}
                        </button>
                    </div>
                </Card>
            )}

            {/* Book Result */}
            {result?.type === "book" && result.data && (
                <Card>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                            <BookOpen size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#3d405b]">{result.data.title}</h2>
                            <p className="text-sm text-[#3d405b]/50">{result.data.qrCode}</p>
                        </div>
                    </div>

                    {result.data.category && (
                        <p className="text-sm text-[#3d405b]/50 mb-2">{t("bookCategory", { category: result.data.category })}</p>
                    )}

                    <div className="flex gap-3">
                        {result.data.youtubeUrl && (
                            <a
                                href={result.data.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 text-center transition-colors"
                            >
                                {t("youtubeBtn")}
                            </a>
                        )}
                        {result.data.isAvailable ? (
                            <button
                                onClick={() => {
                                    // Navigate to scan page with pre-selected book
                                    // User will need to scan member QR next
                                    setResult(null);
                                    setError(t("borrowBookAlert"));
                                }}
                                className="flex-1 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#609279] text-center transition-colors"
                            >
                                {t("borrowBookBtn")}
                            </button>
                        ) : (
                            <span className="flex-1 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium text-center">
                                {t("borrowedBy", { name: result.data.borrowItems[0]?.borrowRecord.user.parentName })}
                            </span>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
