"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Trash2, ImageIcon, Loader2, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import AlertMessage from "@/components/ui/AlertMessage";
import { useTranslations } from "next-intl";

interface ScheduleImageUploaderProps {
    currentImageUrl: string | null;
    type?: "monthly" | "weekly" | "heroImage";
    title?: string;
    description?: string;
}

export default function ScheduleImageUploader({
    currentImageUrl,
    type = "monthly",
    title,
    description,
}: ScheduleImageUploaderProps) {
    const t = useTranslations("AdminSettings.scheduleUpload");
    const router = useRouter();
    const [savedUrl, setSavedUrl] = useState(currentImageUrl);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [imageError, setImageError] = useState(false);

    // Track the URL we just saved to prevent useEffect from reverting it
    // when router.refresh() delivers a stale prop before revalidation completes
    const lastSavedUrlRef = useRef<string | null>(null);

    // Sync savedUrl when the prop changes (e.g., after router.refresh())
    // BUT skip if the incoming prop is stale (doesn't match what we just saved)
    useEffect(() => {
        if (lastSavedUrlRef.current) {
            // We just saved — only accept the prop if it matches what we saved
            // (i.e., revalidation has caught up), or if it's a new different value
            // from a different source
            const savedBase = lastSavedUrlRef.current.split("?")[0];
            const propBase = (currentImageUrl || "").split("?")[0];
            if (propBase === savedBase || currentImageUrl === lastSavedUrlRef.current) {
                // Server has caught up — clear the guard
                lastSavedUrlRef.current = null;
                setSavedUrl(currentImageUrl);
            }
            // Otherwise: prop is still stale, keep our locally saved URL
        } else {
            setSavedUrl(currentImageUrl);
        }
        setImageError(false);
    }, [currentImageUrl]);

    // What's currently showing — add cache buster for saved URLs to prevent browser caching
    const displayUrl = previewUrl || (savedUrl ? `${savedUrl}${savedUrl.includes("?") ? "&" : "?"}v=${Date.now()}` : null);

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
            showMsg(t("messages.fileTypeErr"));
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMsg(t("messages.fileSizeErr"));
            return;
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setPendingFile(file);
        setImageError(false);
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
                showMsg(data.error || t("messages.saveErr"));
            } else {
                // Save the URL and guard it from stale prop overwrites
                lastSavedUrlRef.current = data.url;
                setSavedUrl(data.url);
                setPreviewUrl(null);
                setPendingFile(null);
                setImageError(false);
                showMsg(t("messages.saveSuccess"));
                router.refresh();
            }
        } catch (err) {
            console.error("Save error:", err);
            showMsg(t("messages.genericErr"));
        }
        setUploading(false);
    };

    const handleCancelPreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPendingFile(null);
    };

    const handleRemove = async () => {
        if (!confirm(t("messages.confirmDelete", { title: title || "" }))) return;
        setUploading(true);
        try {
            const res = await fetch(`/api/upload?type=${type}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok || data.error) {
                showMsg(data.error || t("messages.deleteErr"));
            } else {
                setSavedUrl(null);
                setPreviewUrl(null);
                setPendingFile(null);
                setImageError(false);
                showMsg(t("messages.deleteSuccess"));
                router.refresh();
            }
        } catch {
            showMsg(t("messages.genericErr"));
        }
        setUploading(false);
    };

    // Handle broken images — auto-clear to show upload zone
    const handleImageError = useCallback(() => {
        // Only handle errors for saved URLs, not local preview blobs
        if (!previewUrl && savedUrl) {
            setImageError(true);
        }
    }, [previewUrl, savedUrl]);

    // If saved image is broken, show error state with delete option
    const showBrokenState = imageError && !previewUrl && savedUrl;

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
                type={message && !message.includes("error") && !message.includes("fail") && (message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"}
                message={message}
            />

            {showBrokenState ? (
                /* Broken image state — show warning + upload/delete options */
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm text-amber-700 font-medium">รูปภาพไม่พบในระบบ</p>
                            <p className="text-xs text-amber-600/70 mt-1">ไฟล์รูปภาพอาจถูกลบหรือย้ายออกจากระบบแล้ว กรุณาอัพโหลดใหม่หรือลบออก</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors cursor-pointer">
                            <Upload size={16} />
                            {t("changeBtn")}
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
                            {t("removeBtn")}
                        </button>
                    </div>
                </div>
            ) : displayUrl ? (
                <div className="space-y-4">
                    {/* Pending save indicator */}
                    {pendingFile && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                            <Save size={16} className="text-amber-500" />
                            <p className="text-sm text-amber-600 font-medium">
                                {t("pendingMsg")}
                            </p>
                        </div>
                    )}

                    {/* Saved indicator */}
                    {!pendingFile && savedUrl && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                            <CheckCircle size={16} className="text-emerald-500" />
                            <p className="text-sm text-emerald-600 font-medium">
                                {t("savedMsg")}
                            </p>
                        </div>
                    )}

                    {/* Preview — use native img to support onError */}
                    <div className="relative border border-[#d1cce7]/20 rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={displayUrl}
                            alt={title || "Schedule Image"}
                            className="w-full h-auto object-contain"
                            onError={handleImageError}
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
                                    {uploading ? t("savingBtn") : t("saveBtn")}
                                </button>
                                <button
                                    onClick={handleCancelPreview}
                                    disabled={uploading}
                                    className="px-4 py-3 border border-[#d1cce7]/30 text-[#3d405b]/50 rounded-xl text-sm hover:bg-[#f4f1de] transition-colors disabled:opacity-50"
                                >
                                    {t("cancelBtn")}
                                </button>
                            </>
                        ) : (
                            <>
                                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors cursor-pointer">
                                    <Upload size={16} />
                                    {t("changeBtn")}
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
                                    {t("removeBtn")}
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
                            {t("uploadPrompt", { title: title || "" })}
                        </p>
                        <p className="text-xs text-[#3d405b]/30 mt-1">{t("uploadHint")}</p>
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

