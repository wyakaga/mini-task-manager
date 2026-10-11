import express, { Application, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import apiRouter from "@/routes";
import { swaggerSpec } from "@/docs/swagger";
import { errorHandler } from "@/middlewares/error.middleware";

export function createApp(): Application {
	const app = express();

	// Middleware
	app.use(cors());
	app.use(express.json());

	// API documentation (Swagger UI & OpenAPI Spec)
	const swaggerJsonHandler = (_req: Request, res: Response) => {
		res.setHeader("Content-Type", "application/json");
		res.json(swaggerSpec);
	};

	app.get(["/api/docs.json", "/api-docs.json", "/docs.json"], swaggerJsonHandler);
	app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Mini Task Manager API Docs" }));
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Mini Task Manager API Docs" }));
	app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Mini Task Manager API Docs" }));

	// Mount API routes (uniformly prefixed with /api)
	app.use("/api", apiRouter);

	// 404 handler for unmatched routes
	app.use((_req: Request, res: Response) => {
		res.status(404).json({
			status: "error",
			message: "Route not found",
		});
	});

	// Centralized error handler
	app.use(errorHandler);

	return app;
}
