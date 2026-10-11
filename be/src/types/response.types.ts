export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ApiSuccessResponse<T> {
	status: "success";
	data: T;
	pagination?: PaginationMeta;
	message?: string;
}

export interface ApiErrorResponse {
	status: "error";
	message: string;
	details?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
