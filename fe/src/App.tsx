import { useState, useEffect } from "react";
import { ToastProvider, toast } from "@heroui/react";
import type { ITaskCard, TTaskStage } from "@/types/kanban";
import { STAGE_TO_STATUS, ALLOWED_TARGET_STAGES } from "@/types/kanban";
import { WorkspaceOverview } from "@/components/WorkspaceOverview";
import { KanbanColumn } from "@/components/KanbanColumn";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { AdvanceTaskModal } from "@/components/AdvanceTaskModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
} from "@/services/tasks";

const STAGES: TTaskStage[] = ["To Do", "Pending", "In Progress", "Done"];

export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<ITaskCard | null>(null);
  const [moveTaskModal, setMoveTaskModal] = useState<{
    task: ITaskCard;
    initialTargetStage?: TTaskStage;
  } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ITaskCard | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mutations
  const { mutate: createMutate, isPending: isCreating } = useCreateTaskMutation();
  const { mutate: updateStatusMutate, isPending: isUpdating } = useUpdateTaskStatusMutation();
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteTaskMutation();

  const handleCreateTask = ({
    title,
    description,
  }: {
    title: string;
    description: string;
    actor: string;
  }) => {
    createMutate(
      {
        title,
        description: description || null,
      },
      {
        onSuccess: () => {
          toast.success("Task created successfully");
          setIsCreateOpen(false);
        },
      }
    );
  };

  const handleDragStart = (task: ITaskCard) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDropTask = (task: ITaskCard, targetStage: TTaskStage) => {
    setDraggedTask(null);
    if (task.stage === targetStage) return;

    if (ALLOWED_TARGET_STAGES[task.stage]?.includes(targetStage)) {
      setMoveTaskModal({
        task,
        initialTargetStage: targetStage,
      });
    } else {
      toast.danger(
        `Cannot move directly from "${task.stage}" to "${targetStage}". Only adjacent stages are allowed.`
      );
    }
  };

  const handleConfirmMove = ({
    taskId,
    targetStage,
    actor,
  }: {
    taskId: string;
    targetStage: TTaskStage;
    actor: string;
    note?: string;
  }) => {
    const nextStatus = STAGE_TO_STATUS[targetStage];
    updateStatusMutate(
      {
        id: taskId,
        body: {
          status: nextStatus,
          actor,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Task moved to ${targetStage}`);
          setMoveTaskModal(null);
        },
      }
    );
  };

  const handleRequestDelete = (task: ITaskCard) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = (taskId: string) => {
    deleteMutate(taskId, {
      onSuccess: () => {
        toast.success("Task removed from board");
        setTaskToDelete(null);
      },
    });
  };

  return (
    <div className="bg-gallery-gray text-on-surface font-body-md min-h-screen">
      {/* Toast Notification Provider */}
      <ToastProvider placement="top end" />

      {/* Main Kanban Workspace */}
      <main className="w-full bg-gallery-gray min-h-screen">
        <div className="flex flex-col w-full">
          {/* Sub-Header & Controls Panel */}
          <WorkspaceOverview
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreate={() => setIsCreateOpen(true)}
          />

          {/* Sequential 4-Column Board with Horizontal Scroll */}
          <section className="w-full px-margin-lg pb-space-xl overflow-x-auto subtle-scrollbar">
            <div className="max-w-[1720px] mx-auto min-w-fit">
              <div className="flex gap-gutter-lg items-start pb-2">
                {STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    searchQuery={debouncedQuery}
                    draggedTask={draggedTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDropTask={handleDropTask}
                    onDelete={handleRequestDelete}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Interactive Modals */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        isSubmitting={isCreating}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
      />

      <AdvanceTaskModal
        task={moveTaskModal?.task ?? null}
        initialTargetStage={moveTaskModal?.initialTargetStage}
        isOpen={Boolean(moveTaskModal)}
        isSubmitting={isUpdating}
        onClose={() => setMoveTaskModal(null)}
        onConfirm={handleConfirmMove}
      />

      <DeleteConfirmModal
        task={taskToDelete}
        isOpen={Boolean(taskToDelete)}
        isSubmitting={isDeleting}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default App;
