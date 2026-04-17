export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#F7F6F3' }}>
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-2.5 w-32 bg-slate-100 rounded-full animate-pulse hidden sm:block" />
            </div>
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Title */}
        <div className="mb-8 space-y-2">
          <div className="h-8 w-52 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded-full animate-pulse" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 ring-1 ring-black/[0.05] shadow-sm space-y-2">
              <div className="h-2.5 w-12 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-8 w-10 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-slate-200 rounded-full animate-pulse mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl ring-1 ring-black/[0.05] shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 bg-slate-200 rounded-full animate-pulse" />
                    <div className="h-2.5 w-20 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex gap-3.5">
                    <div className="w-11 h-[62px] rounded-xl bg-slate-100 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3.5 w-3/4 bg-slate-200 rounded-full animate-pulse" />
                      <div className="h-2.5 w-1/2 bg-slate-100 rounded-full animate-pulse" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
