import { searchBooks } from "@/actions/book-search";
import BookList from "./_components/BookList";

export default async function UserBooksPage() {
    const { books, hasMore } = await searchBooks("", 0);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold text-[#3d405b] mb-4">หนังสือ</h1>
            <BookList initialBooks={books} initialHasMore={hasMore} />
        </div>
    );
}
