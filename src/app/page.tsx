export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-3xl mb-6 shadow-xl shadow-blue-200">
          <span className="text-white text-4xl font-bold">N</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Namoland</h1>
        <p className="text-slate-500 mb-8">ระบบจัดการนโมแลนด์</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors"
          >
            Admin เข้าสู่ระบบ
          </a>
          <a
            href="/youtube"
            className="px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          >
            ดู YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
