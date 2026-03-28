"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === "th" ? "en" : "th";
    // We replace the current route with the new locale
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/50 hover:bg-white text-[#3d405b] text-xs sm:text-sm font-semibold rounded-xl border border-[#d1cce7]/30 shadow-sm transition-all"
    >
      <span className="text-[10px] sm:text-xs">
        {locale === "th" ? "EN" : "TH"}
      </span>
      <span className="hidden sm:inline border-l border-[#d1cce7]/50 pl-2">
        {locale === "th" ? "เปลี่ยนภาษา" : "Switch Language"}
      </span>
    </button>
  );
}
