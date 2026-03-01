import type { Metadata } from "next";
import { Inter, Kanit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Namoland Management",
  description: "Namoland System for Book Borrowing and Coin Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${inter.variable} ${kanit.variable} font-sans antialiased bg-slate-50 text-slate-800`}
      >
        {children}
      </body>
    </html>
  );
}
