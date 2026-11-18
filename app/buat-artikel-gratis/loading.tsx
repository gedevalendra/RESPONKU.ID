import { Block, Rows, Skeleton } from "@/app/components/loading/PageSkeleton";

export default function Loading() {
  return (
    <Skeleton className="wrap py-10 sm:py-14">
      <div className="max-w-3xl">
        <Block className="h-10 w-4/5" />
        <Block className="mt-4 h-4 w-full" />
        <Block className="mt-2 h-4 w-3/4" />
        <Block className="mt-6 h-11 w-36" />
        <div className="mt-10 border-t border-rule pt-6">
          <Block className="h-7 w-48" />
          <Rows />
        </div>
      </div>
    </Skeleton>
  );
}
