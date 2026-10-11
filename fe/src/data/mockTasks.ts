import type { ITaskCard } from "@/types/kanban";

export const initialMockTasks: ITaskCard[] = [
  // To Do Column
  {
    id: "TSK-1041",
    title: "Deploy API Rate Limiter Middleware",
    description:
      "Configure deterministic sliding-window token bucket throttler across edge ingress gateways to prevent brute-force spikes.",
    stage: "To Do",
    nextStage: "Pending",
    actor: "m.torvalds",
    auditLogs: [
      {
        id: "log-1",
        actor: "m.torvalds",
        timestamp: "Oct 11 • 09:30",
        label: "specs amended in to_do",
        nodeColor: "orange",
      },
      {
        id: "log-2",
        actor: "m.torvalds",
        timestamp: "Oct 10 • 14:00",
        label: "created in to_do",
        nodeColor: "slate",
      },
    ],
  },
  {
    id: "TSK-1042",
    title: "Audit Identity Broker Callback Signatures",
    description:
      "Inspect elliptic-curve signatures on multi-tenant JWT claims prior to scheduled compliance migration.",
    stage: "To Do",
    nextStage: "Pending",
    actor: "a.patel",
    auditLogs: [
      {
        id: "log-3",
        actor: "a.patel",
        timestamp: "Oct 11 • 08:45",
        label: "created in to_do",
        nodeColor: "slate",
      },
    ],
  },

  // Pending Column
  {
    id: "TSK-1038",
    title: "Provision Secondary DB Read Replica",
    description:
      "Allocate compute resources in us-east-2 availability zone; awaiting VPC peering route validation.",
    stage: "Pending",
    nextStage: "In Progress",
    actor: "s.chen",
    auditLogs: [
      {
        id: "log-4",
        actor: "s.chen",
        timestamp: "Oct 11 • 08:30",
        label: "to_do → pending",
        nodeColor: "orange",
      },
      {
        id: "log-5",
        actor: "s.chen",
        timestamp: "Oct 10 • 17:10",
        label: "created in to_do",
        nodeColor: "slate",
      },
    ],
  },
  {
    id: "TSK-1039",
    title: "Validate TLS 1.3 Cipher Suites",
    description:
      "Pending operational sign-off from SecOps on removing legacy 1.2 fallbacks for enterprise webhooks.",
    stage: "Pending",
    nextStage: "In Progress",
    actor: "alex.dev",
    auditLogs: [
      {
        id: "log-6",
        actor: "alex.dev",
        timestamp: "Oct 11 • 07:15",
        label: "to_do → pending",
        nodeColor: "orange",
      },
    ],
  },

  // In Progress Column
  {
    id: "TSK-1033",
    title: "Refactor Event Sourcing Projection Queue",
    description:
      "Converting synchronous memory aggregations to Kafka consumer groups with replayable idempotency keys.",
    stage: "In Progress",
    nextStage: "Done",
    actor: "m.torvalds",
    auditLogs: [
      {
        id: "log-7",
        actor: "m.torvalds",
        timestamp: "Oct 11 • 10:14",
        label: "pending → in_progress",
        nodeColor: "orange",
      },
      {
        id: "log-8",
        actor: "s.chen",
        timestamp: "Oct 10 • 16:40",
        label: "to_do → pending",
        nodeColor: "mid-slate",
      },
      {
        id: "log-9",
        actor: "m.torvalds",
        timestamp: "Oct 09 • 11:20",
        label: "created in to_do",
        nodeColor: "slate",
      },
    ],
  },
  {
    id: "TSK-1035",
    title: "Implement Canary Deployment Hooks",
    description:
      "Writing automated health check probes with automated rollback upon error rates exceeding 0.05%.",
    stage: "In Progress",
    nextStage: "Done",
    actor: "alex.dev",
    auditLogs: [
      {
        id: "log-10",
        actor: "alex.dev",
        timestamp: "Oct 11 • 09:05",
        label: "pending → in_progress",
        nodeColor: "orange",
      },
    ],
  },

  // Done Column
  {
    id: "TSK-1029",
    title: "Rotate Production KMS Root Secrets",
    description:
      "Rotated hardware security module envelope credentials and invalidated previous session tokens successfully.",
    stage: "Done",
    actor: "s.chen",
    auditLogs: [
      {
        id: "log-11",
        actor: "s.chen",
        timestamp: "Oct 11 • 08:00",
        label: "in_progress → done",
        nodeColor: "charcoal",
      },
      {
        id: "log-12",
        actor: "s.chen",
        timestamp: "Oct 10 • 13:10",
        label: "pending → in_progress",
        nodeColor: "orange",
      },
      {
        id: "log-13",
        actor: "alex.dev",
        timestamp: "Oct 09 • 09:00",
        label: "to_do → pending",
        nodeColor: "mid-slate",
      },
    ],
  },
  {
    id: "TSK-1025",
    title: "Upgrade OpenSSL Ingress Gateway",
    description:
      "Mitigated critical vulnerability by rolling patched base images across all ingress nodes.",
    stage: "Done",
    actor: "a.patel",
    auditLogs: [
      {
        id: "log-14",
        actor: "a.patel",
        timestamp: "Oct 10 • 15:30",
        label: "in_progress → done",
        nodeColor: "charcoal",
      },
      {
        id: "log-15",
        actor: "a.patel",
        timestamp: "Oct 10 • 11:00",
        label: "created in to_do",
        nodeColor: "slate",
      },
    ],
  },
];
