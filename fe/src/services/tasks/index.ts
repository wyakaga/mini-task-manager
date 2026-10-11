import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ICreateTaskReq,
  IGetTasksReq,
  IUpdateTaskStatusReq,
} from "@/interfaces/requests/task.interface";
import {
  createTask,
  deleteTask,
  getTaskAuditLogs,
  getTasks,
  updateTaskStatus,
} from "./api";

export const useGetTasksQuery = (params?: IGetTasksReq, enabled = true) => {
  return useQuery({
    queryKey: ["tasks", "list", params],
    queryFn: () => getTasks(params),
    enabled,
  });
};

export const useInfiniteTasksQuery = (
  params?: Omit<IGetTasksReq, "page">,
  limit = 10,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: ["tasks", "infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      getTasks({ ...params, page: pageParam as number, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.totalPages
        ? pagination.page + 1
        : undefined;
    },
    enabled,
  });
};

export const useGetTaskAuditLogsQuery = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: ["tasks", "audit-logs", taskId],
    queryFn: () => getTaskAuditLogs(taskId),
    enabled: Boolean(taskId) && enabled,
  });
};

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ICreateTaskReq) => createTask(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: IUpdateTaskStatusReq }) =>
      updateTaskStatus(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "audit-logs", variables.id],
      });
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
