import { Block, Skeleton } from "@/app/components/loading/PageSkeleton";

export default function Loading() {
  return (
    <Skeleton className="wrap py-10 sm:py-14">
      <div className="mx-auto max-w-2xl border border-rule bg-paper p-6 sm:p-9">
        <Block className="h-9 w-56 max-w-full" />
        <Block className="mt-3 h-4 w-4/5" />
        <Block className="mt-2 h-4 w-1/2" />
        <div className="mt-6 grid justify-items-center gap-3 border border-rule px-4 py-5">
          <Block className="h-4 w-44 max-w-full" />
          <Block className="aspect-square w-full max-w-64" />
        </div>
        <Block className="mt-6 h-11 w-48 max-w-full" />
      </div>
      <div className="mx-auto mt-5 max-w-2xl space-y-3 border border-rule bg-paper p-6 sm:p-9">
        <Block className="h-7 w-44 max-w-full" />
        <Block className="h-4 w-3/4" />
      </div>
    </Skeleton>
  );
}
