"use client";

import { useState } from "react";
import {
    createTeacher,
    updateTeacher,
    toggleTeacherActive,
    deleteTeacher,
} from "@/actions/teacher";
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import { useTranslations } from "next-intl";

const COLOR_OPTIONS = [
    "#e07a5f", "#81b29a", "#a16b9f", "#f9b61a", "#ecb4ce",
    "#fab885", "#4e9ad0", "#6b8e6b", "#d4616b", "#9b8ec4",
    "#e8a87c", "#41b3a3", "#c38d9e", "#85c1e9", "#f6d365",
];

interface TeacherData {
    id: string;
    name: string;
    nickname: string | null;
    color: string | null;
    isActive: boolean;
    sortOrder: number;
}

export default function TeacherManager({ teachers }: { teachers: TeacherData[] }) {
    const t = useTranslations("AdminSettings.teachers");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Edit state
    const [editName, setEditName] = useState("");
    const [editNickname, setEditNickname] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editSort, setEditSort] = useState("");

    // Add state
    const [addName, setAddName] = useState("");
    const [addNickname, setAddNickname] = useState("");
    const [addColor, setAddColor] = useState("");
    const [addSort, setAddSort] = useState("");

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const startEdit = (t: TeacherData) => {
        setEditId(t.id);
        setEditName(t.name);
        setEditNickname(t.nickname || "");
        setEditColor(t.color || "");
        setEditSort(String(t.sortOrder));
    };

    const handleAdd = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("name", addName);
        fd.set("nickname", addNickname);
        fd.set("color", addColor);
        fd.set("sortOrder", addSort);
        const result = await createTeacher(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg(t("messages.addSuccess"));
            setShowAdd(false);
            setAddName(""); setAddNickname(""); setAddColor(""); setAddSort("");
        }
    };

    const handleUpdate = async (id: string) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("id", id);
        fd.set("name", editName);
        fd.set("nickname", editNickname);
        fd.set("color", editColor);
        fd.set("sortOrder", editSort);
        const result = await updateTeacher(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else { showMsg(t("messages.updateSuccess")); setEditId(null); }
    };

    const handleToggle = async (id: string) => {
        setLoading(true);
        const result = await toggleTeacherActive(id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg(t("messages.statusSuccess"));
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deleteTeacher(id);
        setLoading(false);
        setDeleteConfirmId(null);
        if (result.error) showMsg(result.error);
        else showMsg(t("messages.deleteSuccess"));
    };

    const ColorPicker = ({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) => (
        <div className="flex gap-1.5 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onSelect(selected === c ? "" : c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${selected === c ? "border-[#3d405b] scale-110" : "border-transparent hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    );

    return (
        <div>
            <AlertMessage type={message && !message.includes("error") && !message.includes("fail") && (message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"} message={message} />

            {/* Add button */}
            <div className="mb-4 flex justify-end">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("nameLabel")}</label>
                            <input
                                type="text"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder={t("namePh")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("nicknameLabel")}</label>
                            <input
                                type="text"
                                value={addNickname}
                                onChange={(e) => setAddNickname(e.target.value)}
                                placeholder={t("nicknamePh")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("sortOrderLabel")}</label>
                            <input
                                type="number"
                                value={addSort}
                                onChange={(e) => setAddSort(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="text-xs font-medium text-[#3d405b]/60 block mb-2">{t("colorLabel")}</label>
                        <ColorPicker selected={addColor} onSelect={setAddColor} />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowAdd(false)}
                            className="px-4 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b] transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || !addName}
                            className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors disabled:opacity-50"
                        >
                            <Check size={16} /> {t("save")}
                        </button>
                    </div>
                </Card>
            )}

            {/* Teachers List */}
            <div className="space-y-2">
                {teachers.length === 0 ? (
                    <Card><p className="py-8 text-center text-[#3d405b]/40">{t("empty")}</p></Card>
                ) : (
                    teachers.map((teacher) => (
                        <Card key={teacher.id} className={`${!teacher.isActive ? "opacity-50" : ""}`}>
                            {editId === teacher.id ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("nameTitle")}</label>
                                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("nicknameLabel")}</label>
                                            <input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("sortOrderLabel")}</label>
                                            <input type="number" value={editSort} onChange={(e) => setEditSort(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#3d405b]/60 block mb-2">{t("colorLabelShort")}</label>
                                        <ColorPicker selected={editColor} onSelect={setEditColor} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdate(teacher.id)} disabled={loading}
                                            className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium">{t("save")}</button>
                                        <button onClick={() => setEditId(null)}
                                            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">{t("cancel")}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    {/* Color dot */}
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                                        style={{ backgroundColor: teacher.color || "#81b29a" }}>
                                        {(teacher.nickname || teacher.name).charAt(0)}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-medium text-[#3d405b]">{teacher.name}</p>
                                            {teacher.nickname && <span className="text-xs text-[#3d405b]/40">({teacher.nickname})</span>}
                                            <span className="text-xs text-[#3d405b]/30">#{teacher.sortOrder}</span>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => handleToggle(teacher.id)} disabled={loading} className="disabled:opacity-50"
                                            title={teacher.isActive ? t("off") : t("on")}>
                                            {teacher.isActive ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-[#3d405b]/30" />}
                                        </button>
                                        <button onClick={() => startEdit(teacher)}
                                            className="p-1.5 text-[#3d405b]/40 hover:text-[#609279] hover:bg-[#81b29a]/10 rounded-lg transition-colors" title={t("edit")}>
                                            <Pencil size={14} />
                                        </button>
                                        {deleteConfirmId === teacher.id ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleDelete(teacher.id)} disabled={loading}
                                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">{t("confirmDelete")}</button>
                                                <button onClick={() => setDeleteConfirmId(null)}
                                                    className="px-2 py-1 text-xs text-[#3d405b]/50 hover:bg-[#d1cce7]/15 rounded-lg">{t("cancel")}</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeleteConfirmId(teacher.id)} disabled={loading}
                                                className="p-1.5 text-[#3d405b]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title={t("delete")}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
