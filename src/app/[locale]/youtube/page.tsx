import prisma from "@/lib/prisma";
import { Youtube } from "lucide-react";
import Link from "next/link";

export default async function YouTubePage() {
    const books = await prisma.book.findMany({
        where: { youtubeUrl: { not: null } },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-[#f4f1de]/50">
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mb-3">
                        <Youtube size={28} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#3d405b]">NAMOLAND YouTube</h1>
                    <p className="text-[#3d405b]/50 mt-1">ดูหนังสือและกิจกรรมจากนโมแลนด์</p>
                </div>

                {/* Videos Grid */}
                {books.length === 0 ? (
                    <div className="text-center py-12 text-[#3d405b]/40">
                        ยังไม่มีวิดีโอ YouTube
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {books.map((book) => {
                            // Extract YouTube video ID
                            const videoId = extractYouTubeId(book.youtubeUrl!);

                            return (
                                <div
                                    key={book.id}
                                    className="bg-white rounded-2xl border border-[#d1cce7]/20 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {videoId ? (
                                        <div className="aspect-video">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                title={book.title}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <a
                                            href={book.youtubeUrl!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block aspect-video bg-[#d1cce7]/15 flex items-center justify-center"
                                        >
                                            <Youtube size={48} className="text-red-300" />
                                        </a>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-[#3d405b]">{book.title}</h3>
                                        {book.category && (
                                            <p className="text-xs text-[#3d405b]/40 mt-1">{book.category}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="text-sm text-[#609279] hover:text-[#609279] font-medium"
                    >
                        ← กลับหน้าหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}

function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
        /youtube\.com\/shorts\/([^&\s?]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}
