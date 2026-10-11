import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type RequestLocation = "body" | "query" | "params";

export function validate(schema: ZodSchema, location: RequestLocation = "body") {
	return (req: Request, _res: Response, next: NextFunction): void => {
		const result = schema.safeParse(req[location]);
		if (!result.success) {
			next(result.error);
			return;
		}
		Object.defineProperty(req, location, {
			value: result.data,
			writable: true,
			enumerable: true,
			configurable: true,
		});
		next();
	};
}
