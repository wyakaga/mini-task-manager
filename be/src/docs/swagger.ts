export const swaggerSpec = {
	openapi: "3.0.3",
	info: {
		title: "Mini Task Manager API",
		version: "1.0.0",
		description:
			"Backend REST API for Mini Task Manager featuring task lifecycle management, strict linear status transitions, soft deletes, and immutable audit logs.",
	},
	servers: [
		{
			url: "/",
			description: "Current environment",
		},
	],
	tags: [
		{
			name: "Tasks",
			description: "Task management and lifecycle operations",
		},
		{
			name: "Audit Logs",
			description: "Immutable audit history for tasks",
		},
		{
			name: "Health",
			description: "System health check endpoints",
		},
	],
	paths: {
		"/api/health": {
			get: {
				tags: ["Health"],
				summary: "Health check",
				description: "Verify that the service is running and healthy.",
				responses: {
					"200": {
						description: "Service is healthy",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										status: { type: "string", example: "success" },
										data: {
											type: "object",
											properties: {
												status: { type: "string", example: "ok" },
												timestamp: {
													type: "string",
													format: "date-time",
													example: "2026-10-10T10:00:00.000Z",
												},
											},
											required: ["status", "timestamp"],
										},
									},
									required: ["status", "data"],
								},
							},
						},
					},
				},
			},
		},
		"/api/tasks": {
			get: {
				tags: ["Tasks"],
				summary: "List tasks",
				description:
					"Retrieve paginated active (non-deleted) tasks. Supports optional status and text search filtering.",
				parameters: [
					{
						name: "status",
						in: "query",
						required: false,
						description: "Filter tasks by status",
						schema: {
							$ref: "#/components/schemas/TaskStatus",
						},
					},
					{
						name: "q",
						in: "query",
						required: false,
						description: "Case-insensitive search in title and description",
						schema: {
							type: "string",
						},
					},
					{
						name: "page",
						in: "query",
						required: false,
						description: "Page number (defaults to 1)",
						schema: {
							type: "integer",
							minimum: 1,
							default: 1,
						},
					},
					{
						name: "limit",
						in: "query",
						required: false,
						description: "Number of tasks per page (1-100, defaults to 10)",
						schema: {
							type: "integer",
							minimum: 1,
							maximum: 100,
							default: 10,
						},
					},
				],
				responses: {
					"200": {
						description: "Paginated list of active tasks",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiSuccessResponseTaskList",
								},
							},
						},
					},
					"400": {
						description: "Invalid query parameters",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
				},
			},
			post: {
				tags: ["Tasks"],
				summary: "Create a task",
				description:
					"Create a new task. Initial status is always 'todo'.",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/CreateTaskRequest",
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Task created successfully",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiSuccessResponseTask",
								},
							},
						},
					},
					"400": {
						description: "Validation error (e.g. empty title or initial status not 'todo')",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/tasks/{id}/status": {
			patch: {
				tags: ["Tasks"],
				summary: "Update task status",
				description:
					"Transition task status following bidirectional linear order: todo <-> pending <-> in_progress <-> done. Requires actor via request body. Idempotent if target status matches current status.",
				parameters: [
					{
						$ref: "#/components/parameters/taskIdParam",
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/UpdateTaskStatusRequest",
							},
						},
					},
				},
				responses: {
					"200": {
						description: "Task status updated or returned unchanged (idempotent)",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiSuccessResponseTask",
								},
							},
						},
					},
					"400": {
						description: "Invalid status transition, missing actor, or invalid UUID",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
					"404": {
						description: "Task not found or soft-deleted",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/tasks/{id}": {
			delete: {
				tags: ["Tasks"],
				summary: "Soft delete a task",
				description:
					"Soft-delete a task by recording deletedAt timestamp. Audit logs are preserved intact. Already deleted tasks return 404.",
				parameters: [
					{
						$ref: "#/components/parameters/taskIdParam",
					},
				],
				responses: {
					"200": {
						description: "Task deleted successfully",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiSuccessResponseDeleteTask",
								},
							},
						},
					},
					"400": {
						description: "Invalid UUID format",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
					"404": {
						description: "Task not found or already deleted",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/tasks/{id}/audit-logs": {
			get: {
				tags: ["Audit Logs"],
				summary: "Get task audit logs",
				description:
					"Retrieve chronological audit trail for a task ordered by timestamp ascending. Preserved even after task is soft-deleted.",
				parameters: [
					{
						$ref: "#/components/parameters/taskIdParam",
					},
				],
				responses: {
					"200": {
						description: "Chronological audit trail for the task",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiSuccessResponseAuditLogs",
								},
							},
						},
					},
					"400": {
						description: "Invalid UUID format",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
					"404": {
						description: "Task not found",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ApiErrorResponse",
								},
							},
						},
					},
				},
			},
		},
	},
	components: {
		parameters: {
			taskIdParam: {
				name: "id",
				in: "path",
				required: true,
				description: "Unique UUID identifier of the task",
				schema: {
					type: "string",
					format: "uuid",
					example: "123e4567-e89b-12d3-a456-426614174000",
				},
			},
		},
		schemas: {
			TaskStatus: {
				type: "string",
				enum: ["todo", "pending", "in_progress", "done"],
				example: "todo",
			},
			Task: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					title: {
						type: "string",
						example: "Implement authentication",
					},
					description: {
						type: "string",
						nullable: true,
						example: "Detailed task description",
					},
					status: {
						$ref: "#/components/schemas/TaskStatus",
					},
					deletedAt: {
						type: "string",
						format: "date-time",
						nullable: true,
						example: null,
					},
					createdAt: {
						type: "string",
						format: "date-time",
						example: "2026-10-10T08:30:00.000Z",
					},
					updatedAt: {
						type: "string",
						format: "date-time",
						example: "2026-10-10T08:30:00.000Z",
					},
				},
				required: ["id", "title", "description", "status", "createdAt", "updatedAt"],
			},
			AuditLog: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "987fcdeb-51a2-43f7-9876-543210987654",
					},
					taskId: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					actor: {
						type: "string",
						example: "john.doe",
					},
					fromStatus: {
						$ref: "#/components/schemas/TaskStatus",
					},
					toStatus: {
						$ref: "#/components/schemas/TaskStatus",
					},
					timestamp: {
						type: "string",
						format: "date-time",
						example: "2026-10-10T08:35:00.000Z",
					},
				},
				required: ["id", "taskId", "actor", "fromStatus", "toStatus", "timestamp"],
			},
			PaginationMeta: {
				type: "object",
				properties: {
					page: {
						type: "integer",
						example: 1,
					},
					limit: {
						type: "integer",
						example: 10,
					},
					total: {
						type: "integer",
						example: 42,
					},
					totalPages: {
						type: "integer",
						example: 5,
					},
				},
				required: ["page", "limit", "total", "totalPages"],
			},
			CreateTaskRequest: {
				type: "object",
				properties: {
					title: {
						type: "string",
						minLength: 1,
						maxLength: 255,
						example: "Set up CI/CD pipeline",
					},
					description: {
						type: "string",
						maxLength: 2000,
						nullable: true,
						example: "Configure GitHub Actions workflow for automated tests",
					},
					status: {
						type: "string",
						enum: ["todo"],
						description: "Initial status must be 'todo' if provided",
						example: "todo",
					},
				},
				required: ["title"],
			},
			UpdateTaskStatusRequest: {
				type: "object",
				properties: {
					status: {
						$ref: "#/components/schemas/TaskStatus",
					},
					actor: {
						type: "string",
						description: "Actor responsible for transition",
						example: "john.doe",
					},
				},
				required: ["status", "actor"],
			},
			ApiSuccessResponseTask: {
				type: "object",
				properties: {
					status: {
						type: "string",
						example: "success",
					},
					data: {
						$ref: "#/components/schemas/Task",
					},
				},
				required: ["status", "data"],
			},
			ApiSuccessResponseTaskList: {
				type: "object",
				properties: {
					status: {
						type: "string",
						example: "success",
					},
					data: {
						type: "array",
						items: {
							$ref: "#/components/schemas/Task",
						},
					},
					pagination: {
						$ref: "#/components/schemas/PaginationMeta",
					},
				},
				required: ["status", "data", "pagination"],
			},
			ApiSuccessResponseDeleteTask: {
				type: "object",
				properties: {
					status: {
						type: "string",
						example: "success",
					},
					data: {
						$ref: "#/components/schemas/Task",
					},
					message: {
						type: "string",
						example: "Task deleted successfully",
					},
				},
				required: ["status", "data", "message"],
			},
			ApiSuccessResponseAuditLogs: {
				type: "object",
				properties: {
					status: {
						type: "string",
						example: "success",
					},
					data: {
						type: "array",
						items: {
							$ref: "#/components/schemas/AuditLog",
						},
					},
				},
				required: ["status", "data"],
			},
			ApiErrorResponse: {
				type: "object",
				properties: {
					status: {
						type: "string",
						example: "error",
					},
					message: {
						type: "string",
						example: "Validation failed",
					},
					details: {
						nullable: true,
						description: "Detailed error array or debugging context",
					},
				},
				required: ["status", "message"],
			},
		},
	},
};
