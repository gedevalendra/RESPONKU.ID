import type { ReactNode } from "react";
import { Block, Fields, Rows, Skeleton } from "./PageSkeleton";

function Dashboard({ children }: { children: ReactNode }) {
  return (
    <Skeleton className="min-h-[60dvh] bg-gray-50">
      <div className="flex">
        <div className="hidden w-64 shrink-0 space-y-6 border-r border-rule bg-paper p-6 lg:block">
          {[0, 1, 2, 3].map((item) => <Block key={item} className="h-4 w-4/5" />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-h-20 items-center justify-between border-b border-rule bg-paper px-5 sm:px-8 lg:px-12">
            <Block className="h-4 w-36" /><Block className="h-4 w-16" />
          </div>
          <div className="px-5 py-5 sm:px-8 sm:py-6 lg:px-12">{children}</div>
        </div>
      </div>
    </Skeleton>
  );
}

function Stats({ count, className }: { count: number; className: string }) {
  return (
    <div className={`grid gap-3 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 border border-rule bg-paper p-4">
          <Block className="h-3 w-3/5" /><Block className="h-8 w-10" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return <Dashboard>
    <Stats count={4} className="grid-cols-2 xl:grid-cols-4" />
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {[0, 1].map((item) => <div key={item} className="border border-rule bg-paper p-5"><Block className="h-6 w-40" /><Rows count={2} actions /></div>)}
    </div>
  </Dashboard>;
}

export function ApprovalContent() {
  return <div className="space-y-10">
    <Stats count={4} className="sm:grid-cols-4" />
    <div>
      <div className="space-y-2 border-b border-rule pb-3"><Block className="h-6 w-40" /><Block className="h-4 w-3/5" /></div>
      <div className="flex items-center gap-3 border-b border-rule py-3"><Block className="size-4" /><Block className="h-3 w-40" /></div>
      <Rows actions />
    </div>
  </div>;
}

export function ApprovalSkeleton() {
  return <Dashboard><ApprovalContent /></Dashboard>;
}

export function PublishedSkeleton() {
  return <Dashboard>
    <div className="rounded-xl border border-rule bg-paper p-4 sm:p-6">
      <Block className="h-4 w-36" /><Block className="mt-2 h-10 w-full max-w-md rounded-lg" />
      <div className="mt-4"><Rows count={4} actions /></div>
    </div>
  </Dashboard>;
}

export function HistorySkeleton() {
  return <Dashboard>
    <Stats count={3} className="sm:grid-cols-3" />
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      {[0, 1].map((item) => (
        <div key={item} className="space-y-3 border border-rule bg-paper p-5">
          <Block className="mb-5 h-6 w-36" />
          <Block className="h-2 w-full" /><Block className="h-2 w-4/5" /><Block className="h-2 w-3/5" />
        </div>
      ))}
    </div>
    <div className="mt-6 border border-rule bg-paper p-5">
      <div className="flex flex-wrap justify-between gap-3"><Block className="h-6 w-36" /><Block className="h-9 w-44" /></div>
      <div className="mt-4 border-t border-rule"><Rows count={4} actions /></div>
    </div>
  </Dashboard>;
}

export function CommentContent() {
  return <div className="space-y-5 bg-paper p-5">
    <div className="flex items-center gap-3"><Block className="h-4 w-24" /><Block className="h-11 w-40" /></div>
    <div className="divide-y divide-rule">
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-3 py-4">
          <Block className="h-4 w-24" /><Block className="h-3 w-16" /><Block className="h-4 w-4/5" />
          <div className="flex gap-4"><Block className="h-4 w-14" /><Block className="h-4 w-10" /><Block className="h-4 w-20" /></div>
        </div>
      ))}
    </div>
  </div>;
}

export function CommentsSkeleton() {
  return <Dashboard><CommentContent /></Dashboard>;
}

export function UsersContent() {
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4"><Block className="h-6 w-44" /><Block className="h-11 w-full sm:w-80" /></div>
    <div className="divide-y divide-rule bg-paper">
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-4 p-5">
          <div className="space-y-2"><Block className="h-4 w-32" /><Block className="h-3 w-44" /></div>
          <div className="flex flex-wrap gap-4"><Block className="h-10 w-40" /><Block className="h-10 w-24" /><Block className="h-10 w-36" /></div>
        </div>
      ))}
    </div>
  </div>;
}

export function UsersSkeleton() {
  return <Dashboard><UsersContent /></Dashboard>;
}

export function OrganizationsContent() {
  return <div className="space-y-5 bg-paper p-6">
    <Block className="h-6 w-32" /><Block className="h-4 w-3/5" /><Block className="h-11 w-full" />
    <div className="divide-y divide-rule">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex gap-3 py-4">
          <Block className="size-14 shrink-0" />
          <div className="flex-1 space-y-2"><Block className="h-4 w-32 max-w-full" /><Block className="h-3 w-3/4" /></div>
          <Block className="hidden h-8 w-20 sm:block" />
        </div>
      ))}
    </div>
  </div>;
}

export function OrganizationsSkeleton() {
  return <Dashboard><OrganizationsContent /></Dashboard>;
}

export function FaqAdminContent() {
  return <div className="space-y-5">
    <Block className="h-6 w-48" />
    <div className="divide-y divide-rule">
      {[0, 1, 2].map((item) => (
        <div key={item} className="space-y-3 py-5">
          <Block className="h-3 w-28" /><Block className="h-5 w-3/4" />
          {item === 0 && <Block className="h-20 w-full" />}
          <Block className="h-8 w-28" />
        </div>
      ))}
    </div>
  </div>;
}

export function FaqAdminSkeleton() {
  return <Dashboard><FaqAdminContent /></Dashboard>;
}

export function ComposeNotificationSkeleton() {
  return <Dashboard>
    <div className="max-w-2xl space-y-5 bg-paper p-6 sm:p-8">
      <div className="space-y-3"><Block className="h-3 w-20" /><Block className="h-4 w-32" /><Block className="h-4 w-40" /></div>
      <Fields heights={["h-10", "h-32", "h-10"]} />
      <Block className="h-10 w-32" />
    </div>
  </Dashboard>;
}

export function AboutAdminContent() {
  return <div className="mt-16">
    <div className="flex items-end justify-between gap-3 border-b border-rule pb-4">
      <div className="space-y-3"><Block className="h-3 w-24" /><Block className="h-6 w-40" /></div>
      <Block className="h-10 w-24" />
    </div>
    <div className="mt-6 bg-paper p-5"><Fields heights={["h-11", "h-24"]} /></div>
    <div className="mt-6 border border-rule bg-paper p-5"><Fields heights={["h-11", "h-20"]} /></div>
  </div>;
}

export function AboutAdminSkeleton() {
  return <Dashboard><AboutAdminContent /></Dashboard>;
}

export function TickerSkeleton() {
  return <Dashboard>
    <div className="max-w-3xl space-y-5 bg-paper p-6 sm:p-8">
      <div className="space-y-2"><Block className="h-3 w-24" /><Block className="h-7 w-48" /><Block className="h-4 w-4/5" /></div>
      <Block className="h-40 w-full" />
      <div className="flex items-center gap-4"><Block className="h-10 w-24" /><Block className="h-3 w-40" /></div>
    </div>
  </Dashboard>;
}

export function PopupAdminContent() {
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
    <div className="border border-rule bg-paper">
      <div className="flex justify-between gap-3 border-b border-rule p-5"><Block className="h-6 w-24" /><Block className="h-4 w-28" /></div>
      <div className="p-5"><Fields heights={["h-10", "h-24", "h-11"]} /></div>
      <div className="border-y border-rule p-5">
        <Block className="mb-4 h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Fields heights={["h-10", "h-10", "h-11"]} /><Fields heights={["h-10", "h-10", "h-11"]} />
        </div>
      </div>
      <div className="p-5"><Block className="h-9 w-20" /></div>
    </div>
    <div className="border border-rule bg-paper">
      <div className="border-b border-rule p-5"><Block className="h-6 w-32" /></div>
      <div className="bg-gray-100 p-4">
        <div className="space-y-4 rounded-xl bg-paper p-5">
          <Block className="h-6 w-3/5" /><Block className="h-4 w-4/5" /><Block className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  </div>;
}

export function PopupAdminSkeleton() {
  return <Dashboard><PopupAdminContent /></Dashboard>;
}
