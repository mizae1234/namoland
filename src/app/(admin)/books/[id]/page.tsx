import { getBookById } from "@/actions/borrow";
import { notFound } from "next/navigation";
import BookEditForm from "./_components/BookEditForm";

export default async function BookDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const book = await getBookById(id);

    if (!book) return notFound();

    // Serialize dates for client component
    const serializedBook = {
        ...book,
        borrowItems: book.borrowItems.map((bi) => ({
            id: bi.id,
            isDamaged: bi.isDamaged,
            borrowRecord: {
                code: bi.borrowRecord.code,
                status: bi.borrowRecord.status,
                borrowDate: bi.borrowRecord.borrowDate.toISOString(),
                dueDate: bi.borrowRecord.dueDate.toISOString(),
                returnDate: bi.borrowRecord.returnDate?.toISOString() || null,
                user: { parentName: bi.borrowRecord.user.parentName },
            },
        })),
    };

    return <BookEditForm book={serializedBook} />;
}
