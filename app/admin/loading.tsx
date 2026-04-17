export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#F7F6F3' }}>
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-2.5 w-28 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-16 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-4 w-72 bg-slate-100 rounded-full animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-black/[0.05] shadow-sm space-y-2">
              <div className="h-2.5 w-12 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-8 w-10 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton — desktop */}
        <div className="hidden sm:block bg-white rounded-3xl ring-1 ring-black/[0.05] shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex gap-6">
            {['w-48', 'w-24', 'w-20', 'w-20', 'w-16', 'w-10'].map((w, i) => (
              <div key={i} className={`h-2.5 ${w} bg-slate-100 rounded-full animate-pulse`} />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-slate-50 last:border-0 px-6 py-4 flex items-center gap-6">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-9 h-[50px] rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3 w-36 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-2.5 w-24 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse ml-auto" />
            </div>
          ))}
        </div>

        {/* Cards skeleton — mobile */}
        <div className="sm:hidden space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-black/[0.05] shadow-sm p-4 space-y-3">
              <div className="flex gap-3.5">
                <div className="w-11 h-[62px] rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 w-3/4 bg-slate-200 rounded-full animate-pulse" />
                  <div className="h-2.5 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-2.5 w-24 bg-slate-100 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="h-px bg-slate-50" />
              <div className="flex justify-between">
                <div className="h-2.5 w-32 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
