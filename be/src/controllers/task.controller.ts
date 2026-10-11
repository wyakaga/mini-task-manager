import { Request, Response, NextFunction } from "express";
import { taskService, TaskService } from "@/services/task.service";
import { CreateTaskInput, GetTasksQueryInput, UpdateTaskStatusInput } from "@/validators/task.validator";
import { ApiSuccessResponse } from "@/types/response.types";
import { AuditLogDto, TaskDto } from "@/types/task.types";
import { AppError } from "@/middlewares/error.middleware";

export class TaskController {
	constructor(private readonly service: TaskService = taskService) {}

	getTasks = async (
		req: Request,
		res: Response<ApiSuccessResponse<TaskDto[]>>,
		next: NextFunction
	): Promise<void> => {
		try {
			const query = req.query as unknown as GetTasksQueryInput;
			const { tasks, pagination } = await this.service.getTasks(query);

			res.status(200).json({
				status: "success",
				data: tasks,
				pagination,
			});
		} catch (error) {
			next(error);
		}
	};

	createTask = async (
		req: Request,
		res: Response<ApiSuccessResponse<TaskDto>>,
		next: NextFunction
	): Promise<void> => {
		try {
			const body = req.body as CreateTaskInput;
			const task = await this.service.createTask(body);

			res.status(201).json({
				status: "success",
				data: task,
			});
		} catch (error) {
			next(error);
		}
	};

	updateTaskStatus = async (
		req: Request,
		res: Response<ApiSuccessResponse<TaskDto>>,
		next: NextFunction
	): Promise<void> => {
		try {
			const { id } = req.params as { id: string };
			const body = req.body as UpdateTaskStatusInput;

			const task = await this.service.updateTaskStatus({
				id,
				status: body.status,
				actor: body.actor,
			});

			res.status(200).json({
				status: "success",
				data: task,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteTask = async (
		req: Request,
		res: Response<ApiSuccessResponse<TaskDto>>,
		next: NextFunction
	): Promise<void> => {
		try {
			const { id } = req.params as { id: string };
			const task = await this.service.deleteTask(id);

			res.status(200).json({
				status: "success",
				data: task,
				message: "Task deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	getTaskAuditLogs = async (
		req: Request,
		res: Response<ApiSuccessResponse<AuditLogDto[]>>,
		next: NextFunction
	): Promise<void> => {
		try {
			const { id } = req.params as { id: string };
			const auditLogs = await this.service.getTaskAuditLogs(id);

			res.status(200).json({
				status: "success",
				data: auditLogs,
			});
		} catch (error) {
			next(error);
		}
	};
}


export const taskController = new TaskController();
