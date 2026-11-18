import { Block, Fields, Rows, Skeleton } from "./PageSkeleton";

export function HomeSkeleton() {
  return (
    <Skeleton className="min-h-[55dvh]">
      <div className="relative aspect-video bg-gray-200 lg:aspect-auto lg:min-h-[34rem]">
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 sm:p-8">
          <div className="h-6 w-4/5 max-w-2xl bg-gray-300 sm:h-10" />
          <div className="h-4 w-3/5 max-w-xl bg-gray-300" />
          <div className="h-3 w-32 bg-gray-300" />
        </div>
      </div>
      <div className="wrap grid gap-12 py-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          <Block className="h-7 w-32" />
          <Rows count={1} image />
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-rule pt-6 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <Block key={item} className="aspect-[4/3]" />)}
          </div>
        </div>
        <div className="hidden lg:col-span-4 lg:block">
          <Block className="h-11 w-full" />
          <Rows count={3} />
        </div>
      </div>
    </Skeleton>
  );
}

export function ArchiveSkeleton() {
  return (
    <Skeleton className="wrap py-10 sm:py-14">
      <Block className="h-3 w-28" />
      <Block className="mt-2 h-10 w-64 max-w-full" />
      <div className="mt-8 max-w-4xl"><Rows count={5} image /></div>
    </Skeleton>
  );
}

export function CategorySkeleton() {
  return (
    <Skeleton className="wrap py-10 sm:py-14">
      <Block className="h-3 w-20" />
      <Block className="mt-2 h-10 w-40" />
      <div className="mt-8 max-w-4xl"><Rows count={4} image /></div>
    </Skeleton>
  );
}

export function SearchSkeleton() {
  return (
    <Skeleton className="wrap py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex gap-2"><Block className="h-12 flex-1" /><Block className="h-12 w-20" /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((item) => <Block key={item} className="h-8 w-16" />)}
        </div>
        <Block className="mt-8 h-6 w-40" />
        <div className="mt-4 border-t border-rule"><Rows image /></div>
      </div>
    </Skeleton>
  );
}

export function FaqSkeleton() {
  return (
    <Skeleton className="wrap py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2"><Block className="h-8 w-44" /><Block className="h-4 w-4/5" /></div>
        <div className="divide-y divide-rule">
          {[0, 1, 2, 3, 4].map((item) => <div key={item} className="py-4"><Block className="h-4 w-3/5" /></div>)}
        </div>
        <Block className="h-16 w-full" />
      </div>
    </Skeleton>
  );
}

export function LoginSkeleton() {
  return (
    <Skeleton className="wrap py-8 sm:py-14">
      <div className="mx-auto max-w-2xl border-t-4 border-gray-200 px-5 py-7 sm:px-9 sm:py-9">
        <Block className="h-10 w-40" />
        <Block className="mt-3 h-4 w-4/5" />
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-rule pt-6">
          <Block className="h-12" /><Block className="h-12" />
        </div>
        <div className="mt-5"><Fields heights={["h-11", "h-11"]} /></div>
        <Block className="mt-5 h-11 w-full" />
      </div>
    </Skeleton>
  );
}

export function NotificationsSkeleton() {
  return (
    <Skeleton className="wrap py-8 sm:py-12">
      <div className="max-w-3xl">
        <Block className="mb-4 h-9 w-40" />
        <div className="divide-y divide-rule border-y border-rule">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex gap-4 py-5">
              <Block className="size-9 shrink-0" />
              <div className="flex-1 space-y-2">
                <Block className="h-5 w-40" /><Block className="h-4 w-4/5" /><Block className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Skeleton>
  );
}

export function AboutSkeleton() {
  return (
    <Skeleton className="wrap py-12 sm:py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)] lg:gap-20">
        <div className="space-y-5">
          <Block className="h-3 w-24" /><Block className="h-9 w-3/4" />
          <Block className="h-4 w-full" /><Block className="h-4 w-5/6" /><Block className="h-4 w-3/4" />
          <div className="grid gap-8 pt-8 sm:grid-cols-2"><Block className="h-36" /><Block className="h-36" /></div>
        </div>
        <div className="space-y-4"><Block className="h-6 w-28" /><Block className="h-4 w-40" /><Block className="h-4 w-32" /></div>
      </div>
    </Skeleton>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-b-xl bg-paper shadow-sm">
      <Block className="h-28 w-full sm:h-36" />
      <div className="flex items-end gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="relative -mt-8 size-20 shrink-0 rounded-full bg-gray-200 ring-2 ring-white" />
        <div className="min-w-0 space-y-2 pt-3"><Block className="h-6 w-36 max-w-full" /><Block className="h-4 w-24" /></div>
      </div>
      <div className="grid grid-cols-2 border-t border-rule px-6 py-4"><Block className="h-4 w-24" /><Block className="h-4 w-24" /></div>
    </div>
  );
}

export function PublicProfileSkeleton() {
  return (
    <Skeleton className="wrap space-y-10 py-8 sm:py-12">
      <ProfileHeaderSkeleton />
      <div className="mt-10">
        <Block className="h-7 w-40" />
        <div className="mt-3 border-t border-rule"><Rows actions /></div>
      </div>
    </Skeleton>
  );
}

export function AccountSkeleton() {
  return (
    <Skeleton className="wrap py-8 sm:py-12">
      <ProfileHeaderSkeleton />
      <div className="mt-10 grid place-items-center divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3].map((item) => <div key={item} className="grid w-full place-items-center py-4"><Block className="h-4 w-36" /></div>)}
      </div>
      <div className="mt-10"><Rows actions /></div>
    </Skeleton>
  );
}

export function MyArticlesSkeleton() {
  return (
    <Skeleton className="wrap py-10 sm:py-14">
      <Block className="h-3 w-24" />
      <Block className="mt-2 h-10 w-48" />
      <Block className="mt-3 h-4 w-4/5 max-w-2xl" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Fields heights={["h-11", "h-24", "h-32"]} />
        <Block className="hidden h-64 lg:block" />
      </div>
      <div className="mt-12"><Rows actions /></div>
    </Skeleton>
  );
}

export function SettingsSkeleton() {
  return (
    <Skeleton className="wrap py-8">
      <div className="space-y-5 bg-paper p-6">
        <Block className="h-8 w-44" />
        <Fields heights={["h-4", "h-4", "h-4", "h-4", "h-4", "h-4"]} />
        <Block className="h-4 w-24" />
      </div>
      <div className="mt-8 bg-paper p-6"><Block className="h-6 w-28" /><Rows count={2} /></div>
    </Skeleton>
  );
}
