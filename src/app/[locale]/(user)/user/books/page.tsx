import { searchBooks } from "@/actions/book-search";
import BookList from "./_components/BookList";
import { getTranslations } from "next-intl/server";

export default async function UserBooksPage() {
    const t = await getTranslations("UserBooks");
    const { books, hasMore } = await searchBooks("", 0);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold text-[#3d405b] mb-4">{t("title")}</h1>
            <BookList initialBooks={books} initialHasMore={hasMore} />
        </div>
    );
}
