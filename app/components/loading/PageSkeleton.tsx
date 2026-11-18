import type { ReactNode } from "react";

function Skeleton({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Memuat halaman…</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {children}
      </div>
    </div>
  );
}

function Block({ className }: { className: string }) {
  return <div className={`bg-gray-200 ${className}`} />;
}

export function ListSkeleton() {
  return (
    <Skeleton className="wrap min-h-[55dvh] py-8 sm:py-12">
      <Block className="h-8 w-36" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="space-y-3 border border-rule p-3">
            <Block className="aspect-video w-full" />
            <Block className="h-5 w-10/12" />
            <Block className="h-3 w-7/12" />
          </div>
        ))}
      </div>
    </Skeleton>
  );
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
      <Block className="mt-8 aspect-video w-full" />
    </Skeleton>
  );
}

export function DashboardSkeleton() {
  return (
    <Skeleton className="min-h-[60dvh] bg-gray-50">
      <div className="flex">
        <div className="hidden w-64 shrink-0 space-y-6 border-r border-rule bg-paper p-6 lg:block">
          {[0, 1, 2, 3].map((item) => <Block key={item} className="h-4 w-4/5" />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-h-20 items-center border-b border-rule bg-paper px-5 sm:px-8 lg:px-12">
            <Block className="h-4 w-36" />
          </div>
          <div className="space-y-5 px-5 py-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <Block key={item} className="h-20" />)}
            </div>
            <div className="divide-y divide-rule border border-rule bg-paper px-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between gap-4 py-5">
                  <Block className="h-4 w-2/3 max-w-sm" />
                  <Block className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Skeleton>
  );
}
