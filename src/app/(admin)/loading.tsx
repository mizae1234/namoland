export default function AdminLoading() {
    return (
        <div className="flex-1 p-6">
            {/* Header skeleton */}
            <div className="mb-6">
                <div className="h-8 w-48 bg-[#d1cce7]/25 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-[#d1cce7]/15 rounded mt-2 animate-pulse" />
            </div>

            {/* Content skeleton */}
            <div className="bg-white rounded-2xl border border-[#d1cce7]/20 shadow-sm p-6">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-[#d1cce7]/15 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-[#d1cce7]/15 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
                                <div className="h-3 bg-[#f4f1de]/50 rounded animate-pulse" style={{ width: `${50 - i * 5}%` }} />
                            </div>
                            <div className="h-6 w-16 bg-[#d1cce7]/15 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
