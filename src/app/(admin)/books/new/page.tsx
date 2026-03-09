"use client";

import { useState } from "react";
import { createBook } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import BackLink from "@/components/ui/BackLink";
import AlertMessage from "@/components/ui/AlertMessage";

export default function NewBookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const result = await createBook(formData);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/books");
        }
    };

    return (
        <div className="max-w-2xl">
            <BackLink href="/books" label="กลับไปหน้าหนังสือ" />

            <h1 className="text-2xl font-bold text-[#3d405b] mb-6">เพิ่มหนังสือใหม่</h1>

            <AlertMessage message={error} />

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#d1cce7]/20 shadow-sm p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">ชื่อหนังสือ *</label>
                    <input name="title" type="text" required className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">ISBN</label>
                        <input name="isbn" type="text" className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">หมวดหมู่</label>
                        <input name="category" type="text" className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm" placeholder="เช่น นิทาน, วิทยาศาสตร์" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">ช่วงอายุ</label>
                    <input name="ageRange" type="text" className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm" placeholder="เช่น 3-6 ปี" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">YouTube URL</label>
                    <input name="youtubeUrl" type="url" className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm" placeholder="https://youtube.com/..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">ค่ายืม (เหรียญ)</label>
                    <input name="rentalCost" type="number" min="0" defaultValue={1} className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl bg-[#f4f1de]/50 focus:bg-white focus:border-[#81b29a] focus:ring-2 focus:ring-[#81b29a]/20 outline-none text-sm" placeholder="1" />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#609279] hover:bg-[#609279] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#81b29a]/30 disabled:opacity-50"
                >
                    {loading ? "กำลังบันทึก..." : "บันทึกหนังสือ"}
                </button>
            </form>
        </div>
    );
}
