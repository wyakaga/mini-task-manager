import { useState, type FormEvent } from "react";
import { MdClose, MdEast, MdWest, MdInfo } from "react-icons/md";
import { Modal, Input, Button, Chip, Spinner, cn } from "@heroui/react";
import type { ITaskCard, TTaskStage } from "@/types/kanban";

interface IAdvanceTaskModalProps {
  task: ITaskCard | null;
  targetStage?: TTaskStage;
  initialTargetStage?: TTaskStage;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    taskId: string;
    targetStage: TTaskStage;
    actor: string;
    note?: string;
  }) => void;
}

export function AdvanceTaskModal({
  task,
  targetStage: propTargetStage,
  initialTargetStage,
  isOpen,
  isSubmitting = false,
  onClose,
  onConfirm,
}: IAdvanceTaskModalProps) {
  const [actor, setActor] = useState("");
  const [note, setNote] = useState("");

  if (!task) return null;

  const targetStage =
    propTargetStage ??
    initialTargetStage ??
    task.nextStage ??
    task.prevStage ??
    task.stage;

  const isBackward = targetStage === task.prevStage;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!actor.trim() || !targetStage || isSubmitting) return;

    onConfirm({
      taskId: task.id,
      targetStage,
      actor: actor.trim(),
      note: note.trim() || undefined,
    });

    setActor("");
    setNote("");
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    setActor("");
    setNote("");
    onClose();
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && handleCancel()}
        className="fixed inset-0 z-50 flex items-center justify-center p-margin-sm bg-primary/60 backdrop-blur-[2px]"
      >
        <Modal.Container>
          <Modal.Dialog className="w-full max-w-md bg-paper-white rounded-cards shadow-[0px_16px_56px_4px_rgba(0,0,0,0.22),0px_12px_28px_0px_rgba(27,37,54,0.12)] p-space-lg flex flex-col border-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-sm mb-space-md shadow-[0px_1px_0px_rgba(117,119,125,0.15)]">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-slate-canvas tracking-tight">
                  Update Task Status
                </h2>
                <p className="font-utility-sm text-utility-sm text-body-slate mt-0.5">
                  {task.id.slice(0, 8)} • {isBackward ? "Revert Stage" : "Advance Stage"}
                </p>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={handleCancel}
                isDisabled={isSubmitting}
                className="text-ash-gray hover:text-charcoal-ink p-1 min-w-auto h-auto cursor-pointer"
                aria-label="Close"
              >
                <MdClose className="text-[20px]" />
              </Button>
            </div>

            {/* State Transition Indicator Badges */}
            <div className="bg-gallery-gray rounded-[6px] p-space-sm flex items-center justify-center gap-space-sm mb-3">
              <Chip
                size="sm"
                className="px-2.5 py-1 bg-surface-container-high text-primary font-label-sm text-label-sm rounded font-medium border-none h-auto"
              >
                {task.stage}
              </Chip>
              {isBackward ? (
                <MdWest className="text-steel-gray text-[20px]" />
              ) : (
                <MdEast className="text-studio-orange text-[20px]" />
              )}
              <Chip
                size="sm"
                className={cn(
                  "px-2.5 py-1 font-label-sm text-label-sm rounded font-medium border-none h-auto text-paper-white",
                  isBackward ? "bg-steel-gray" : "bg-studio-orange"
                )}
              >
                {targetStage}
              </Chip>
            </div>

            {/* Task summary context */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
              {/* Actor Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-label-sm text-label-sm text-charcoal-ink font-semibold"
                  htmlFor="advanceActorInput"
                >
                  Actor ID <span className="text-studio-orange">*</span>
                </label>
                <Input
                  id="advanceActorInput"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="Enter your username / ID (e.g., alex.dev)"
                  className="w-full px-space-sm py-2 bg-paper-white rounded-[4px] font-label-sm text-label-sm text-charcoal-ink placeholder-mist-gray shadow-subtle focus:shadow-[inset_0px_0px_0px_1.5px_#f4511c] focus:outline-none transition-all"
                />
                <span className="text-[11px] text-body-slate">
                  Required for audit log compliance
                </span>
              </div>

              {/* Informational compliance note */}
              <div className="p-2 bg-gallery-gray/60 rounded-[4px] flex items-start gap-1.5 text-steel-gray text-[11px]">
                <MdInfo className="text-[15px] mt-0.5 text-slate-canvas shrink-0" />
                <span>
                  {isBackward
                    ? `Task will be reverted to ${targetStage} and immutably recorded in the audit trail.`
                    : `Task will be advanced to ${targetStage} and immutably recorded in the audit trail.`}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-space-sm flex items-center justify-end gap-space-sm">
                <Button
                  variant="secondary"
                  onPress={handleCancel}
                  isDisabled={isSubmitting}
                  className="px-space-md py-2 bg-paper-white hover:bg-gallery-gray text-charcoal-ink font-label-sm text-label-sm rounded-[6px] shadow-subtle transition-all cursor-pointer border-none h-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isDisabled={isSubmitting}
                  className={cn(
                    "px-space-md py-2 text-paper-white font-label-sm text-label-sm font-bold rounded-[6px] shadow-[0px_4px_12px_rgba(244,81,28,0.2)] transition-all cursor-pointer border-none h-auto flex items-center gap-1.5",
                    isBackward
                      ? "bg-steel-gray hover:bg-charcoal-ink shadow-subtle"
                      : "bg-studio-orange hover:bg-secondary"
                  )}
                >
                  {isSubmitting && <Spinner size="sm" />}
                  <span>
                    {isSubmitting
                      ? "Updating..."
                      : isBackward
                        ? `Revert to ${targetStage}`
                        : `Advance to ${targetStage}`}
                  </span>
                </Button>
              </div>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
