import { Router } from "express";
import { taskController } from "@/controllers/task.controller";
import { validate } from "@/middlewares/validate.middleware";
import {
	createTaskSchema,
	getTasksQuerySchema,
	taskIdParamSchema,
	updateTaskStatusSchema,
} from "@/validators/task.validator";

const router = Router();

router.get("/", validate(getTasksQuerySchema, "query"), taskController.getTasks);
router.post("/", validate(createTaskSchema, "body"), taskController.createTask);
router.patch(
	"/:id/status",
	validate(taskIdParamSchema, "params"),
	validate(updateTaskStatusSchema, "body"),
	taskController.updateTaskStatus
);
router.delete(
	"/:id",
	validate(taskIdParamSchema, "params"),
	taskController.deleteTask
);
router.get(
	"/:id/audit-logs",
	validate(taskIdParamSchema, "params"),
	taskController.getTaskAuditLogs
);

export default router;

