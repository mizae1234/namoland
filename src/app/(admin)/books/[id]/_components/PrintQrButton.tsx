"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

export default function PrintQrButton({
    qrCode,
    title,
}: {
    qrCode: string;
    title: string;
}) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=400,height=500");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${title}</title>
                <style>
                    @page { size: 80mm 100mm; margin: 5mm; }
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        font-family: -apple-system, sans-serif;
                        text-align: center;
                    }
                    .logo { font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #334155; }
                    .qr-container { padding: 12px; }
                    .title { font-size: 13px; font-weight: 600; margin-top: 8px; color: #1e293b; max-width: 200px; }
                    .code { font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 4px; }
                    .hint { font-size: 9px; color: #94a3b8; margin-top: 6px; }
                </style>
            </head>
            <body>
                <div class="logo">📚 Namoland</div>
                <div class="qr-container" id="qr-target"></div>
                <div class="title">${title}</div>
                <div class="code">${qrCode}</div>
                <div class="hint">สแกนเพื่อดูรายละเอียด</div>
            </body>
            </html>
        `);

        // Render QR code as SVG in the new window
        const qrTarget = printWindow.document.getElementById("qr-target");
        if (qrTarget && printRef.current) {
            const svg = printRef.current.querySelector("svg");
            if (svg) {
                qrTarget.innerHTML = svg.outerHTML;
            }
        }

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };

    const bookUrl = typeof window !== "undefined"
        ? `${window.location.origin}/book/${qrCode}`
        : `/book/${qrCode}`;

    return (
        <div>
            {/* Hidden QR for copying to print window */}
            <div ref={printRef} className="hidden">
                <QRCodeSVG value={bookUrl} size={180} level="M" />
            </div>

            <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#d1cce7]/15 hover:bg-[#d1cce7]/25 text-[#3d405b]/70 rounded-lg transition-colors"
            >
                <Printer size={14} />
                พิมพ์ QR
            </button>
        </div>
    );
}
