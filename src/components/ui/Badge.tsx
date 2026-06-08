import { cn } from "@/lib/utils";
import {
  REQUIREMENT_STATUS_COLORS,
  REQUIREMENT_STATUS_LABELS,
  EVIDENCE_STATUS_COLORS,
  EVIDENCE_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_STATUS_LABELS,
  ACTION_PLAN_STATUS_COLORS,
  ACTION_PLAN_STATUS_LABELS,
  ACTION_PLAN_PRIORITY_COLORS,
  ACTION_PLAN_PRIORITY_LABELS,
  type ProjectRequirementStatus,
  type EvidenceStatus,
  type DocumentStatus,
  type ActionPlanStatus,
  type ActionPlanPriority,
} from "@/lib/enums";

function BaseBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        color
      )}
    >
      {label}
    </span>
  );
}

export function RequirementStatusBadge({ status }: { status: string }) {
  const s = status as ProjectRequirementStatus;
  return (
    <BaseBadge
      label={REQUIREMENT_STATUS_LABELS[s] ?? status}
      color={REQUIREMENT_STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}
    />
  );
}

export function EvidenceStatusBadge({ status }: { status: string }) {
  const s = status as EvidenceStatus;
  return (
    <BaseBadge
      label={EVIDENCE_STATUS_LABELS[s] ?? status}
      color={EVIDENCE_STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}
    />
  );
}

export function DocumentStatusBadge({ status }: { status: string }) {
  const s = status as DocumentStatus;
  return (
    <BaseBadge
      label={DOCUMENT_STATUS_LABELS[s] ?? status}
      color={DOCUMENT_STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}
    />
  );
}

export function ActionPlanStatusBadge({ status }: { status: string }) {
  const s = status as ActionPlanStatus;
  return (
    <BaseBadge
      label={ACTION_PLAN_STATUS_LABELS[s] ?? status}
      color={ACTION_PLAN_STATUS_COLORS[s] ?? "bg-gray-100 text-gray-600"}
    />
  );
}

export function ActionPlanPriorityBadge({ priority }: { priority: string }) {
  const p = priority as ActionPlanPriority;
  return (
    <BaseBadge
      label={ACTION_PLAN_PRIORITY_LABELS[p] ?? priority}
      color={ACTION_PLAN_PRIORITY_COLORS[p] ?? "bg-gray-100 text-gray-600"}
    />
  );
}
