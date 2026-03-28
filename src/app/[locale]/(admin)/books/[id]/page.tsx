import { getBookById } from "@/actions/borrow";
import { notFound } from "next/navigation";
import BookEditForm from "./_components/BookEditForm";
import BookBorrowSection from "./_components/BookBorrowSection";
import BookReturnSection from "./_components/BookReturnSection";
import { calculateLateFee } from "@/lib/utils";

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

    // Find active borrow item for this book
    const activeBorrowItem = book.borrowItems.find(
        (bi) => (bi.borrowRecord.status === "BORROWED" || bi.borrowRecord.status === "OVERDUE") && !bi.returned
    );

    const isBorrowed = book.borrowItems.some(
        (bi) => (bi.borrowRecord.status === "BORROWED" || bi.borrowRecord.status === "RESERVED") && !bi.returned
    );

    return (
        <>
            <BookEditForm book={serializedBook} />
            {!isBorrowed && book.isAvailable && book.isActive && (
                <div className="max-w-2xl">
                    <BookBorrowSection bookId={book.id} bookTitle={book.title} rentalCost={book.rentalCost} />
                </div>
            )}
            {activeBorrowItem && (
                <div className="max-w-2xl">
                    <BookReturnSection
                        bookId={book.id}
                        bookTitle={book.title}
                        borrowItemId={activeBorrowItem.id}
                        borrowRecordId={activeBorrowItem.borrowRecordId}
                        borrowerName={activeBorrowItem.borrowRecord.user.parentName}
                        borrowCode={activeBorrowItem.borrowRecord.code}
                        dueDate={activeBorrowItem.borrowRecord.dueDate.toISOString()}
                        lateFeePreview={calculateLateFee(activeBorrowItem.borrowRecord.dueDate, new Date())}
                        totalItems={activeBorrowItem.borrowRecord.items?.length ?? 1}
                    />
                </div>
            )}
        </>
    );
}
