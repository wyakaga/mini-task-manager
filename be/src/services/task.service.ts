import { taskRepository, TaskRepository } from "@/repositories/task.repository";
import {
	ALLOWED_TRANSITIONS,
	AuditLogDto,
	CreateTaskDto,
	GetTasksQuery,
	NEXT_ALLOWED_STATUS,
	TaskDto,
	toApiStatus,
	toAuditLogDto,
	toDbStatus,
	toTaskDto,
	UpdateTaskStatusDto,
} from "@/types/task.types";
import { PaginationMeta } from "@/types/response.types";
import { AppError } from "@/middlewares/error.middleware";
import { TaskStatus } from "@prisma/client";

export interface GetTasksServiceResult {
	tasks: TaskDto[];
	pagination: PaginationMeta;
}

export class TaskService {
	constructor(private readonly repo: TaskRepository = taskRepository) {}

	async getTasks(query: GetTasksQuery): Promise<GetTasksServiceResult> {
		const dbStatus = query.status ? toDbStatus(query.status) : undefined;

		const { tasks, total } = await this.repo.findMany({
			status: dbStatus,
			q: query.q,
			page: query.page,
			limit: query.limit,
		});

		const taskDtos = tasks.map(toTaskDto);
		const totalPages = Math.ceil(total / query.limit);

		return {
			tasks: taskDtos,
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages: total === 0 ? 0 : totalPages,
			},
		};
	}

	async createTask(data: CreateTaskDto): Promise<TaskDto> {
		const task = await this.repo.create({
			title: data.title,
			description: data.description,
			status: TaskStatus.TODO,
		});

		return toTaskDto(task);
	}

	async updateTaskStatus(dto: UpdateTaskStatusDto): Promise<TaskDto> {
		const task = await this.repo.findById(dto.id);
		if (!task) {
			throw new AppError("Task not found", 404);
		}

		const currentStatus = toApiStatus(task.status);
		if (currentStatus === dto.status) {
			return toTaskDto(task);
		}

		const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] ?? [];
		if (!allowedTargets.includes(dto.status)) {
			throw new AppError(
				`Invalid status transition from '${currentStatus}' to '${dto.status}'`,
				400
			);
		}

		const updatedTask = await this.repo.updateStatusWithAuditLog({
			id: dto.id,
			status: toDbStatus(dto.status),
			actor: dto.actor,
			fromStatus: currentStatus,
			toStatus: dto.status,
		});

		return toTaskDto(updatedTask);
	}

	async deleteTask(id: string): Promise<TaskDto> {
		const task = await this.repo.findById(id);
		if (!task) {
			throw new AppError("Task not found", 404);
		}

		const deletedTask = await this.repo.softDelete(id);
		return toTaskDto(deletedTask);
	}

	async getTaskAuditLogs(taskId: string): Promise<AuditLogDto[]> {
		const task = await this.repo.findById(taskId, true);
		if (!task) {
			throw new AppError("Task not found", 404);
		}

		const logs = await this.repo.findAuditLogsByTaskId(taskId);
		return logs.map(toAuditLogDto);
	}
}


export const taskService = new TaskService();
