import { MdHistory, MdExpandMore } from "react-icons/md";
import { Accordion, Skeleton, cn } from "@heroui/react";
import type { IAuditItem, TNodeColor } from "@/types/kanban";
import { toAuditItem } from "@/types/kanban";
import { useGetTaskAuditLogsQuery } from "@/services/tasks";

interface IAuditTimelineProps {
  taskId?: string;
  logs?: IAuditItem[];
  defaultOpen?: boolean;
}

const getNodeDotColorClass = (color?: TNodeColor): string => {
  switch (color) {
    case "orange":
      return "bg-studio-orange";
    case "slate":
      return "bg-slate-canvas";
    case "mid-slate":
      return "bg-mid-slate";
    case "charcoal":
      return "bg-charcoal-ink";
    default:
      return "bg-slate-canvas";
  }
};

const getBadgeStyleClass = (label: string): string => {
  if (label.includes("todo → pending") || label.includes("to_do → pending")) {
    return "bg-secondary-fixed text-on-secondary-container";
  }
  if (label.includes("pending → in_progress")) {
    return "bg-surface-container-high text-primary";
  }
  if (label.includes("in_progress → done")) {
    return "bg-charcoal-ink text-paper-white";
  }
  if (label.includes("done → in_progress")) {
    return "bg-studio-orange/15 text-charcoal-ink border border-studio-orange/40";
  }
  if (label.includes("in_progress → pending")) {
    return "bg-secondary-fixed/60 text-charcoal-ink border border-secondary-fixed";
  }
  if (label.includes("pending → todo")) {
    return "bg-gallery-gray text-steel-gray border border-silver-gray/50";
  }
  return "bg-gallery-gray text-charcoal-ink";
};

export function AuditTimeline({
  taskId,
  logs: propLogs,
  defaultOpen = false,
}: IAuditTimelineProps) {
  const { data, isLoading } = useGetTaskAuditLogsQuery(taskId ?? "", Boolean(taskId));

  const resolvedLogs: IAuditItem[] = propLogs
    ? propLogs
    : data?.data
      ? data.data.map(toAuditItem).reverse()
      : [];

  return (
    <div className="bg-[#f8f9fa] rounded-[6px] p-space-sm mt-1">
      <Accordion hideSeparator className="w-full p-0">
        <Accordion.Item
          id="activity-log"
          defaultExpanded={defaultOpen}
          className="border-none p-0"
        >
          <Accordion.Heading>
            <Accordion.Trigger className="w-full flex items-center justify-between text-left font-utility-sm text-utility-sm font-semibold text-charcoal-ink hover:text-studio-orange transition-colors p-0 cursor-pointer">
              <span className="flex items-center gap-1">
                <MdHistory className="text-[16px] text-steel-gray" />
                <span>
                  Activity Log ({isLoading ? "…" : resolvedLogs.length})
                </span>
              </span>
              <Accordion.Indicator className="text-[16px] text-charcoal-ink">
                <MdExpandMore />
              </Accordion.Indicator>
            </Accordion.Trigger>
          </Accordion.Heading>

          <Accordion.Panel>
            <Accordion.Body className="p-0">
              {isLoading ? (
                <div className="mt-2 flex flex-col gap-2.5 relative pl-3">
                  <div className="absolute left-1 top-1 bottom-2 w-0.5 bg-outline-variant" />
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="relative flex flex-col gap-1 text-left">
                      <span className="absolute -left-2.75 top-1.5 w-2 h-2 rounded-full bg-mist-gray animate-pulse" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-2.5 w-16 rounded" />
                      </div>
                      <Skeleton className="h-4 w-24 rounded mt-0.5" />
                    </div>
                  ))}
                </div>
              ) : resolvedLogs.length === 0 ? (
                <p className="mt-2 text-[11px] text-steel-gray italic">
                  Initial state (no transitions yet)
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-2 relative pl-3">
                  <div className="absolute left-1 top-1 bottom-2 w-0.5 bg-outline-variant" />
                  {resolvedLogs.map((log) => (
                    <div key={log.id} className="relative flex flex-col text-left">
                      <span
                        className={cn(
                          "absolute -left-2.75 top-1.5 w-2 h-2 rounded-full",
                          getNodeDotColorClass(log.nodeColor)
                        )}
                      />
                      <div className="flex items-center justify-between text-[11px] leading-tight">
                        <span className="font-semibold text-charcoal-ink">{log.actor}</span>
                        <span className="text-steel-gray">{log.timestamp}</span>
                      </div>
                      <div className="inline-block mt-0.5">
                        <span
                          className={cn(
                            "inline-flex px-1.5 py-0.5 text-[10px] rounded font-medium",
                            getBadgeStyleClass(log.label)
                          )}
                        >
                          {log.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
