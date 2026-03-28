"use client";

import { useState } from "react";
import { updateSelfProfile, changeSelfPassword } from "@/actions/member";
import { Pencil, X, Check, Plus, Trash2, Lock, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import DateInput from "@/components/ui/DateInput";

interface Child {
    id: string;
    name: string;
    birthDate: Date | string;
}

interface ProfileEditFormProps {
    user: {
        id: string;
        parentName: string;
        phone: string;
        children: Child[];
    };
}

interface EditChild {
    id?: string;
    name: string;
    birthDate: string;
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
    const t = useTranslations("UserProfile");
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState<"success" | "error">("success");

    const [parentName, setParentName] = useState(user.parentName);
    const [phone, setPhone] = useState(user.phone);
    const [children, setChildren] = useState<EditChild[]>(
        user.children.map(c => ({
            id: c.id,
            name: c.name,
            birthDate: format(new Date(c.birthDate), "yyyy-MM-dd"),
        }))
    );

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const showMsg = (msg: string, type: "success" | "error") => {
        setMessage(msg);
        setMsgType(type);
        setTimeout(() => setMessage(""), 3000);
    };

    const resetForm = () => {
        setParentName(user.parentName);
        setPhone(user.phone);
        setChildren(
            user.children.map(c => ({
                id: c.id,
                name: c.name,
                birthDate: format(new Date(c.birthDate), "yyyy-MM-dd"),
            }))
        );
        setEditing(false);
    };

    const addChild = () => {
        setChildren([...children, { name: "", birthDate: "" }]);
    };

    const removeChild = (idx: number) => {
        setChildren(children.filter((_, i) => i !== idx));
    };

    const updateChild = (idx: number, field: "name" | "birthDate", value: string) => {
        setChildren(children.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
    };

    const handleSave = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("parentName", parentName);
        fd.set("phone", phone);
        fd.set("children", JSON.stringify(children.filter(c => c.name && c.birthDate)));
        const result = await updateSelfProfile(fd);
        setLoading(false);
        if (result.error) showMsg(result.error, "error");
        else {
            showMsg(t("messages.saveSuccess"), "success");
            setEditing(false);
        }
    };

    const handleChangePassword = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("currentPassword", currentPassword);
        fd.set("newPassword", newPassword);
        const result = await changeSelfPassword(fd);
        setLoading(false);
        if (result.error) showMsg(result.error, "error");
        else {
            showMsg(t("messages.pwSuccess"), "success");
            setChangingPassword(false);
            setCurrentPassword("");
            setNewPassword("");
        }
    };

    return (
        <div className="space-y-4">
            {/* Message */}
            {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${msgType === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {message}
                </div>
            )}

            {/* Profile Info */}
            <div className="bg-white rounded-2xl p-6 border border-[#d1cce7]/20">
                {!editing ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-[#3d405b]">{t("PersonalInfo.title")}</h2>
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center gap-1.5 text-xs text-[#609279] hover:text-[#4e7a64] px-3 py-1.5 rounded-lg hover:bg-[#81b29a]/10"
                            >
                                <Pencil size={12} />
                                {t("PersonalInfo.edit")}
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-[#3d405b]/40">{t("PersonalInfo.parentName")}</p>
                                <p className="text-sm font-medium text-[#3d405b]">{user.parentName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#3d405b]/40">{t("PersonalInfo.phone")}</p>
                                <p className="text-sm font-medium text-[#3d405b]">{user.phone}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="font-semibold text-[#3d405b] mb-4">{t("PersonalInfo.editTitle")}</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-[#3d405b]/50 block mb-1">{t("PersonalInfo.parentName")}</label>
                                <input
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#3d405b]/50 block mb-1">{t("PersonalInfo.phone")}</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                />
                            </div>

                            {/* Children */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-[#3d405b]/50">{t("PersonalInfo.children")}</label>
                                    <button type="button" onClick={addChild} className="flex items-center gap-1 text-xs text-[#609279]">
                                        <Plus size={12} /> {t("PersonalInfo.addChild")}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {children.map((child, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={child.name}
                                                onChange={(e) => updateChild(idx, "name", e.target.value)}
                                                placeholder={t("PersonalInfo.childNamePlaceholder")}
                                                className="flex-1 px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                                            />
                                            <DateInput
                                                value={child.birthDate}
                                                onChange={(val) => updateChild(idx, "birthDate", val)}
                                                yearBack={20}
                                            />
                                            <button type="button" onClick={() => removeChild(idx)} className="p-1.5 text-red-400 hover:text-red-500">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button onClick={resetForm} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm text-[#3d405b]/50">
                                <X size={14} /> {t("PersonalInfo.cancel")}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || !parentName || !phone}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50"
                            >
                                <Check size={14} /> {loading ? t("PersonalInfo.saving") : t("PersonalInfo.save")}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl p-6 border border-[#d1cce7]/20">
                {!changingPassword ? (
                    <button
                        onClick={() => setChangingPassword(true)}
                        className="flex items-center gap-2 text-sm text-[#3d405b]/60 hover:text-[#3d405b]"
                    >
                        <Lock size={16} />
                        {t("Password.changeBtn")}
                    </button>
                ) : (
                    <>
                        <h3 className="font-semibold text-[#3d405b] mb-4 flex items-center gap-2">
                            <Lock size={16} />
                            {t("Password.title")}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-[#3d405b]/50 block mb-1">{t("Password.currentLabel")}</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPw ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 pr-10"
                                    />
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30">
                                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-[#3d405b]/50 block mb-1">{t("Password.newLabel")}</label>
                                <div className="relative">
                                    <input
                                        type={showNewPw ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 pr-10"
                                    />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3d405b]/30">
                                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => { setChangingPassword(false); setCurrentPassword(""); setNewPassword(""); }} className="flex-1 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm text-[#3d405b]/50">
                                {t("Password.cancel")}
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={loading || !currentPassword || !newPassword}
                                className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                            >
                                {loading ? t("Password.changing") : t("Password.changeSubmit")}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
