import { Router } from "express";
import taskRoutes from "@/routes/task.routes";

const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
	res.status(200).json({
		status: "success",
		data: { status: "ok", timestamp: new Date().toISOString() },
	});
});

apiRouter.use("/tasks", taskRoutes);

export default apiRouter;
