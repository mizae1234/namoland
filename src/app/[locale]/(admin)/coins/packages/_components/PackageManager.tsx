"use client";

import { useState } from "react";
import {
    createPackageConfig,
    updatePackageConfig,
    togglePackageActive,
    deletePackageConfig,
    seedPackageConfigs,
} from "@/actions/packageConfig";
import { Plus, Pencil, Trash2, Check, X, Download, ToggleLeft, ToggleRight } from "lucide-react";
import Card from "@/components/ui/Card";
import AlertMessage from "@/components/ui/AlertMessage";
import { useTranslations } from "next-intl";

interface PackageData {
    id: string;
    key: string;
    label: string;
    coins: number;
    price: number;
    bonus: number;
    sortOrder: number;
    isActive: boolean;
}

export default function PackageManager({ packages }: { packages: PackageData[] }) {
    const t = useTranslations("AdminSettings.packages");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Edit state
    const [editLabel, setEditLabel] = useState("");
    const [editCoins, setEditCoins] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editBonus, setEditBonus] = useState("");
    const [editSort, setEditSort] = useState("");

    // Add state
    const [addLabel, setAddLabel] = useState("");
    const [addCoins, setAddCoins] = useState("");
    const [addPrice, setAddPrice] = useState("");
    const [addBonus, setAddBonus] = useState("");
    const [addSort, setAddSort] = useState("");

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const startEdit = (pkg: PackageData) => {
        setEditId(pkg.id);
        setEditLabel(pkg.label);
        setEditCoins(String(pkg.coins));
        setEditPrice(String(pkg.price));
        setEditBonus(String(pkg.bonus));
        setEditSort(String(pkg.sortOrder));
    };

    const cancelEdit = () => setEditId(null);

    const handleUpdate = async (id: string) => {
        setLoading(true);
        const fd = new FormData();
        fd.set("id", id);
        fd.set("label", editLabel);
        fd.set("coins", editCoins);
        fd.set("price", editPrice);
        fd.set("bonus", editBonus);
        fd.set("sortOrder", editSort);
        const result = await updatePackageConfig(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg(t("messages.updateSuccess"));
            setEditId(null);
        }
    };

    const handleAdd = async () => {
        setLoading(true);
        const fd = new FormData();
        fd.set("label", addLabel);
        fd.set("coins", addCoins);
        fd.set("price", addPrice);
        fd.set("bonus", addBonus);
        fd.set("sortOrder", addSort);
        const result = await createPackageConfig(fd);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else {
            showMsg(t("messages.addSuccess"));
            setShowAdd(false);
            setAddLabel("");
            setAddCoins("");
            setAddPrice("");
            setAddBonus("");
            setAddSort("");
        }
    };

    const handleToggle = async (id: string) => {
        setLoading(true);
        const result = await togglePackageActive(id);
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg(t("messages.statusSuccess"));
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        const result = await deletePackageConfig(id);
        setLoading(false);
        setDeleteConfirmId(null);
        if (result.error) showMsg(result.error);
        else showMsg(t("messages.deleteSuccess"));
    };

    const handleSeed = async () => {
        setLoading(true);
        const result = await seedPackageConfigs();
        setLoading(false);
        if (result.error) showMsg(result.error);
        else showMsg(t("messages.seedSuccess"));
    };

    return (
        <div>
            <AlertMessage
                type={(message.includes("สำเร็จ") || message.includes("success")) ? "success" : "error"}
                message={message}
            />

            {/* Seed button — only if no packages */}
            {packages.length === 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-amber-800 font-medium mb-3">{t("seed.title")}</p>
                    <p className="text-sm text-amber-600 mb-4">{t("seed.desc")}</p>
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        <Download size={16} />
                        {t("seed.button")}
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
                    {t("addBtn")}
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <Card className="mb-4">
                    <h3 className="font-semibold text-[#3d405b] mb-4">{t("form.title")}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("form.name")}</label>
                            <input
                                type="text"
                                value={addLabel}
                                onChange={(e) => setAddLabel(e.target.value)}
                                placeholder={t("form.namePh")}
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("form.coins")}</label>
                            <input
                                type="number"
                                value={addCoins}
                                onChange={(e) => setAddCoins(e.target.value)}
                                placeholder="50"
                                min="1"
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("form.price")}</label>
                            <input
                                type="number"
                                value={addPrice}
                                onChange={(e) => setAddPrice(e.target.value)}
                                placeholder="9000"
                                min="0"
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("form.bonus")}</label>
                            <input
                                type="number"
                                value={addBonus}
                                onChange={(e) => setAddBonus(e.target.value)}
                                placeholder="0"
                                min="0"
                                className="w-full px-3 py-2 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#3d405b]/60 block mb-1">{t("form.sortOrder")}</label>
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
                            {t("form.cancel")}
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || !addLabel || !addCoins || !addPrice}
                            className="flex items-center gap-2 px-4 py-2 bg-[#609279] text-white rounded-xl text-sm font-medium hover:bg-[#4e7a64] transition-colors disabled:opacity-50"
                        >
                            <Check size={16} />
                            {t("form.save")}
                        </button>
                    </div>
                </Card>
            )}

            {/* Packages Table */}
            <Card padding={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#d1cce7]/20 text-left">
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">{t("table.sort")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60">{t("table.name")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-right">{t("table.coins")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-right">{t("table.price")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-right">{t("table.bonus")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-center">{t("table.status")}</th>
                                <th className="py-3 px-4 font-semibold text-[#3d405b]/60 text-center">{t("table.manage")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d1cce7]/15">
                            {packages.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-[#3d405b]/40">
                                        {t("table.empty")}
                                    </td>
                                </tr>
                            ) : (
                                packages.map((pkg) => (
                                    <tr
                                        key={pkg.id}
                                        className={`hover:bg-[#f4f1de]/30 transition-colors ${!pkg.isActive ? "opacity-50" : ""}`}
                                    >
                                        {editId === pkg.id ? (
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
                                                        value={editLabel}
                                                        onChange={(e) => setEditLabel(e.target.value)}
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
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="number"
                                                        value={editPrice}
                                                        onChange={(e) => setEditPrice(e.target.value)}
                                                        className="w-24 px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                                    />
                                                </td>
                                                <td className="py-2 px-4">
                                                    <input
                                                        type="number"
                                                        value={editBonus}
                                                        onChange={(e) => setEditBonus(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-[#d1cce7]/30 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#81b29a]/30"
                                                    />
                                                </td>
                                                <td className="py-2 px-4 text-center">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                                        {pkg.isActive ? t("table.on") : t("table.off")}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleUpdate(pkg.id)}
                                                            disabled={loading}
                                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="บันทึก"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-1.5 text-[#3d405b]/40 hover:bg-[#d1cce7]/15 rounded-lg transition-colors"
                                                            title={t("form.cancel")}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="py-3 px-4 text-[#3d405b]/40">{pkg.sortOrder}</td>
                                                <td className="py-3 px-4 font-medium text-[#3d405b]">{pkg.label}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-amber-600">{pkg.coins}</td>
                                                <td className="py-3 px-4 text-right text-[#3d405b]/70">{pkg.price.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-emerald-600">{pkg.bonus > 0 ? pkg.bonus.toLocaleString() : "-"}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => handleToggle(pkg.id)}
                                                        disabled={loading}
                                                        className="disabled:opacity-50"
                                                        title={pkg.isActive ? t("table.disable") : t("table.enable")}
                                                    >
                                                        {pkg.isActive ? (
                                                            <ToggleRight size={24} className="text-emerald-500" />
                                                        ) : (
                                                            <ToggleLeft size={24} className="text-[#3d405b]/30" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => startEdit(pkg)}
                                                            className="p-1.5 text-[#3d405b]/40 hover:text-[#609279] hover:bg-[#81b29a]/10 rounded-lg transition-colors"
                                                            title={t("table.edit")}
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        {deleteConfirmId === pkg.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(pkg.id)}
                                                                    disabled={loading}
                                                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                                >
                                                                    {t("table.confirmDelete")}
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                    className="px-2 py-1 text-xs text-[#3d405b]/50 hover:bg-[#d1cce7]/15 rounded-lg transition-colors"
                                                                >
                                                                    {t("form.cancel")}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirmId(pkg.id)}
                                                                disabled={loading}
                                                                className="p-1.5 text-[#3d405b]/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title={t("table.delete")}
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
