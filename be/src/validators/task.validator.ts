import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "pending", "in_progress", "done"]);

export const getTasksQuerySchema = z.object({
	status: taskStatusSchema.optional(),
	q: z.string().trim().min(1).optional(),
	page: z
		.string()
		.optional()
		.default("1")
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive()),
	limit: z
		.string()
		.optional()
		.default("10")
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().int().positive().max(100)),
});

export type GetTasksQueryInput = z.infer<typeof getTasksQuerySchema>;

export const createTaskSchema = z.object({
	title: z
		.string({ message: "Title is required" })
		.trim()
		.min(1, "Title cannot be empty")
		.max(255, "Title must be at most 255 characters"),
	description: z
		.string({ message: "Description must be a string" })
		.trim()
		.max(2000, "Description must be at most 2000 characters")
		.optional()
		.nullable()
		.transform((val) => (val && val.length > 0 ? val : null)),
	status: z
		.literal("todo", "Initial task status must be 'todo'")
		.optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const taskIdParamSchema = z.object({
	id: z.string().uuid("Invalid task ID format"),
});

export type TaskIdParamInput = z.infer<typeof taskIdParamSchema>;

export const updateTaskStatusSchema = z.object({
	status: taskStatusSchema,
	actor: z
		.string({ message: "Actor is required" })
		.trim()
		.min(1, "Actor cannot be empty"),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

