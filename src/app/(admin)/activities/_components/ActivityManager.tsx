"use client";

import { useState, useRef } from "react";
import {
    createActivityConfig,
    updateActivityConfig,
    toggleActivityActive,
    toggleShowOnLanding,
    deleteActivityConfig,
    seedActivityConfigs,
} from "@/actions/activityConfig";
import { Plus, Pencil, Trash2, Check, X, Download, ToggleLeft, ToggleRight, Globe, Upload, ImageIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import Image from "next/image";
import { useRouter } from "next/navigation";

const ICON_OPTIONS = [
    "🎨", "🎭", "🎪", "🧩", "🎯", "🎲", "🎵", "🎶",
    "📚", "✏️", "🔬", "🧪", "🌱", "🌈", "⭐", "🏆",
    "🎮", "🧸", "🤖", "🦋", "🐾", "🎈", "💡", "🎓",
    "🧠", "💪", "🧘", "🏃", "🎻", "🥁", "✂️", "🖌️",
];

interface ActivityData {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    iconImageUrl: string | null;
    coins: number;
    sortOrder: number;
    isActive: boolean;
    showOnLanding: boolean;
}

export default function ActivityManager({ activities }: { activities: ActivityData[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit state
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editIcon, setEditIcon] = useState("");
    const [editCoins, setEditCoins] = useState("");
    const [editSort, setEditSort] = useState("");
    const [showEditIconPicker, setShowEditIconPicker] = useState(false);

    // Add state
    const [addName, setAddName] = useState("");
    const [addDescription, setAddDescription] = useState("");
    const [addIcon, setAddIcon] = useState("");
    const [addCoins, setAddCoins] = useState("");
    const [addSort, setAddSort] = useState("");
    const [showAddIconPicker, setShowAddIconPicker] = useState(false);

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const startEdit = (activity: ActivityData) => {
        setEditId(activity.id);
        setEditName(activity.name);
        setEditDescription(activity.description || "");
        setEditIcon(activity.icon || "");
        setEditCoins(String(activity.coins));
        setEditSort(String(activity.sortOrder));
        setShowEditIconPicker(false);
    };

    const cancelEdit = () => { setEditId(null); setShowEditIconPicker(false); };

    const handleUpdate = async (id: string) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("id", id);
        fd.set("name", editName);
        fd.set("description", editDescription);
        fd.set("icon", editIcon);
        fd.set("coins", editCoins);
        fd.set("sortOrder", editSort);
        const result = await updateActivityConfig(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("อัปเดตสำเร็จ!");
            setEditId(null);
            setShowEditIconPicker(false);
        }
    };

    const handleAdd = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("name", addName);
        fd.set("description", addDescription);
        fd.set("icon", addIcon);
        fd.set("coins", addCoins);
        fd.set("sortOrder", addSort);
        const result = await createActivityConfig(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("เพิ่มกิจกรรมสำเร็จ!");
            setShowAdd(false);
            setAddName("");
            setAddDescription("");
            setAddIcon("");
            setAddCoins("");
            setAddSort("");
            setShowAddIconPicker(false);
        }
    };

    const handleToggle = async (id: string) => {
        setLoading(true);
        const result = await toggleActivityActive(id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg("อัปเดตสถานะสำเร็จ!");
    };

    const handleToggleLanding = async (id: string) => {
        setLoading(true);
        const result = await toggleShowOnLanding(id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg("อัปเดตการแสดงผลสำเร็จ!");
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deleteActivityConfig(id);
        setLoading(false);
        setDeleteConfirmId(null);
        if (result.error) showMsg(result.error);
        else showMsg("ลบสำเร็จ!");
    };

    const handleSeed = async () => {
        setLoading(true);
        const result = await seedActivityConfigs();
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg("สร้างกิจกรรมเริ่มต้นสำเร็จ!");
    };

    const handleIconUpload = async (activityId: string, file: File) => {
        setUploadingId(activityId);
        try {
            const fd = new FormData();
            fd.set("file", file);
            fd.set("type", "activityIcon");
            fd.set("activityId", activityId);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.error) {
                showMsg(data.error);
            } else {
                showMsg("อัพโหลดไอคอนสำเร็จ!");
                router.refresh();
            }
        } catch {
            showMsg("อัพโหลดไม่สำเร็จ");
        }
        setUploadingId(null);
    };

    const handleRemoveIcon = async (activityId: string) => {
        setUploadingId(activityId);
        try {
            const res = await fetch(`/api/upload?type=activityIcon&activityId=${activityId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.error) {
                showMsg(data.error);
            } else {
                showMsg("ลบไอคอนสำเร็จ!");
                router.refresh();
            }
        } catch {
            showMsg("ลบไม่สำเร็จ");
        }
        setUploadingId(null);
    };

    const IconPicker = ({
        selected,
        onSelect,
        show,
        setShow,
    }: {
        selected: string;
        onSelect: (icon: string) => void;
        show: boolean;
        setShow: (v: boolean) => void;
    }) => (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] bg-white text-center"
            >
                {selected || "เลือก Emoji"}
            </button>
            {show && (
                <div className="absolute z-20 top-full mt-1 bg-white border border-[#d1cce7]/30 rounded-xl shadow-lg p-2 grid grid-cols-8 gap-1 w-[280px]">
                    {ICON_OPTIONS.map((icon) => (
                        <button
                            key={icon}
                            type="button"
                            onClick={() => { onSelect(icon); setShow(false); }}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-[#81b29a]/10 transition-colors ${selected === icon ? "bg-[#81b29a]/20 ring-2 ring-[#609279]" : ""
                                }`}
                        >
                            {icon}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => { onSelect(""); setShow(false); }}
                        className="col-span-8 mt-1 text-xs text-[#3d405b]/40 hover:text-red-500 transition-colors"
                    >
                        ล้าง Emoji
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div>
            <AlertMessage
                type={message.includes("สำเร็จ") ? "success" : "error"}
                message={message}
            />

            {/* Hidden file input for icon upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && uploadingId) {
                        handleIconUpload(uploadingId, file);
                    }
                    e.target.value = "";
                }}
            />

            {/* Seed button — only if no activities */}
            {activities.length === 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-amber-800 font-medium mb-3">ยังไม่มีกิจกรรม</p>
                    <p className="text-sm text-amber-600 mb-4">คุณสามารถสร้างกิจกรรมเริ่มต้น 11 รายการ หรือเพิ่มเอง</p>
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        <Download size={16} />
                        สร้างกิจกรรมเริ่มต้น
                    </button>
                </div>
            )}

            {/* Add button */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors shadow-md shadow-[#81b29a]/30"
                >
                    <Plus size={16} />
                    เพิ่มกิจกรรม
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">เพิ่มกิจกรรมใหม่</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">ชื่อกิจกรรม</label>
                            <input
                                type="text"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder="เช่น Free Play (1 ชม.)"
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">Emoji ไอคอน</label>
                            <IconPicker
                                selected={addIcon}
                                onSelect={setAddIcon}
                                show={showAddIconPicker}
                                setShow={setShowAddIconPicker}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">จำนวนเหรียญ</label>
                            <input
                                type="number"
                                value={addCoins}
                                onChange={(e) => setAddCoins(e.target.value)}
                                placeholder="1"
                                min="0"
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">ลำดับ</label>
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
                        <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">รายละเอียด (แสดงใน Landing Page)</label>
                        <textarea
                            value={addDescription}
                            onChange={(e) => setAddDescription(e.target.value)}
                            placeholder="อธิบายกิจกรรมสั้นๆ เช่น เล่นอิสระในห้องกิจกรรมพร้อมอุปกรณ์ครบครัน"
                            rows={2}
                            className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a] resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => { setShowAdd(false); setShowAddIconPicker(false); }}
                            className="px-4 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b] transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || !addName || !addCoins}
                            className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors disabled:opacity-50"
                        >
                            <Check size={16} />
                            บันทึก
                        </button>
                    </div>
                </Card>
            )}

            {/* Activities List */}
            <div className="space-y-2">
                {activities.length === 0 ? (
                    <Card>
                        <p className="py-8 text-center text-[#3d405b]/40">ยังไม่มีกิจกรรม</p>
                    </Card>
                ) : (
                    activities.map((activity) => (
                        <Card
                            key={activity.id}
                            className={`${!activity.isActive ? "opacity-50" : ""}`}
                        >
                            {editId === activity.id ? (
                                /* ─── Edit Mode ─── */
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">ชื่อ</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">Emoji ไอคอน</label>
                                            <IconPicker
                                                selected={editIcon}
                                                onSelect={setEditIcon}
                                                show={showEditIconPicker}
                                                setShow={setShowEditIconPicker}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">เหรียญ</label>
                                            <input
                                                type="number"
                                                value={editCoins}
                                                onChange={(e) => setEditCoins(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">ลำดับ</label>
                                            <input
                                                type="number"
                                                value={editSort}
                                                onChange={(e) => setEditSort(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">รายละเอียด</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="อธิบายกิจกรรมสั้นๆ..."
                                            rows={2}
                                            className="w-full px-2 py-1.5 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30 resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdate(activity.id)}
                                            disabled={loading}
                                            className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium"
                                        >
                                            บันทึก
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                        >
                                            ยกเลิก
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ─── Display Mode ─── */
                                <div className="flex items-start gap-3">
                                    {/* Icon — show uploaded image or emoji */}
                                    <div className="w-10 h-10 bg-[#81b29a]/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl overflow-hidden relative">
                                        {activity.iconImageUrl ? (
                                            <Image
                                                src={activity.iconImageUrl}
                                                alt={activity.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            activity.icon || "📋"
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <p className="font-medium text-[#3d405b]">{activity.name}</p>
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                {activity.coins > 0 ? `${activity.coins} เหรียญ` : "กำหนดเอง"}
                                            </span>
                                            <span className="text-xs text-[#3d405b]/30">#{activity.sortOrder}</span>
                                            {activity.showOnLanding && (
                                                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                                    🌐 Landing
                                                </span>
                                            )}
                                        </div>
                                        {activity.description && (
                                            <p className="text-xs text-[#3d405b]/50 line-clamp-2">{activity.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                                        {/* Upload icon image */}
                                        <button
                                            onClick={() => {
                                                setUploadingId(activity.id);
                                                fileInputRef.current?.click();
                                            }}
                                            disabled={loading || uploadingId === activity.id}
                                            className="p-1.5 text-[#3d405b]/40 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
                                            title={activity.iconImageUrl ? "เปลี่ยนรูปไอคอน" : "อัพโหลดรูปไอคอน"}
                                        >
                                            {uploadingId === activity.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                            ) : activity.iconImageUrl ? (
                                                <ImageIcon size={14} />
                                            ) : (
                                                <Upload size={14} />
                                            )}
                                        </button>
                                        {/* Remove icon image */}
                                        {activity.iconImageUrl && (
                                            <button
                                                onClick={() => handleRemoveIcon(activity.id)}
                                                disabled={loading || uploadingId === activity.id}
                                                className="p-1.5 text-[#3d405b]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="ลบรูปไอคอน"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        {/* Toggle landing */}
                                        <button
                                            onClick={() => handleToggleLanding(activity.id)}
                                            disabled={loading}
                                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${activity.showOnLanding
                                                ? "text-blue-500 hover:bg-blue-50"
                                                : "text-[#3d405b]/30 hover:text-blue-400 hover:bg-blue-50"
                                                }`}
                                            title={activity.showOnLanding ? "ซ่อนจาก Landing" : "แสดงบน Landing"}
                                        >
                                            <Globe size={14} />
                                        </button>
                                        {/* Toggle active */}
                                        <button
                                            onClick={() => handleToggle(activity.id)}
                                            disabled={loading}
                                            className="disabled:opacity-50"
                                            title={activity.isActive ? "ปิดกิจกรรม" : "เปิดกิจกรรม"}
                                        >
                                            {activity.isActive ? (
                                                <ToggleRight size={24} className="text-emerald-500" />
                                            ) : (
                                                <ToggleLeft size={24} className="text-[#3d405b]/30" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => startEdit(activity)}
                                            className="p-1.5 text-[#3d405b]/40 hover:text-[#609279] hover:bg-[#81b29a]/10 rounded-lg transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        {deleteConfirmId === activity.id ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleDelete(activity.id)}
                                                    disabled={loading}
                                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                >
                                                    ยืนยันลบ
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(null)}
                                                    className="px-2 py-1 text-xs text-[#3d405b]/50 hover:bg-[#d1cce7]/15 rounded-lg transition-colors"
                                                >
                                                    ยกเลิก
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirmId(activity.id)}
                                                disabled={loading}
                                                className="p-1.5 text-[#3d405b]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="ลบ"
                                            >
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
