"use client";

import { useState, useRef } from "react";
import { createBook } from "@/actions/borrow";
import { useRouter } from "next/navigation";
import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import BackLink from "@/components/ui/BackLink";
import AlertMessage from "@/components/ui/AlertMessage";

export default function NewBookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", "bookCover");
            
            // Note: no bookId appended yet because the book doesn't exist

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("อัพโหลดไม่สำเร็จ");
            const data = await res.json();
            
            setCoverImage(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        if (coverImage) {
            formData.append("coverImage", coverImage);
        }
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
                
                {/* Book Cover Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-[#3d405b]/70 mb-1.5">
                        รูปภาพหน้าปก
                    </label>
                    <div className="flex gap-4 items-start">
                        <div className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-dashed border-[#d1cce7]/50 bg-[#f4f1de]/30 flex flex-col items-center justify-center flex-shrink-0">
                            {coverImage ? (
                                <>
                                    <Image
                                        src={coverImage}
                                        alt="Book Cover Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setCoverImage(null)}
                                            disabled={uploading}
                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon size={24} className="text-[#3d405b]/20 mx-auto mb-1" />
                                    <span className="text-[10px] text-[#3d405b]/40">ไม่มีรูปภาพ</span>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <span className="text-xs font-medium text-[#609279] animate-pulse">กำลังโหลด...</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4f1de]/50 hover:bg-[#d1cce7]/20 border border-[#d1cce7]/30 text-[#3d405b]/70 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                            >
                                <Upload size={16} />
                                {coverImage ? "เปลี่ยนรูป" : "อัพโหลดรูปภาพ"}
                            </button>
                            <p className="text-xs text-[#3d405b]/40 mt-2">
                                รองรับไฟล์ JPEG, PNG, WebP ขนาดไม่เกิน 5MB<br />
                                แนะนำภาพสัดส่วนแนวตั้ง (Portrait)
                            </p>
                        </div>
                    </div>
                </div>

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
