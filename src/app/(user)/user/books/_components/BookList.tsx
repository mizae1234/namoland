"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { searchBooks } from "@/actions/book-search";
import { BookOpen, Youtube, Search, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";

interface Book {
    id: string;
    title: string;
    qrCode: string;
    category: string | null;
    ageRange: string | null;
    youtubeUrl: string | null;
    isAvailable: boolean;
}

type Filter = "ALL" | "AVAILABLE" | "BORROWED";

const FILTERS: { value: Filter; label: string }[] = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "AVAILABLE", label: "ว่าง" },
    { value: "BORROWED", label: "ถูกยืม" },
];

export default function BookList({ initialBooks, initialHasMore }: { initialBooks: Book[]; initialHasMore: boolean }) {
    const [books, setBooks] = useState<Book[]>(initialBooks);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("ALL");
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const doSearch = useCallback(async (query: string) => {
        setLoading(true);
        const result = await searchBooks(query, 0);
        setBooks(result.books as Book[]);
        setHasMore(result.hasMore);
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            doSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, doSearch]);

    const loadMore = async () => {
        setLoadingMore(true);
        const result = await searchBooks(search, books.length);
        setBooks((prev) => [...prev, ...(result.books as Book[])]);
        setHasMore(result.hasMore);
        setLoadingMore(false);
    };

    const filteredBooks = useMemo(() => {
        if (filter === "ALL") return books;
        if (filter === "AVAILABLE") return books.filter((b) => b.isAvailable);
        return books.filter((b) => !b.isAvailable);
    }, [books, filter]);

    const counts = useMemo(() => ({
        ALL: books.length,
        AVAILABLE: books.filter((b) => b.isAvailable).length,
        BORROWED: books.filter((b) => !b.isAvailable).length,
    }), [books]);

    return (
        <div>
            {/* Search */}
            <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3d405b]/40" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อหนังสือ..."
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f.value
                                ? "bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white shadow-sm"
                                : "bg-white border border-[#d1cce7]/30 text-[#3d405b]/50 hover:text-[#3d405b]/70"
                            }`}
                    >
                        {f.label} ({counts[f.value]})
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading ? (
                <div className="text-center py-12 text-[#3d405b]/40">
                    <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
                    กำลังค้นหา...
                </div>
            ) : (
                <>
                    {/* Book List */}
                    <div className="space-y-3">
                        {filteredBooks.length === 0 ? (
                            <div className="text-center py-12 text-[#3d405b]/40">
                                <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                                {search ? `ไม่พบหนังสือ "${search}"` : filter !== "ALL" ? "ไม่พบหนังสือในหมวดนี้" : "ยังไม่มีหนังสือ"}
                            </div>
                        ) : (
                            filteredBooks.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/user/books/${book.id}`}
                                    className="block bg-white rounded-xl p-4 border border-[#d1cce7]/20 hover:border-[#81b29a]/30 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-[#3d405b]">{book.title}</h3>
                                            {book.category && (
                                                <p className="text-xs text-[#3d405b]/40 mt-0.5">{book.category}</p>
                                            )}
                                            {book.ageRange && (
                                                <span className="inline-block mt-1 text-xs bg-[#81b29a]/10 text-[#609279] px-2 py-0.5 rounded-full">
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
                                        <span className="flex items-center gap-1.5 mt-3 text-xs text-red-500 font-medium">
                                            <Youtube size={14} />
                                            มี YouTube
                                        </span>
                                    )}
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white border border-[#d1cce7]/30 rounded-xl text-sm text-[#3d405b]/70 font-medium hover:bg-[#f4f1de]/50 transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    กำลังโหลด...
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={16} />
                                    โหลดเพิ่มเติม
                                </>
                            )}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
