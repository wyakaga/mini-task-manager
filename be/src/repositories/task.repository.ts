import { prisma } from "@/lib/prisma";
import { AuditLog, Prisma, Task, TaskStatus } from "@prisma/client";

export interface FindTasksParams {
	status?: TaskStatus;
	q?: string;
	page: number;
	limit: number;
}

export interface FindTasksResult {
	tasks: Task[];
	total: number;
}

export interface CreateTaskData {
	title: string;
	description?: string | null;
	status?: TaskStatus;
}

export interface UpdateStatusWithAuditLogData {
	id: string;
	status: TaskStatus;
	actor: string;
	fromStatus: string;
	toStatus: string;
}

export class TaskRepository {
	async findMany(params: FindTasksParams): Promise<FindTasksResult> {
		const { status, q, page, limit } = params;
		const skip = (page - 1) * limit;

		const where: Prisma.TaskWhereInput = {
			deletedAt: null,
		};

		if (status) {
			where.status = status;
		}

		if (q) {
			where.OR = [
				{ title: { contains: q } },
				{ description: { contains: q } },
			];
		}

		const [tasks, total] = await Promise.all([
			prisma.task.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.task.count({ where }),
		]);

		return { tasks, total };
	}

	async findById(id: string, includeDeleted = false): Promise<Task | null> {
		return prisma.task.findFirst({
			where: {
				id,
				...(includeDeleted ? {} : { deletedAt: null }),
			},
		});
	}

	async softDelete(id: string): Promise<Task> {
		return prisma.task.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}

	async create(data: CreateTaskData): Promise<Task> {
		return prisma.task.create({
			data: {
				title: data.title,
				description: data.description ?? null,
				status: data.status ?? TaskStatus.TODO,
			},
		});
	}

	async updateStatusWithAuditLog(data: UpdateStatusWithAuditLogData): Promise<Task> {
		return prisma.$transaction(async (tx) => {
			const task = await tx.task.update({
				where: { id: data.id },
				data: { status: data.status },
			});

			await tx.auditLog.create({
				data: {
					taskId: data.id,
					actor: data.actor,
					fromStatus: data.fromStatus,
					toStatus: data.toStatus,
				},
			});

			return task;
		});
	}

	async findAuditLogsByTaskId(taskId: string): Promise<AuditLog[]> {
		return prisma.auditLog.findMany({
			where: { taskId },
			orderBy: { timestamp: "asc" },
		});
	}
}


export const taskRepository = new TaskRepository();
