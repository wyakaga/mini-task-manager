import type { TApiTaskStatus } from "@/interfaces/responses/task.interface";

export interface IGetTasksReq {
  status?: TApiTaskStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export interface ICreateTaskReq {
  title: string;
  description?: string | null;
}

export interface IUpdateTaskStatusReq {
  status: TApiTaskStatus;
  actor: string;
}
