export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiSuccessRes<T> {
  status: "success";
  data: T;
  pagination?: IPaginationMeta;
  message?: string;
}

export interface IApiErrorRes {
  status: "error";
  message: string;
  details?: unknown;
}

export type IApiResponse<T> = IApiSuccessRes<T> | IApiErrorRes;
