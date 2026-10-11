import { apiClient } from "@/lib/axios/axios";
import type {
  ICreateTaskReq,
  IGetTasksReq,
  IUpdateTaskStatusReq,
} from "@/interfaces/requests/task.interface";
import type {
  ICreateTaskRes,
  IDeleteTaskRes,
  IGetTaskAuditLogsRes,
  IGetTasksRes,
  IUpdateTaskStatusRes,
} from "@/interfaces/responses/task.interface";

export const getTasks = async (params?: IGetTasksReq): Promise<IGetTasksRes> => {
  const { data } = await apiClient.get<IGetTasksRes>("/tasks", { params });
  return data;
};

export const createTask = async (body: ICreateTaskReq): Promise<ICreateTaskRes> => {
  const { data } = await apiClient.post<ICreateTaskRes>("/tasks", body);
  return data;
};

export const updateTaskStatus = async (
  id: string,
  body: IUpdateTaskStatusReq,
): Promise<IUpdateTaskStatusRes> => {
  const { data } = await apiClient.patch<IUpdateTaskStatusRes>(`/tasks/${id}/status`, body);
  return data;
};

export const deleteTask = async (id: string): Promise<IDeleteTaskRes> => {
  const { data } = await apiClient.delete<IDeleteTaskRes>(`/tasks/${id}`);
  return data;
};

export const getTaskAuditLogs = async (id: string): Promise<IGetTaskAuditLogsRes> => {
  const { data } = await apiClient.get<IGetTaskAuditLogsRes>(`/tasks/${id}/audit-logs`);
  return data;
};
