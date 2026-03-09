"use client";

import { useState, useRef } from "react";
import { Calendar } from "lucide-react";

interface DateInputProps {
    value: string; // yyyy-MM-dd
    onChange: (value: string) => void;
    min?: string; // yyyy-MM-dd
    className?: string;
    yearBack?: number;
    yearForward?: number;
    placeholder?: string;
}

/** Convert yyyy-MM-dd → dd/mm/yyyy */
function toDisplay(isoValue: string): string {
    if (!isoValue) return "";
    const [y, m, d] = isoValue.split("-");
    if (!y || !m || !d) return "";
    return `${d}/${m}/${y}`;
}

/** Convert dd/mm/yyyy → yyyy-MM-dd */
function toIso(display: string): string {
    const match = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return "";
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export default function DateInput({
    value,
    onChange,
    min,
    className = "",
    placeholder = "dd/mm/yyyy",
}: DateInputProps) {
    const [typing, setTyping] = useState<string | null>(null);
    const datePickerRef = useRef<HTMLInputElement>(null);

    const displayValue = typing !== null ? typing : toDisplay(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value;

        // Strip non-digit and non-slash
        raw = raw.replace(/[^\d/]/g, "");

        // Auto-insert slashes for smooth typing
        const digits = raw.replace(/\//g, "");
        if (digits.length <= 2) {
            raw = digits;
            if (digits.length === 2 && e.target.value.length > displayValue.length) {
                raw = digits + "/";
            }
        } else if (digits.length <= 4) {
            raw = digits.slice(0, 2) + "/" + digits.slice(2);
            if (digits.length === 4 && e.target.value.length > displayValue.length) {
                raw = digits.slice(0, 2) + "/" + digits.slice(2) + "/";
            }
        } else {
            raw = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8);
        }

        setTyping(raw);

        // When we have a complete date dd/mm/yyyy — validate & emit
        const iso = toIso(raw);
        if (iso) {
            const [y, m, d] = iso.split("-").map(Number);
            const dateObj = new Date(y, m - 1, d);
            if (
                dateObj.getFullYear() === y &&
                dateObj.getMonth() === m - 1 &&
                dateObj.getDate() === d
            ) {
                setTyping(null);
                onChange(iso);
            }
        } else if (raw === "") {
            setTyping(null);
            onChange("");
        }
    };

    const handleBlur = () => {
        setTyping(null);
    };

    /** When user picks from the native calendar */
    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value; // yyyy-MM-dd from native picker
        if (iso) {
            setTyping(null);
            onChange(iso);
        }
    };

    const openPicker = () => {
        datePickerRef.current?.showPicker();
    };

    const baseClass = className || "w-full px-3 py-2.5 border border-[#d1cce7]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#81b29a]/20 focus:border-[#81b29a]";

    return (
        <div className="relative inline-flex items-center w-full">
            {/* Visible text input with dd/mm/yyyy format */}
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                maxLength={10}
                className={`${baseClass} pr-9`}
            />

            {/* Calendar icon button */}
            <button
                type="button"
                onClick={openPicker}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#3d405b]/40 hover:text-[#81b29a] transition-colors"
                tabIndex={-1}
            >
                <Calendar size={16} />
            </button>

            {/* Hidden native date picker — triggered by the calendar icon */}
            <input
                ref={datePickerRef}
                type="date"
                value={value}
                onChange={handlePickerChange}
                min={min}
                className="absolute inset-0 opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
}
