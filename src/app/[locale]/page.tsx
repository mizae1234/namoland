import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import {
  BookOpen,
  Palette,
  FlaskConical,
  Music,
  GraduationCap,
  Globe,
  Heart,
  Star,
  Sparkles,
  ArrowRight,
  Phone,
  MapPin,
} from "lucide-react";
import { getClassSchedulesWithEntries } from "@/actions/classSchedule";
import { getShopInfo } from "@/actions/shop";
import { getActivitiesForLanding } from "@/actions/activityConfig";
import LandingSchedule from "./_components/LandingSchedule";
import LandingActivities from "./_components/LandingActivities";

export const revalidate = 0;

export default async function LandingPage() {
  const t = await getTranslations("Landing");
  const [rawSchedules, shopInfo, activities] = await Promise.all([
    getClassSchedulesWithEntries(),
    getShopInfo(),
    getActivitiesForLanding()
  ]);
      const scheduleImageUrl = shopInfo.scheduleImageUrl;
      const weeklyScheduleImageUrl = shopInfo.weeklyScheduleImageUrl;
  const schedules = rawSchedules.map((s: { id: string; theme: string | null; startDate: Date; endDate: Date; entries: { dayOfWeek: number; startTime: string; endTime: string; title: string }[] }) => ({
    id: s.id,
    theme: s.theme,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    entries: s.entries.map((e: { dayOfWeek: number; startTime: string; endTime: string; title: string }) => ({
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      title: e.title,
    })),
  }));
  return (
    <div className="min-h-screen bg-[#f4f1de] text-[#3d405b] overflow-x-hidden">
      {/* ─── Navigation ─────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#d1cce7]/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/namoland-logo.png" alt="NAMOLAND" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover" />
            <span className="font-bold text-base sm:text-lg text-[#3d405b]">NAMOLAND</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#activities" className="text-[#3d405b]/70 hover:text-[#3d405b] transition-colors">{t("nav.activities")}</a>
            <a href="#programs" className="text-[#3d405b]/70 hover:text-[#3d405b] transition-colors">{t("nav.programs")}</a>
            <a href="#library" className="text-[#3d405b]/70 hover:text-[#3d405b] transition-colors">{t("nav.library")}</a>
            <a href="#contact" className="text-[#3d405b]/70 hover:text-[#3d405b] transition-colors">{t("nav.contact")}</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link
              href="/user/login"
              className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#3d405b] hover:text-[#609279] transition-colors"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/user/register"
              className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#609279] to-[#a16b9f] text-white rounded-lg sm:rounded-xl shadow-lg shadow-[#a16b9f]/20 hover:shadow-xl transition-all"
            >
              {t("nav.register")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────── */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-[-100px] w-[400px] h-[400px] bg-[#ecb4ce]/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-[-100px] w-[350px] h-[350px] bg-[#81b29a]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#f2cc8f]/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#d1cce7]/30 rounded-full text-xs sm:text-sm font-medium text-[#a16b9f] mb-4 sm:mb-6">
                <Sparkles size={12} className="sm:w-[14px] sm:h-[14px]" />
                Kids Creative Club
              </div>
              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-3 sm:mb-6">
                <span className="text-[#3d405b]">{t("hero.titlePart1")}</span>
                <br />
                <span className="bg-gradient-to-r from-[#81b29a] via-[#e07a5f] to-[#a16b9f] bg-clip-text text-transparent">
                  {t("hero.titlePart2")}
                </span>
              </h1>
              <p className="text-sm sm:text-lg text-[#3d405b]/70 mb-2 sm:mb-4 leading-relaxed max-w-lg mx-auto md:mx-0">
                {t("hero.subtitlePrefix")}
                <strong className="text-[#609279]">{t("hero.art")}</strong>,{" "}
                <strong className="text-[#e07a5f]">{t("hero.english")}</strong>,{" "}
                <strong className="text-[#a16b9f]">{t("hero.science")}</strong> และ
                <strong className="text-[#f9b61a]">{t("hero.imagination")}</strong>
              </p>
              <p className="text-[#3d405b]/50 mb-5 sm:mb-8 text-[11px] sm:text-sm">
                {t("hero.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center md:justify-start">
                <Link
                  href="/user/register"
                  className="group px-5 sm:px-8 py-2.5 sm:py-4 bg-gradient-to-r from-[#e07a5f] to-[#e55f15] text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg shadow-[#e07a5f]/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {t("hero.startBtn")}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/user/login"
                  className="px-5 sm:px-8 py-2.5 sm:py-4 bg-white text-[#3d405b] font-semibold rounded-xl sm:rounded-2xl border-2 border-[#d1cce7]/50 shadow-sm hover:border-[#81b29a]/50 hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {t("hero.loginBtn")}
                </Link>
              </div>


            </div>

            {/* Right: Hero Image */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#81b29a]/10 via-[#ecb4ce]/10 to-[#f2cc8f]/10 rounded-[3rem] rotate-3" />
              <div className="relative w-full max-w-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#3d405b]/10 border-4 border-white">
                <Image
                  src={shopInfo.heroImageUrl || "/hero-kids.png"}
                  alt="เด็กๆ กำลังสร้างสรรค์ผลงานศิลปะที่ NAMOLAND"
                  width={480}
                  height={480}
                  className="w-full h-auto object-cover"
                  priority
                  unoptimized={!!shopInfo.heroImageUrl}
                />
              </div>
              {/* Floating badges — hidden on mobile to avoid overlap */}
              <div className="hidden sm:flex absolute top-4 -right-6 bg-white px-4 py-2.5 rounded-2xl shadow-lg items-center gap-2 animate-bounce" style={{ animationDuration: "3s" }}>
                <span className="text-xl">🎨</span>
                <span className="text-xs font-semibold text-[#3d405b]">Art & Design</span>
              </div>
              <div className="hidden sm:flex absolute bottom-8 -left-6 bg-white px-4 py-2.5 rounded-2xl shadow-lg items-center gap-2 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
                <span className="text-xl">📚</span>
                <span className="text-xs font-semibold text-[#3d405b]">Book Club</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Activities Section ─────────────────────────── */}
      <section id="activities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#81b29a]/10 rounded-full text-sm font-medium text-[#609279] mb-4">
              <Star size={14} />
              {t("activities.badge")}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#3d405b] mb-4">
              {t("activities.title1")}<span className="text-[#81b29a]">{t("activities.title2")}</span>
            </h2>
            <p className="text-[#3d405b]/60 max-w-2xl mx-auto">
              {t("activities.desc")}
            </p>
          </div>

          <LandingActivities activities={activities} />
        </div>
      </section>

      {/* ─── Class Schedule ─────────────────────────────── */}
      {scheduleImageUrl || weeklyScheduleImageUrl ? (
        <section id="programs" className="py-20 bg-gradient-to-b from-[#f4f1de] to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#a16b9f]/10 rounded-full text-sm font-medium text-[#a16b9f] mb-4">
                {t("programs.badge")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#3d405b] mb-4">
                {t("programs.title1")}<span className="text-[#a16b9f]">{t("programs.title2")}</span>
              </h2>
              <p className="text-[#3d405b]/60 max-w-2xl mx-auto">
                {t("programs.desc")}
              </p>
            </div>
            <div className="grid gap-8 grid-cols-1 max-w-5xl mx-auto">
              {scheduleImageUrl && (
                <div className="rounded-3xl overflow-hidden shadow-xl border border-[#d1cce7]/20 flex justify-center bg-white/50">
                  <Image
                    src={scheduleImageUrl}
                    alt="ตารางกิจกรรมประจำเดือน NAMOLAND"
                    width={1200}
                    height={1600}
                    className="w-full h-auto object-contain max-h-[90vh]"
                    unoptimized
                  />
                </div>
              )}
              {weeklyScheduleImageUrl && (
                <div className="rounded-3xl overflow-hidden shadow-xl border border-[#d1cce7]/20 flex justify-center bg-white/50 mt-4">
                  <Image
                    src={weeklyScheduleImageUrl}
                    alt="ตารางกิจกรรมประจำสัปดาห์ NAMOLAND"
                    width={1200}
                    height={1600}
                    className="w-full h-auto object-contain max-h-[90vh]"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <LandingSchedule schedules={schedules} />
      )}



      {/* ─── CTA Banner ─────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-[#609279] to-[#a16b9f] rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 md:p-16 text-center text-white overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#81b29a]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ecb4ce]/15 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-white/70 max-w-lg mx-auto mb-8">
                {t("cta.desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/user/register"
                  className="px-8 py-4 bg-white text-[#3d405b] font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  {t("cta.registerBtn")}
                </Link>
                <Link
                  href="/user/login"
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
                >
                  {t("cta.loginBtn")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact / Footer ───────────────────────────── */}
      <footer id="contact" className="bg-[#3d405b] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/namoland-logo.png" alt="NAMOLAND" width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
                <span className="font-bold text-lg">NAMOLAND Kids Creative Club</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {t("footer.desc")}
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4 text-white/80">{t("footer.quickLinks.title")}</h3>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link href="/user/login" className="hover:text-white transition-colors">{t("footer.quickLinks.login")}</Link></li>
                <li><Link href="/user/register" className="hover:text-white transition-colors">{t("footer.quickLinks.register")}</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">{t("footer.quickLinks.adminLogin")}</Link></li>
                <li><Link href="/youtube" className="hover:text-white transition-colors">{t("footer.quickLinks.youtube")}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4 text-white/80">{t("footer.contact.title")}</h3>
              <ul className="space-y-3 text-sm text-white/50">
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#81b29a]" />
                  Samut Prakan
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-[#81b29a]" />
                  Line OA: @namoland
                </li>
                <li className="flex items-center gap-2">
                  <Globe size={14} className="text-[#81b29a]" />
                  <a href="https://www.facebook.com/namolandkidscreativeclub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {t("footer.contact.facebook")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center text-xs text-white/30">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
}
