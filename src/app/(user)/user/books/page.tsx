import prisma from "@/lib/prisma";
import { BookOpen, Youtube } from "lucide-react";

export default async function UserBooksPage() {
    const books = await prisma.book.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold text-slate-800 mb-4">หนังสือ</h1>

            <div className="space-y-3">
                {books.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                        ยังไม่มีหนังสือ
                    </div>
                ) : (
                    books.map((book) => (
                        <div
                            key={book.id}
                            className="bg-white rounded-xl p-4 border border-slate-100"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{book.title}</h3>
                                    {book.category && (
                                        <p className="text-xs text-slate-400 mt-0.5">{book.category}</p>
                                    )}
                                    {book.ageRange && (
                                        <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                            {book.ageRange}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${book.isAvailable
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                >
                                    {book.isAvailable ? "ว่าง" : "ถูกยืม"}
                                </span>
                            </div>
                            {book.youtubeUrl && (
                                <a
                                    href={book.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 mt-3 text-xs text-red-500 font-medium hover:text-red-700"
                                >
                                    <Youtube size={14} />
                                    ดู YouTube
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
