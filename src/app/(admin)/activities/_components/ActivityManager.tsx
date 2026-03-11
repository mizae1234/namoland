"use client";

import { useState } from "react";
import {
    createActivityConfig,
    updateActivityConfig,
    toggleActivityActive,
    deleteActivityConfig,
    seedActivityConfigs,
} from "@/actions/activityConfig";
import { Plus, Pencil, Trash2, Check, X, Download, ToggleLeft, ToggleRight } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";

interface ActivityData {
    id: string;
    name: string;
    coins: number;
    sortOrder: number;
    isActive: boolean;
}

export default function ActivityManager({ activities }: { activities: ActivityData[] }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Edit state
    const [editName, setEditName] = useState("");
    const [editCoins, setEditCoins] = useState("");
    const [editSort, setEditSort] = useState("");

    // Add state
    const [addName, setAddName] = useState("");
    const [addCoins, setAddCoins] = useState("");
    const [addSort, setAddSort] = useState("");

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const startEdit = (activity: ActivityData) => {
        setEditId(activity.id);
        setEditName(activity.name);
        setEditCoins(String(activity.coins));
        setEditSort(String(activity.sortOrder));
    };

    const cancelEdit = () => setEditId(null);

    const handleUpdate = async (id: string) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("id", id);
        fd.set("name", editName);
        fd.set("coins", editCoins);
        fd.set("sortOrder", editSort);
        const result = await updateActivityConfig(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("อัปเดตสำเร็จ!");
            setEditId(null);
        }
    };

    const handleAdd = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("name", addName);
        fd.set("coins", addCoins);
        fd.set("sortOrder", addSort);
        const result = await createActivityConfig(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("เพิ่มกิจกรรมสำเร็จ!");
            setShowAdd(false);
            setAddName("");
            setAddCoins("");
            setAddSort("");
        }
    };

    const handleToggle = async (id: string) => {
        setLoading(true);
        const result = await toggleActivityActive(id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg("อัปเดตสถานะสำเร็จ!");
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

    return (
        <div>
            <AlertMessage
                type={message.includes("สำเร็จ") ? "success" : "error"}
                message={message}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowAdd(false)}
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

            {/* Activities Table */}
            <Card padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#d1cce7]/20 text-left">
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">ลำดับ</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">ชื่อกิจกรรม</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-right">เหรียญ</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-center">สถานะ</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d1cce7]/15">
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[#3d405b]/40">
                                        ยังไม่มีกิจกรรม
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => (
                                    <tr
                                        key={activity.id}
                                        className={`hover:bg-[#f4f1de]/30 transition-colors ${!activity.isActive ? "opacity-50" : ""}`}
                                    >
                                        {editId === activity.id ? (
                                            <>
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="number"
                                                        value={editSort}
                                                        onChange={(e) => setEditSort(e.target.value)}
                                                        className="w-16 px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                                    />
                                                </td>
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                                    />
                                                </td>
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="number"
                                                        value={editCoins}
                                                        onChange={(e) => setEditCoins(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                                    />
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activity.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                        {activity.isActive ? "เปิด" : "ปิด"}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleUpdate(activity.id)}
                                                            disabled={loading}
                                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="บันทึก"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-1.5 text-[#3d405b]/40 hover:bg-[#d1cce7]/15 rounded-lg transition-colors"
                                                            title="ยกเลิก"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-3 px-4 text-[#3d405b]/40">{activity.sortOrder}</td>
                                                <td className="py-3 px-4 font-medium text-[#3d405b]">{activity.name}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-amber-600">
                                                    {activity.coins > 0 ? `${activity.coins} เหรียญ` : "กำหนดเอง"}
                                                </td>
                                                <td className="py-3 px-4 text-center">
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
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-1">
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
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
