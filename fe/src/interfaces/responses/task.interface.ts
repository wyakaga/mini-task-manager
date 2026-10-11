import type { IApiSuccessRes } from "./base.interface";

export type TApiTaskStatus = "todo" | "pending" | "in_progress" | "done";

export interface ITaskRes {
  id: string;
  title: string;
  description: string | null;
  status: TApiTaskStatus;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAuditLogRes {
  id: string;
  taskId: string;
  actor: string;
  fromStatus: TApiTaskStatus;
  toStatus: TApiTaskStatus;
  timestamp: string;
}

export type IGetTasksRes = IApiSuccessRes<ITaskRes[]>;
export type ICreateTaskRes = IApiSuccessRes<ITaskRes>;
export type IUpdateTaskStatusRes = IApiSuccessRes<ITaskRes>;
export type IDeleteTaskRes = IApiSuccessRes<ITaskRes>;
export type IGetTaskAuditLogsRes = IApiSuccessRes<IAuditLogRes[]>;
