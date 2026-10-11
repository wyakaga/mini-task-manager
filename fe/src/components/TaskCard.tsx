import { useState } from "react";
import { MdDeleteOutline, MdCheckCircle } from "react-icons/md";
import { Card, Button, Chip, cn } from "@heroui/react";
import type { ITaskCard } from "@/types/kanban";
import { AuditTimeline } from "@/components/AuditTimeline";

interface ITaskCardProps {
	task: ITaskCard;
	onDelete?: (task: ITaskCard) => void;
	onDragStart?: (task: ITaskCard) => void;
	onDragEnd?: () => void;
	isFirstInColumn?: boolean;
}

export function TaskCard({
	task,
	onDelete,
	onDragStart,
	onDragEnd,
	isFirstInColumn = false,
}: ITaskCardProps) {
	const [isDragging, setIsDragging] = useState(false);
	const isDone = task.stage === "Done";

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		e.dataTransfer.setData("application/json", JSON.stringify(task));
		e.dataTransfer.setData("text/plain", task.id);
		e.dataTransfer.effectAllowed = "move";
		setIsDragging(true);
		onDragStart?.(task);
	};

	const handleDragEnd = () => {
		setIsDragging(false);
		onDragEnd?.();
	};

	return (
		<Card
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			className={cn(
				"bg-paper-white rounded-cards p-space-md shadow-[0px_12px_28px_0px_rgba(27,37,54,0.08),0px_4px_16px_0px_rgba(0,0,0,0.06)] flex flex-col gap-space-sm transition-all border-none cursor-grab active:cursor-grabbing select-none hover:shadow-md",
				isDone && "opacity-95",
				isDragging && "opacity-40 scale-[0.98] ring-2 ring-primary/40 shadow-2xl",
			)}
			data-task-id={task.id}
			data-task-stage={task.stage}
			data-next-stage={task.nextStage}
			data-prev-stage={task.prevStage}
		>
			{/* Card Header: Task ID & Delete Action */}
			<div className="flex items-start justify-between gap-space-xs">
				<Chip
					size="sm"
					className="h-auto px-1.5 py-0.5 bg-gallery-gray font-utility-sm rounded font-medium tracking-wide border-none text-charcoal-ink"
				>
					{task.id.slice(0, 8)}
				</Chip>
				<div onMouseDown={(e) => e.stopPropagation()}>
					<Button
						isIconOnly
						variant="ghost"
						size="sm"
						onPress={() => onDelete?.(task)}
						className="text-ash-gray hover:text-error transition-colors p-1 min-w-auto h-auto cursor-pointer"
						aria-label="Delete Task"
					>
						<MdDeleteOutline className="text-[18px]" />
					</Button>
				</div>
			</div>

			{/* Task Title */}
			<h3
				className={cn(
					"font-label-md text-label-md text-charcoal-ink tracking-tight",
					isDone && "line-through decoration-steel-gray/60",
				)}
			>
				{task.title}
			</h3>

			{/* Task Description */}
			<p className="font-body-sm text-body-sm text-body-slate leading-relaxed">
				{task.description}
			</p>

			{/* Inline Collapsible Audit Log */}
			<div onMouseDown={(e) => e.stopPropagation()}>
				<AuditTimeline
					taskId={task.id}
					logs={task.auditLogs && task.auditLogs.length > 0 ? task.auditLogs : undefined}
					defaultOpen={isFirstInColumn}
				/>
			</div>

			{/* Card Footer: Status Indicator */}
			<div className="pt-2 flex items-center justify-between gap-1 flex-wrap">
				{isDone && (
					<Chip
						size="sm"
						className="inline-flex items-center gap-1 px-space-sm py-1 bg-gallery-gray text-body-slate font-label-sm text-label-sm rounded-[6px] border-none h-auto ml-auto"
					>
						<MdCheckCircle className="text-[16px] text-charcoal-ink" />
						<span>Completed ✓</span>
					</Chip>
				)}
			</div>
		</Card>
	);
}
