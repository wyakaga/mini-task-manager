import { AuditLog as PrismaAuditLog, Task as PrismaTask, TaskStatus as DbTaskStatus } from "@prisma/client";

export const ApiTaskStatus = {
	TODO: "todo",
	PENDING: "pending",
	IN_PROGRESS: "in_progress",
	DONE: "done",
} as const;

export type ApiTaskStatus = (typeof ApiTaskStatus)[keyof typeof ApiTaskStatus];

export interface TaskDto {
	id: string;
	title: string;
	description: string | null;
	status: ApiTaskStatus;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTaskDto {
	title: string;
	description?: string | null;
}

export interface UpdateTaskStatusDto {
	id: string;
	status: ApiTaskStatus;
	actor: string;
}

export const NEXT_ALLOWED_STATUS: Record<ApiTaskStatus, ApiTaskStatus | null> = {
	[ApiTaskStatus.TODO]: ApiTaskStatus.PENDING,
	[ApiTaskStatus.PENDING]: ApiTaskStatus.IN_PROGRESS,
	[ApiTaskStatus.IN_PROGRESS]: ApiTaskStatus.DONE,
	[ApiTaskStatus.DONE]: null,
};

export const PREV_ALLOWED_STATUS: Record<ApiTaskStatus, ApiTaskStatus | null> = {
	[ApiTaskStatus.TODO]: null,
	[ApiTaskStatus.PENDING]: ApiTaskStatus.TODO,
	[ApiTaskStatus.IN_PROGRESS]: ApiTaskStatus.PENDING,
	[ApiTaskStatus.DONE]: ApiTaskStatus.IN_PROGRESS,
};

export const ALLOWED_TRANSITIONS: Record<ApiTaskStatus, ApiTaskStatus[]> = {
	[ApiTaskStatus.TODO]: [ApiTaskStatus.PENDING],
	[ApiTaskStatus.PENDING]: [ApiTaskStatus.TODO, ApiTaskStatus.IN_PROGRESS],
	[ApiTaskStatus.IN_PROGRESS]: [ApiTaskStatus.PENDING, ApiTaskStatus.DONE],
	[ApiTaskStatus.DONE]: [ApiTaskStatus.IN_PROGRESS],
};

export interface GetTasksQuery {
	status?: ApiTaskStatus;
	q?: string;
	page: number;
	limit: number;
}

export function toApiStatus(dbStatus: DbTaskStatus): ApiTaskStatus {
	switch (dbStatus) {
		case "TODO":
			return "todo";
		case "PENDING":
			return "pending";
		case "IN_PROGRESS":
			return "in_progress";
		case "DONE":
			return "done";
	}
}

export function toDbStatus(apiStatus: ApiTaskStatus): DbTaskStatus {
	switch (apiStatus) {
		case "todo":
			return "TODO";
		case "pending":
			return "PENDING";
		case "in_progress":
			return "IN_PROGRESS";
		case "done":
			return "DONE";
	}
}

export function toTaskDto(task: PrismaTask): TaskDto {
	return {
		id: task.id,
		title: task.title,
		description: task.description,
		status: toApiStatus(task.status),
		deletedAt: task.deletedAt ? task.deletedAt.toISOString() : null,
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt.toISOString(),
	};
}

export interface AuditLogDto {
	id: string;
	taskId: string;
	actor: string;
	fromStatus: ApiTaskStatus;
	toStatus: ApiTaskStatus;
	timestamp: string;
}

export function toAuditLogDto(log: PrismaAuditLog): AuditLogDto {
	return {
		id: log.id,
		taskId: log.taskId,
		actor: log.actor,
		fromStatus: log.fromStatus as ApiTaskStatus,
		toStatus: log.toStatus as ApiTaskStatus,
		timestamp: log.timestamp.toISOString(),
	};
}

