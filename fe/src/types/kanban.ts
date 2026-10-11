import type {
  IAuditLogRes,
  ITaskRes,
  TApiTaskStatus,
} from "@/interfaces/responses/task.interface";

export type TTaskStage = "To Do" | "Pending" | "In Progress" | "Done";

export type TNodeColor = "orange" | "slate" | "charcoal" | "mid-slate";

export interface IAuditItem {
  id: string;
  actor: string;
  timestamp: string;
  label: string;
  nodeColor?: TNodeColor;
}

export interface ITaskCard {
  id: string;
  title: string;
  description: string;
  stage: TTaskStage;
  nextStage?: TTaskStage;
  prevStage?: TTaskStage;
  actor: string;
  auditLogs: IAuditItem[];
}

export const STATUS_TO_STAGE: Record<TApiTaskStatus, TTaskStage> = {
  todo: "To Do",
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

export const STAGE_TO_STATUS: Record<TTaskStage, TApiTaskStatus> = {
  "To Do": "todo",
  Pending: "pending",
  "In Progress": "in_progress",
  Done: "done",
};

export const NEXT_STAGE_MAP: Record<TTaskStage, TTaskStage | undefined> = {
  "To Do": "Pending",
  Pending: "In Progress",
  "In Progress": "Done",
  Done: undefined,
};

export const PREV_STAGE_MAP: Record<TTaskStage, TTaskStage | undefined> = {
  "To Do": undefined,
  Pending: "To Do",
  "In Progress": "Pending",
  Done: "In Progress",
};

export const NEXT_STATUS_MAP: Record<TApiTaskStatus, TApiTaskStatus | undefined> = {
  todo: "pending",
  pending: "in_progress",
  in_progress: "done",
  done: undefined,
};

export const PREV_STATUS_MAP: Record<TApiTaskStatus, TApiTaskStatus | undefined> = {
  todo: undefined,
  pending: "todo",
  in_progress: "pending",
  done: "in_progress",
};

export const ALLOWED_TARGET_STAGES: Record<TTaskStage, TTaskStage[]> = {
  "To Do": ["Pending"],
  Pending: ["To Do", "In Progress"],
  "In Progress": ["Pending", "Done"],
  Done: ["In Progress"],
};

export const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export const toAuditItem = (log: IAuditLogRes): IAuditItem => {
  const from = log.fromStatus;
  const to = log.toStatus;
  const label = `${from} → ${to}`;

  let nodeColor: TNodeColor = "slate";
  if (to === "done") {
    nodeColor = "charcoal";
  } else if (to === "in_progress") {
    nodeColor = "orange";
  } else if (to === "pending") {
    nodeColor = "mid-slate";
  }

  return {
    id: log.id,
    actor: log.actor,
    timestamp: formatRelativeTime(log.timestamp),
    label,
    nodeColor,
  };
};

export const toTaskCard = (
  task: ITaskRes,
  auditLogs: IAuditLogRes[] = [],
): ITaskCard => {
  const stage = STATUS_TO_STAGE[task.status] ?? "To Do";
  const nextStage = NEXT_STAGE_MAP[stage];
  const prevStage = PREV_STAGE_MAP[stage];
  const lastActor =
    auditLogs.length > 0 ? auditLogs[auditLogs.length - 1].actor : "Unassigned";

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    stage,
    nextStage,
    prevStage,
    actor: lastActor,
    auditLogs: auditLogs.map(toAuditItem).reverse(),
  };
};
