"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { changeSelfAdminPassword } from "@/actions/admin";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import { Lock, Eye, EyeOff, Check } from "lucide-react";

export default function AdminProfileManager() {
    const t = useTranslations("AdminSettings.adminProfile");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error">("success");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const showMsg = (msg: string, type: "success" | "error") => {
        setMessage(msg);
        setMsgType(type);
        setTimeout(() => setMessage(""), 3000);
    };

    const handleSave = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("currentPassword", currentPassword);
        fd.set("newPassword", newPassword);
        const result = await changeSelfAdminPassword(fd);
        setLoading(false);
        if (result.error) {
            showMsg(result.error, "error");
        } else {
            showMsg(t("success"), "success");
            setCurrentPassword("");
            setNewPassword("");
        }
    };

    return (
        <div className="max-w-2xl">
            <AlertMessage
                type={msgType}
                message={message}
            />

            <Card>
                <div className="flex items-center gap-2 mb-6">
                    <Lock className="text-[#609279]" size={20} />
                    <h2 className="text-lg font-bold text-[#3d405b]">{t("changePassword")}</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">
                            {t("currentPassword")}
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPw ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30 hover:text-[#3d405b]/60"
                            >
                                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">
                            {t("newPassword")}
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPw ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPw(!showNewPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30 hover:text-[#3d405b]/60"
                            >
                                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => {
                                setCurrentPassword("");
                                setNewPassword("");
                            }}
                            className="px-4 py-2.5 text-sm font-medium text-[#3d405b]/50 hover:text-[#3d405b] hover:bg-[#f4f1de]/50 rounded-xl transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || !currentPassword || !newPassword}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-md shadow-amber-500/20"
                        >
                            <Check size={16} />
                            {loading ? t("saving") : t("save")}
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
