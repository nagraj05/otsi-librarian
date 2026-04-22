export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton — always dark like the real page */}
      <div className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/70 via-slate-900/60 to-background" />

        {/* Back nav */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5">
          <div className="h-4 w-28 bg-white/20 animate-pulse rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Cover */}
            <div className="w-35 h-50 rounded-2xl bg-white/10 animate-pulse shrink-0 mx-auto sm:mx-0" />

            {/* Meta */}
            <div className="flex-1 space-y-3 text-center sm:text-left pt-2">
              <div className="h-2.5 w-20 bg-white/20 animate-pulse rounded-full mx-auto sm:mx-0" />
              <div className="h-8 w-3/4 bg-white/25 animate-pulse rounded-full mx-auto sm:mx-0" />
              <div className="h-4 w-40 bg-white/15 animate-pulse rounded-full mx-auto sm:mx-0" />
              <div className="flex gap-1.5 justify-center sm:justify-start mt-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-sm bg-white/20 animate-pulse" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-7 w-20 bg-white/15 animate-pulse rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm p-6 space-y-3">
              <div className="h-4 w-32 bg-muted animate-pulse rounded-full" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-3 ${i === 3 ? 'w-2/3' : 'w-full'} bg-muted/60 animate-pulse rounded-full`} />
              ))}
            </div>
            <div className="bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm p-6 space-y-4">
              <div className="h-4 w-28 bg-muted animate-pulse rounded-full" />
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2.5 w-16 bg-muted/60 animate-pulse rounded-full" />
                    <div className="h-3.5 w-24 bg-muted animate-pulse rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">
            <div className="bg-card rounded-3xl ring-1 ring-foreground/5 shadow-sm p-6 space-y-4">
              <div className="h-4 w-28 bg-muted animate-pulse rounded-full" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="h-3 w-24 bg-muted animate-pulse rounded-full" />
                    <div className="h-2.5 w-32 bg-muted/60 animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
