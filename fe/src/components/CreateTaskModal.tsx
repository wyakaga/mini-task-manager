import { useState, type FormEvent } from "react";
import { MdClose } from "react-icons/md";
import { Modal, Input, TextArea, Button, Spinner } from "@heroui/react";

interface ICreateTaskModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; description: string; actor: string }) => void;
}

export function CreateTaskModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ICreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actor, setActor] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      actor: actor.trim(),
    });

    setTitle("");
    setDescription("");
    setActor("");
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    setTitle("");
    setDescription("");
    setActor("");
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
          <Modal.Dialog className="w-full max-w-lg bg-paper-white rounded-cards shadow-[0px_16px_56px_4px_rgba(0,0,0,0.22),0px_12px_28px_0px_rgba(27,37,54,0.12)] p-space-lg flex flex-col border-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-space-sm mb-space-md shadow-[0px_1px_0px_rgba(117,119,125,0.15)]">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-charcoal-ink">
                  Create New Task
                </h2>
                <p className="font-utility-sm text-utility-sm text-body-slate mt-0.5">
                  Entry point into sequential progression lifecycle
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
              {/* Title Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-label-sm text-label-sm text-charcoal-ink font-semibold"
                  htmlFor="newTaskTitle"
                >
                  Task Title <span className="text-studio-orange">*</span>
                </label>
                <Input
                  id="newTaskTitle"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Refactor Auth Token Validator"
                  className="w-full px-space-sm py-2 bg-paper-white rounded-[4px] font-label-sm text-label-sm text-charcoal-ink placeholder-mist-gray shadow-subtle focus:shadow-[inset_0px_0px_0px_1.5px_#f4511c] focus:outline-none transition-all"
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-label-sm text-label-sm text-charcoal-ink font-semibold"
                  htmlFor="newTaskDesc"
                >
                  Description{" "}
                  <span className="text-steel-gray font-normal">(Optional)</span>
                </label>
                <TextArea
                  id="newTaskDesc"
                  rows={3}
                  disabled={isSubmitting}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context, acceptance requirements, or dependencies..."
                  className="w-full px-space-sm py-2 bg-paper-white rounded-[4px] font-label-sm text-label-sm text-charcoal-ink placeholder-mist-gray shadow-subtle focus:shadow-[inset_0px_0px_0px_1.5px_#f4511c] focus:outline-none resize-none transition-all"
                />
              </div>

              {/* Actor Input */}
              <div className="flex flex-col gap-1">
                <label
                  className="font-label-sm text-label-sm text-charcoal-ink font-semibold"
                  htmlFor="newTaskActor"
                >
                  Actor ID <span className="text-steel-gray font-normal">(Optional)</span>
                </label>
                <Input
                  id="newTaskActor"
                  type="text"
                  disabled={isSubmitting}
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="Your username or ID (e.g., john.doe)"
                  className="w-full px-space-sm py-2 bg-paper-white rounded-[4px] font-label-sm text-label-sm text-charcoal-ink placeholder-mist-gray shadow-subtle focus:shadow-[inset_0px_0px_0px_1.5px_#f4511c] focus:outline-none transition-all"
                />
              </div>

              {/* Modal Actions */}
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
                  className="px-space-md py-2 bg-studio-orange hover:bg-secondary text-paper-white font-label-sm text-label-sm font-bold rounded-[6px] shadow-[0px_4px_12px_rgba(244,81,28,0.2)] transition-all cursor-pointer border-none h-auto flex items-center gap-1.5"
                >
                  {isSubmitting && <Spinner size="sm" />}
                  <span>{isSubmitting ? "Creating..." : "Create Task"}</span>
                </Button>
              </div>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
