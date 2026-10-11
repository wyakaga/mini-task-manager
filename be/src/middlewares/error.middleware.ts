import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiErrorResponse } from "@/types/response.types";

export class AppError extends Error {
	constructor(
		public readonly message: string,
		public readonly statusCode: number = 500,
		public readonly details?: unknown
	) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response<ApiErrorResponse>,
	_next: NextFunction
): void {
	if (err instanceof ZodError) {
		res.status(400).json({
			status: "error",
			message: "Validation failed",
			details: err.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			})),
		});
		return;
	}

	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			status: "error",
			message: err.message,
			details: err.details,
		});
		return;
	}

	if (err instanceof Error) {
		console.error("Unhandled error:", err);
		res.status(500).json({
			status: "error",
			message: err.message || "Internal server error",
		});
		return;
	}

	console.error("Unknown error:", err);
	res.status(500).json({
		status: "error",
		message: "An unexpected error occurred",
	});
}
