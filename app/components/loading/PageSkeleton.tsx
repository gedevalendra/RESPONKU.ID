import type { ReactNode } from "react";

export function Skeleton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Memuat halaman…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {children}
      </div>
    </div>
  );
}

export function Block({ className }: { className: string }) {
  return <div className={`bg-gray-200 ${className}`} />;
}

export function ArticleSkeleton() {
  return (
    <Skeleton className="wrap min-h-[55dvh] py-8 sm:py-12">
      <Block className="h-3 w-32" />
      <div className="mt-6 max-w-3xl space-y-4">
        <Block className="h-3 w-20" />
        <Block className="h-8 w-full sm:h-12" />
        <Block className="h-8 w-4/5 sm:h-12" />
        <Block className="h-4 w-11/12" />
        <Block className="h-4 w-2/3" />
        <div className="flex items-center gap-3 pt-2">
          <Block className="size-8 rounded-full" />
          <Block className="h-3 w-36" />
        </div>
      </div>
      <Block className="mt-8 aspect-video w-full sm:aspect-[21/9]" />
      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-4 lg:col-span-8">
          <Block className="h-4 w-full" /><Block className="h-4 w-11/12" /><Block className="h-4 w-4/5" />
        </div>
        <div className="hidden lg:col-span-4 lg:block"><Block className="h-11 w-full" /><Rows count={2} /></div>
      </div>
    </Skeleton>
  );
}

export function Rows({ count = 3, image = false, actions = false }: { count?: number; image?: boolean; actions?: boolean }) {
  return (
    <div className="divide-y divide-rule">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-start gap-4 py-5">
          {image && <Block className="hidden h-24 w-32 shrink-0 sm:block" />}
          <div className="min-w-0 flex-1 space-y-3">
            <Block className="h-3 w-20" />
            <Block className={`h-5 ${index % 2 ? "w-3/5" : "w-4/5"}`} />
            <Block className="h-3 w-1/2" />
          </div>
          {actions && <Block className="hidden h-8 w-20 shrink-0 sm:block" />}
        </div>
      ))}
    </div>
  );
}

export function Fields({ heights }: { heights: string[] }) {
  return (
    <div className="grid gap-4">
      {heights.map((height, index) => (
        <div key={index} className="grid gap-2">
          <Block className="h-3 w-24" />
          <Block className={`w-full ${height}`} />
        </div>
      ))}
    </div>
  );
}
