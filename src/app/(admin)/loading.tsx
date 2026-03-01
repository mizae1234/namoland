export default function AdminLoading() {
    return (
        <div className="flex-1 p-6">
            {/* Header skeleton */}
            <div className="mb-6">
                <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-slate-100 rounded mt-2 animate-pulse" />
            </div>

            {/* Content skeleton */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${70 - i * 10}%` }} />
                                <div className="h-3 bg-slate-50 rounded animate-pulse" style={{ width: `${50 - i * 5}%` }} />
                            </div>
                            <div className="h-6 w-16 bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
