import { MdClose, MdWarningAmber } from "react-icons/md";
import { Modal, Button, Chip, Spinner } from "@heroui/react";
import type { ITaskCard } from "@/types/kanban";

interface IDeleteConfirmModalProps {
  task: ITaskCard | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (taskId: string) => void;
}

export function DeleteConfirmModal({
  task,
  isOpen,
  isSubmitting = false,
  onClose,
  onConfirm,
}: IDeleteConfirmModalProps) {
  if (!task) return null;

  const handleConfirm = () => {
    if (isSubmitting) return;
    onConfirm(task.id);
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && !isSubmitting && onClose()}
        className="fixed inset-0 z-50 flex items-center justify-center p-margin-sm bg-primary/60 backdrop-blur-[2px]"
      >
        <Modal.Container>
          <Modal.Dialog className="w-full max-w-md bg-paper-white rounded-cards shadow-[0px_16px_56px_4px_rgba(0,0,0,0.22),0px_12px_28px_0px_rgba(27,37,54,0.12)] p-space-lg flex flex-col border-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-sm mb-space-md shadow-[0px_1px_0px_rgba(117,119,125,0.15)]">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-charcoal-ink tracking-tight">
                  Delete Task
                </h2>
                <p className="font-utility-sm text-utility-sm text-body-slate mt-0.5">
                  {task.id.slice(0, 8)} Soft Removal
                </p>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={onClose}
                isDisabled={isSubmitting}
                className="text-ash-gray hover:text-charcoal-ink p-1 min-w-auto h-auto cursor-pointer"
                aria-label="Close"
              >
                <MdClose className="text-[20px]" />
              </Button>
            </div>

            {/* Task context preview snippet */}
            <div className="bg-[#f8f9fa] rounded-[6px] p-space-sm mb-space-md shadow-subtle">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-charcoal-ink">
                <Chip
                  size="sm"
                  className="px-1.5 py-0.5 bg-gallery-gray rounded text-body-slate border-none h-auto"
                >
                  {task.id.slice(0, 8)}
                </Chip>
                <span className="line-clamp-1">{task.title}</span>
              </div>
              <p className="font-body-sm text-body-sm text-body-slate mt-1 text-[12px] leading-relaxed line-clamp-2">
                {task.description}
              </p>
            </div>

            {/* Warning Message Box */}
            <div className="p-3 bg-error-container/40 rounded-[6px] flex items-start gap-2 text-error text-[12px] mb-space-md">
              <MdWarningAmber className="text-[18px] text-error shrink-0 mt-0.5" />
              <span>
                Are you sure you want to delete this task? This action will soft-delete
                the task from the active Kanban workspace while retaining audit history.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-space-sm">
              <Button
                variant="secondary"
                onPress={onClose}
                isDisabled={isSubmitting}
                className="px-space-md py-2 bg-paper-white hover:bg-gallery-gray text-charcoal-ink font-label-sm text-label-sm rounded-[6px] shadow-subtle transition-all cursor-pointer border-none h-auto"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={handleConfirm}
                isDisabled={isSubmitting}
                className="px-space-md py-2 bg-error hover:bg-error/90 text-white font-label-sm text-label-sm font-bold rounded-[6px] shadow-[0px_4px_12px_rgba(186,26,26,0.25)] transition-all cursor-pointer border-none h-auto flex items-center gap-1.5"
              >
                {isSubmitting && <Spinner size="sm" />}
                <span>{isSubmitting ? "Deleting..." : "Delete Task"}</span>
              </Button>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
