"use client";

import { useState } from "react";
import { updateMember, resetMemberPassword } from "@/actions/member";
import { Pencil, X, Check, Plus, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";

interface Child {
    id: string;
    name: string;
    birthDate: Date | string;
}

interface MemberEditFormProps {
    member: {
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

export default function MemberEditForm({ member }: MemberEditFormProps) {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [parentName, setParentName] = useState(member.parentName);
    const [phone, setPhone] = useState(member.phone);
    const [children, setChildren] = useState<EditChild[]>(
        member.children.map(c => ({
            id: c.id,
            name: c.name,
            birthDate: format(new Date(c.birthDate), "yyyy-MM-dd"),
        }))
    );

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const resetForm = () => {
        setParentName(member.parentName);
        setPhone(member.phone);
        setChildren(
            member.children.map(c => ({
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
        fd.set("id", member.id);
        fd.set("parentName", parentName);
        fd.set("phone", phone);
        fd.set("children", JSON.stringify(children.filter(c => c.name && c.birthDate)));
        const result = await updateMember(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg("บันทึกสำเร็จ!");
            setEditing(false);
        }
    };

    const handleResetPassword = async () => {
        setLoading(true);
        const result = await resetMemberPassword(member.id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg(`รีเซ็ตรหัสผ่านสำเร็จ! รหัสใหม่: ${result.hint}`);
    };

    if (!editing) {
        return (
            <div className="flex gap-2">
                <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#3d405b]/50 hover:text-[#609279] hover:bg-[#81b29a]/10 rounded-lg transition-colors"
                    title="แก้ไขข้อมูล"
                >
                    <Pencil size={12} />
                    แก้ไข
                </button>
                <AlertMessage type={message.includes("สำเร็จ") ? "success" : "error"} message={message} />
            </div>
        );
    }

    return (
        <Card className="mt-4">
            <AlertMessage type={message.includes("สำเร็จ") ? "success" : "error"} message={message} />
            <h3 className="font-semibold text-[#3d405b] mb-4">แก้ไขข้อมูลสมาชิก</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">ชื่อผู้ปกครอง</label>
                    <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">เบอร์โทร</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                    />
                </div>
            </div>

            {/* Children */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-[#3d405b]/60">เด็ก</label>
                    <button
                        type="button"
                        onClick={addChild}
                        className="flex items-center gap-1 text-xs text-[#609279] hover:text-[#4e7a64]"
                    >
                        <Plus size={12} /> เพิ่มเด็ก
                    </button>
                </div>
                <div className="space-y-2">
                    {children.map((child, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={child.name}
                                onChange={(e) => updateChild(idx, "name", e.target.value)}
                                placeholder="ชื่อเด็ก"
                                className="flex-1 px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                            />
                            <input
                                type="date"
                                value={child.birthDate}
                                onChange={(e) => updateChild(idx, "birthDate", e.target.value)}
                                className="px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20"
                            />
                            <button
                                type="button"
                                onClick={() => removeChild(idx)}
                                className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
                <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                    <RotateCcw size={12} />
                    รีเซ็ตรหัสผ่าน (เป็น 4 ตัวท้ายเบอร์)
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={resetForm}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#3d405b]/50 hover:text-[#3d405b]"
                    >
                        <X size={14} /> ยกเลิก
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !parentName || !phone}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] disabled:opacity-50"
                    >
                        <Check size={14} /> {loading ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                </div>
            </div>
        </Card>
    );
}
