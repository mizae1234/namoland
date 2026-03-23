"use client";

import { useState } from "react";
import { Upload, Trash2, ImageIcon, Loader2, Save, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AlertMessage from "@/components/ui/AlertMessage";

interface ScheduleImageUploaderProps {
    currentImageUrl: string | null;
    type?: "monthly" | "weekly";
    title?: string;
    description?: string;
}

export default function ScheduleImageUploader({
    currentImageUrl,
    type = "monthly",
    title = "ตารางกิจกรรมประจำเดือน",
    description = "อัพโหลดรูปตารางกิจกรรมสำหรับแสดงใน Landing Page",
}: ScheduleImageUploaderProps) {
    const router = useRouter();
    const [savedUrl, setSavedUrl] = useState(currentImageUrl);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    // What's currently showing
    const displayUrl = previewUrl || savedUrl;

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            showMsg("รองรับเฉพาะไฟล์ JPEG, PNG, WebP");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMsg("ไฟล์ต้องไม่เกิน 5MB");
            return;
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setPendingFile(file);
        e.target.value = "";
    };

    const handleSave = async () => {
        if (!pendingFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", pendingFile);
            formData.append("type", type);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok || data.error) {
                showMsg(data.error || "บันทึกไม่สำเร็จ");
            } else {
                setSavedUrl(data.url);
                setPreviewUrl(null);
                setPendingFile(null);
                showMsg("บันทึกสำเร็จ!");
                router.refresh();
            }
        } catch (err) {
            console.error("Save error:", err);
            showMsg("เกิดข้อผิดพลาด กรุณาลองใหม่");
        }
        setUploading(false);
    };

    const handleCancelPreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPendingFile(null);
    };

    const handleRemove = async () => {
        if (!confirm(`ต้องการลบรูป${title}?`)) return;
        setUploading(true);
        try {
            const res = await fetch(`/api/upload?type=${type}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok || data.error) {
                showMsg(data.error || "ลบไม่สำเร็จ");
            } else {
                setSavedUrl(null);
                setPreviewUrl(null);
                setPendingFile(null);
                showMsg("ลบรูปสำเร็จ!");
                router.refresh();
            }
        } catch {
            showMsg("เกิดข้อผิดพลาด กรุณาลองใหม่");
        }
        setUploading(false);
    };

    return (
        <div>
            <h3 className="font-semibold text-[#3d405b] mb-1 flex items-center gap-2">
                <ImageIcon size={18} className="text-[#a16b9f]" />
                {title}
            </h3>
            <p className="text-xs text-[#3d405b]/40 mb-4">
                {description}
            </p>

            <AlertMessage
                type={message.includes("สำเร็จ") ? "success" : "error"}
                message={message}
            />

            {displayUrl ? (
                <div className="space-y-4">
                    {/* Pending save indicator */}
                    {pendingFile && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                            <Save size={16} className="text-amber-500" />
                            <p className="text-sm text-amber-600 font-medium">
                                เลือกรูปใหม่แล้ว — กด &quot;บันทึก&quot; เพื่อยืนยัน
                            </p>
                        </div>
                    )}

                    {/* Saved indicator */}
                    {!pendingFile && savedUrl && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-500" />
                            <p className="text-sm text-emerald-600 font-medium">
                                รูปที่ใช้งานอยู่
                            </p>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="relative border border-[#d1cce7]/20 rounded-xl overflow-hidden">
                        <Image
                            src={displayUrl}
                            alt={title}
                            width={800}
                            height={600}
                            className="w-full h-auto object-contain"
                            unoptimized
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {pendingFile ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={uploading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-200"
                                >
                                    {uploading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {uploading ? "กำลังบันทึก..." : "บันทึก"}
                                </button>
                                <button
                                    onClick={handleCancelPreview}
                                    disabled={uploading}
                                    className="px-4 py-3 border border-[#d1cce7]/30 text-[#3d405b]/50 rounded-xl text-sm hover:bg-[#f4f1de] transition-colors disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                            </>
                        ) : (
                            <>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors cursor-pointer">
                                    <Upload size={16} />
                                    เปลี่ยนรูป
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleSelectFile}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    onClick={handleRemove}
                                    disabled={uploading}
                                    className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    ลบรูป
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#d1cce7]/40 rounded-2xl p-10 cursor-pointer hover:border-[#81b29a]/50 hover:bg-[#81b29a]/5 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload size={40} className="text-[#3d405b]/20" />
                    <div className="text-center">
                        <p className="text-sm font-medium text-[#3d405b]/60">
                            คลิกเพื่อเลือกรูป{title}
                        </p>
                        <p className="text-xs text-[#3d405b]/30 mt-1">JPEG, PNG, WebP · ไม่เกิน 5MB</p>
                    </div>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleSelectFile}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            )}
        </div>
    );
}
