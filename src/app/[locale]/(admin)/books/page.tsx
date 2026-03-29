import { getBooks } from "@/actions/borrow";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getTranslations } from "next-intl/server";

export default async function BooksPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string }>;
}) {
    const t = await getTranslations("AdminBooks");
    const params = await searchParams;
    const status = params.status || "all";
    const books = await getBooks(params.search, status === "all" ? undefined : status);

    const statusTabs = [
        { key: "all", label: t("tabs.all") },
        { key: "available", label: t("tabs.available") },
        { key: "borrowed", label: t("tabs.borrowed") },
        { key: "inactive", label: t("tabs.inactive") },
    ];

    return (
        <div>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                actionHref="/books/new"
                actionLabel={t("addBook")}
            />

            {/* Search + Status Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <form method="GET" className="flex-1 min-w-[200px]">
                    <input type="hidden" name="status" value={status} />
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d405b]/40" />
                        <input
                            name="search"
                            type="text"
                            defaultValue={params.search || ""}
                            placeholder={t("searchPlaceholder")}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d1cce7]/30 rounded-xl focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm shadow-sm"
                        />
                    </div>
                </form>
                <div className="flex bg-white border border-[#d1cce7]/30 rounded-xl overflow-hidden shadow-sm">
                    {statusTabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={`/books?status=${tab.key}${params.search ? `&search=${params.search}` : ""}`}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors ${status === tab.key
                                ? "bg-[#609279] text-white"
                                : "text-[#3d405b]/50 hover:bg-[#f4f1de]/50"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>

            <p className="text-sm text-[#3d405b]/40 mb-3">{t("bookCount", { count: books.length })}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-[#3d405b]/40 bg-white rounded-2xl border border-[#d1cce7]/20">
                        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                        {t("empty")}
                    </div>
                ) : (
                    books.map((book) => {
                        const isBorrowed = book.borrowItems.length > 0;
                        return (
                            <Link
                                key={book.id}
                                href={`/books/${book.id}`}
                                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md hover:border-[#81b29a]/30 transition-all block ${!book.isActive ? "opacity-60 border-[#d1cce7]/30" : "border-[#d1cce7]/20"}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-[#3d405b] flex-1">{book.title}</h3>
                                    <div className="flex gap-1.5 ml-2">
                                        {!book.isActive && (
                                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#d1cce7]/25 text-[#3d405b]/70">
                                                {t("bookCard.status.inactive")}
                                            </span>
                                        )}
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${isBorrowed
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-emerald-100 text-emerald-700"
                                                }`}
                                        >
                                            {isBorrowed ? t("bookCard.status.borrowed") : t("bookCard.status.available")}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-[#3d405b]/50">
                                    {book.category && <p>{t("bookCard.category", { category: book.category })}</p>}
                                    {book.ageRange && <p>{t("bookCard.ageRange", { ageRange: book.ageRange })}</p>}
                                    <p className="text-xs font-mono text-[#3d405b]/40">{book.qrCode}</p>
                                </div>
                                {isBorrowed && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        {t("bookCard.borrowedBy", { name: book.borrowItems[0].borrowRecord.user.parentName })}
                                    </p>
                                )}
                                {book.youtubeUrl && (
                                    <span className="inline-flex items-center gap-1 mt-3 text-xs text-red-500 font-medium">
                                        {t("bookCard.hasYoutube")}
                                    </span>
                                )}
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
