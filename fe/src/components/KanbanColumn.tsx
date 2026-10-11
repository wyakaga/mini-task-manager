import { useState, useEffect, useMemo, useRef } from "react";
import { Chip, Skeleton, cn } from "@heroui/react";
import type { ITaskCard, TTaskStage } from "@/types/kanban";
import { STAGE_TO_STATUS, ALLOWED_TARGET_STAGES, toTaskCard } from "@/types/kanban";
import { TaskCard } from "@/components/TaskCard";
import { TaskCardSkeleton } from "@/components/TaskCardSkeleton";
import { useInfiniteTasksQuery } from "@/services/tasks";

interface IKanbanColumnProps {
  stage: TTaskStage;
  searchQuery?: string;
  draggedTask?: ITaskCard | null;
  onDragStart?: (task: ITaskCard) => void;
  onDragEnd?: () => void;
  onDropTask?: (task: ITaskCard, targetStage: TTaskStage) => void;
  onDelete?: (task: ITaskCard) => void;
}

const getStageDotColorClass = (stage: TTaskStage): string => {
  switch (stage) {
    case "To Do":
      return "bg-slate-canvas";
    case "Pending":
      return "bg-mid-slate";
    case "In Progress":
      return "bg-studio-orange";
    case "Done":
      return "bg-steel-gray";
    default:
      return "bg-slate-canvas";
  }
};

export function KanbanColumn({
  stage,
  searchQuery,
  draggedTask,
  onDragStart,
  onDragEnd,
  onDropTask,
  onDelete,
}: IKanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const status = STAGE_TO_STATUS[stage];

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTasksQuery({ status, q: searchQuery || undefined }, 10);

  const tasks: ITaskCard[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data.map((t) => toTaskCard(t))) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.pagination?.total ?? tasks.length;

  // Check if dragged task is adjacent to this column
  const isValidDrop = Boolean(
    draggedTask &&
      draggedTask.stage !== stage &&
      ALLOWED_TARGET_STAGES[draggedTask.stage]?.includes(stage)
  );

  // IntersectionObserver for scroll-based infinite loading
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedTask) {
      if (isValidDrop) {
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) setIsDragOver(true);
      } else {
        e.dataTransfer.dropEffect = "none";
      }
    } else {
      e.dataTransfer.dropEffect = "move";
      if (!isDragOver) setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    let taskToDrop = draggedTask;
    if (!taskToDrop) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) taskToDrop = JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    if (taskToDrop) {
      onDropTask?.(taskToDrop, stage);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col bg-gallery-gray rounded-cards p-space-md h-[calc(100vh-210px)] min-h-130 w-92.5 shrink-0 transition-all duration-150 relative",
        isDragOver && isValidDrop && "ring-2 ring-studio-orange/80 bg-studio-orange/5 shadow-md"
      )}
      data-column={stage.toLowerCase().replace(" ", "_")}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-space-sm mb-space-md shadow-[0px_1px_0px_rgba(117,119,125,0.18)]">
        <div className="flex items-center gap-space-xs">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              getStageDotColorClass(stage)
            )}
          />
          <h2 className="font-headline-sm text-headline-sm text-slate-canvas">
            {stage}
          </h2>
        </div>
        <Chip
          size="sm"
          className="px-1.5 py-0.5 bg-slate-canvas font-utility-sm font-semibold rounded-full min-w-5.5 inline-flex items-center justify-center border-none h-auto text-paper-white"
        >
          {isLoading ? (
            <Skeleton className="h-2.5 w-3.5 rounded-full bg-paper-white/40" />
          ) : (
            totalCount
          )}
        </Chip>
      </div>

      {/* Cards Stack */}
      <div className="flex flex-col gap-space-md flex-1 overflow-y-auto no-scrollbar">
        {/* Visual drop indicator when card is dragged over */}
        {isDragOver && isValidDrop && (
          <div className="p-3 border-2 border-dashed border-studio-orange/60 bg-studio-orange/10 rounded-cards text-center text-xs font-semibold text-studio-orange transition-all">
            Drop here to move to {stage}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-space-md">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-error font-utility-sm border border-dashed border-error/40 rounded-cards my-auto">
            <p>Failed to load tasks</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-ash-gray font-utility-sm border border-dashed border-silver-gray/50 rounded-cards my-auto">
            <p>No tasks in this column</p>
          </div>
        ) : (
          <>
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                isFirstInColumn={index === 0}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDelete={onDelete}
              />
            ))}

            {/* Skeleton placeholder when fetching next page via infinite scroll */}
            {isFetchingNextPage && <TaskCardSkeleton />}

            {/* Bottom Sentinel for Infinite Scroll */}
            <div ref={sentinelRef} className="py-1 h-2" />
          </>
        )}
      </div>
    </div>
  );
}
