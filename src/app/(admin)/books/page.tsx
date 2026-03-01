import { getBooks } from "@/actions/borrow";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default async function BooksPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string }>;
}) {
    const params = await searchParams;
    const status = params.status || "all";
    const books = await getBooks(params.search, status === "all" ? undefined : status);

    const statusTabs = [
        { key: "all", label: "ทั้งหมด" },
        { key: "available", label: "ว่าง" },
        { key: "borrowed", label: "ถูกยืม" },
        { key: "inactive", label: "ปิดใช้งาน" },
    ];

    return (
        <div>
            <PageHeader
                title="หนังสือ"
                subtitle="จัดการหนังสือทั้งหมด"
                actionHref="/books/new"
                actionLabel="เพิ่มหนังสือ"
            />

            {/* Search + Status Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <form method="GET" className="flex-1 min-w-[200px]">
                    <input type="hidden" name="status" value={status} />
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            name="search"
                            type="text"
                            defaultValue={params.search || ""}
                            placeholder="ค้นหาชื่อหนังสือ, ISBN, หมวดหมู่..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm shadow-sm"
                        />
                    </div>
                </form>
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {statusTabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={`/books?status=${tab.key}${params.search ? `&search=${params.search}` : ""}`}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors ${status === tab.key
                                ? "bg-blue-500 text-white"
                                : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </div>

            <p className="text-sm text-slate-400 mb-3">พบ {books.length} เล่ม</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
                        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                        ยังไม่มีหนังสือ
                    </div>
                ) : (
                    books.map((book) => {
                        const isBorrowed = book.borrowItems.length > 0;
                        return (
                            <Link
                                key={book.id}
                                href={`/books/${book.id}`}
                                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all block ${!book.isActive ? "opacity-60 border-slate-200" : "border-slate-100"}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-slate-800 flex-1">{book.title}</h3>
                                    <div className="flex gap-1.5 ml-2">
                                        {!book.isActive && (
                                            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-200 text-slate-600">
                                                ปิด
                                            </span>
                                        )}
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${isBorrowed
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-emerald-100 text-emerald-700"
                                                }`}
                                        >
                                            {isBorrowed ? "ถูกยืม" : "ว่าง"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-slate-500">
                                    {book.category && <p>หมวดหมู่: {book.category}</p>}
                                    {book.ageRange && <p>ช่วงอายุ: {book.ageRange}</p>}
                                    <p className="text-xs font-mono text-slate-400">{book.qrCode}</p>
                                </div>
                                {isBorrowed && (
                                    <p className="text-xs text-amber-600 mt-2">
                                        ยืมโดย: {book.borrowItems[0].borrowRecord.user.parentName}
                                    </p>
                                )}
                                {book.youtubeUrl && (
                                    <span className="inline-flex items-center gap-1 mt-3 text-xs text-red-500 font-medium">
                                        ▶ มี YouTube
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
