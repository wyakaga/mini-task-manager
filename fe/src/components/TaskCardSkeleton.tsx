import { Skeleton } from "@heroui/react";

export function TaskCardSkeleton() {
  return (
    <div className="bg-paper-white rounded-cards p-space-md shadow-[0px_12px_28px_0px_rgba(27,37,54,0.08),0px_4px_16px_0px_rgba(0,0,0,0.06)] flex flex-col gap-space-sm border-none select-none">
      {/* Header: ID chip + delete placeholder */}
      <div className="flex items-center justify-between gap-space-xs">
        <Skeleton className="h-5 w-16 rounded-[4px]" />
        <Skeleton className="h-5 w-5 rounded-[4px]" />
      </div>

      {/* Title */}
      <Skeleton className="h-5 w-4/5 rounded-[4px] mt-1" />

      {/* Description lines */}
      <div className="space-y-1.5 mt-1">
        <Skeleton className="h-3.5 w-full rounded-[4px]" />
        <Skeleton className="h-3.5 w-3/5 rounded-[4px]" />
      </div>

      {/* Activity log collapsed placeholder */}
      <div className="mt-1">
        <Skeleton className="h-7 w-full rounded-[6px]" />
      </div>

      {/* Footer: Actor */}
      <div className="pt-2 flex items-center justify-between">
        <Skeleton className="h-3.5 w-24 rounded-[4px]" />
      </div>
    </div>
  );
}
