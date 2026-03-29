"use client";

import { useState } from "react";
import { createAdminUser, updateAdminUser, deleteAdminUser } from "@/actions/admin";
import { Plus, Pencil, Trash2, Check, X, Shield, ShieldCheck } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import { th, enUS as en } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

export default function AdminUsersManager({
    users,
    currentUserId,
}: {
    users: AdminUser[];
    currentUserId: string;
}) {
    const t = useTranslations("AdminSettings.adminUsers");
    const locale = useLocale();
    const dateLocale = locale === "en" ? en : th;

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Add state
    const [addName, setAddName] = useState("");
    const [addEmail, setAddEmail] = useState("");
    const [addPassword, setAddPassword] = useState("");
    const [addRole, setAddRole] = useState("ADMIN");

    // Edit state
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [editRole, setEditRole] = useState("ADMIN");

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const handleAdd = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("name", addName);
        fd.set("email", addEmail);
        fd.set("password", addPassword);
        fd.set("role", addRole);
        const result = await createAdminUser(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg(t("messages.addSuccess"));
            setShowAdd(false);
            setAddName("");
            setAddEmail("");
            setAddPassword("");
            setAddRole("ADMIN");
        }
    };

    const startEdit = (user: AdminUser) => {
        setEditId(user.id);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPassword("");
        setEditRole(user.role);
    };

    const handleUpdate = async (id: string) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("id", id);
        fd.set("name", editName);
        fd.set("email", editEmail);
        if (editPassword) fd.set("password", editPassword);
        fd.set("role", editRole);
        const result = await updateAdminUser(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg(t("messages.updateSuccess"));
            setEditId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deleteAdminUser(id);
        setLoading(false);
        setDeleteConfirmId(null);
        if (result.error) showMsg(result.error);
        else showMsg(t("messages.deleteSuccess"));
    };

    return (
        <div>
            <AlertMessage
                type={message && !message.includes("error") && !message.includes("fail") && (message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"}
                message={message}
            />

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#3d405b]">{t("title")}</h2>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors shadow-md shadow-[#81b29a]/30"
                >
                    <Plus size={16} />
                    {t("addBtn")}
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">{t("addTitle")}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("nameLabel")}</label>
                            <input
                                type="text"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder={t("namePh")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("emailLabel")}</label>
                            <input
                                type="email"
                                value={addEmail}
                                onChange={(e) => setAddEmail(e.target.value)}
                                placeholder={t("emailPh")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("passwordLabel")}</label>
                            <input
                                type="password"
                                value={addPassword}
                                onChange={(e) => setAddPassword(e.target.value)}
                                placeholder={t("passwordPh")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("roleLabel")}</label>
                            <select
                                value={addRole}
                                onChange={(e) => setAddRole(e.target.value)}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowAdd(false)}
                            className="px-4 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b]"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || !addName || !addEmail || !addPassword}
                            className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50"
                        >
                            <Check size={16} />
                            {t("save")}
                        </button>
                    </div>
                </Card>
            )}

            {/* Users List */}
            <Card padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#d1cce7]/20 text-left">
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">{t("table.name")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">{t("table.email")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-center">{t("table.role")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">{t("table.createdAt")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-center">{t("table.manage")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d1cce7]/15">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-[#f4f1de]/30 transition-colors">
                                    {editId === user.id ? (
                                        <>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="w-full px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="email"
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    className="w-full px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value)}
                                                    className="w-full px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm"
                                                >
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="SUPER_ADMIN">Super Admin</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="password"
                                                    value={editPassword}
                                                    onChange={(e) => setEditPassword(e.target.value)}
                                                    placeholder={t("passwordEditPh")}
                                                    className="w-full px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleUpdate(user.id)}
                                                        disabled={loading}
                                                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditId(null)}
                                                        className="p-1.5 text-[#3d405b]/40 hover:bg-[#d1cce7]/15 rounded-lg"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-3 px-4 font-medium text-[#3d405b]">
                                                {user.name}
                                                {user.id === currentUserId && (
                                                    <span className="text-xs text-[#609279] ml-1.5">({t("table.you")})</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-[#3d405b]/60">{user.email}</td>
                                            <td className="py-3 px-4 text-center">
                                                {user.role === "SUPER_ADMIN" ? (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                                        <ShieldCheck size={12} /> Super Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#81b29a]/15 text-[#609279] font-medium">
                                                        <Shield size={12} /> Admin
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-[#3d405b]/40 text-xs">
                                                {new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "th-TH", { day: 'numeric', month: 'short', year: '2-digit' })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => startEdit(user)}
                                                        className="p-1.5 text-[#3d405b]/40 hover:text-[#609279] hover:bg-[#81b29a]/10 rounded-lg"
                                                        title={t("table.edit")}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    {user.id !== currentUserId && (
                                                        deleteConfirmId === user.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(user.id)}
                                                                    disabled={loading}
                                                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                                                >
                                                                    {t("table.confirmDelete")}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                    className="px-2 py-1 text-xs text-[#3d405b]/50 hover:bg-[#d1cce7]/15 rounded-lg"
                                                                >
                                                                    {t("cancel")}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirmId(user.id)}
                                                                disabled={loading}
                                                                className="p-1.5 text-[#3d405b]/40 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                                title={t("table.delete")}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
