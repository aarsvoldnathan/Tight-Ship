import { Asset, MaintenanceTask, Property, ServiceTask } from './types';

const DAY = 86_400_000;

/** Date-based items are "due soon" within this many days. */
export const DUE_SOON_DAYS = 14;
/** Equipment hours are stale after this many days without an update. */
export const STALE_HOURS_DAYS = 7;

export type Status = 'overdue' | 'dueSoon' | 'ok';

/** One thing that needs doing, from any module. */
export type DueItem = {
  id: string;
  module: 'service' | 'properties';
  title: string;
  subtitle: string;
  status: Status;
  detail: string;
  /** Sort key within a status: lower = more urgent. */
  urgency: number;
  /** Screen to open for this item. */
  href: { pathname: '/service/[id]' | '/properties/[id]'; params: { id: string } };
};

const statusRank: Record<Status, number> = { overdue: 0, dueSoon: 1, ok: 2 };

function describe(value: number, unit: string): string {
  const abs = Math.abs(Math.round(value));
  return value < 0 ? `Overdue by ${abs} ${unit}` : `Due in ${abs} ${unit}`;
}

export function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
}

/** Days-only schedule (Home & Rentals tasks). */
export function propertyTaskDue(task: MaintenanceTask, property: Property, now: Date): DueItem {
  const base = {
    id: task.id,
    module: 'properties' as const,
    title: task.name,
    subtitle: property.name,
    href: { pathname: '/properties/[id]' as const, params: { id: property.id } },
  };
  if (!task.intervalDays) {
    return { ...base, status: 'ok', detail: 'No schedule set', urgency: Infinity };
  }
  const dueMs = new Date(task.lastDoneDate).getTime() + task.intervalDays * DAY;
  const remaining = Math.ceil((dueMs - now.getTime()) / DAY);
  const status: Status =
    remaining < 0 ? 'overdue' : remaining <= DUE_SOON_DAYS ? 'dueSoon' : 'ok';
  return { ...base, status, detail: describe(remaining, 'd'), urgency: remaining / task.intervalDays };
}

/** Hours and/or days schedule (Service tasks). Whichever comes first wins. */
export function serviceTaskDue(task: ServiceTask, asset: Asset, now: Date): DueItem {
  const base = {
    id: task.id,
    module: 'service' as const,
    title: task.name,
    subtitle: asset.name,
    href: { pathname: '/service/[id]' as const, params: { id: asset.id } },
  };
  const parts: { remaining: number; ratio: number; soon: boolean; text: string }[] = [];

  if (task.intervalHours) {
    const remaining = task.lastDoneHours + task.intervalHours - asset.currentHours;
    parts.push({
      remaining,
      ratio: remaining / task.intervalHours,
      soon: remaining <= Math.max(10, task.intervalHours * 0.1),
      text: describe(remaining, 'h'),
    });
  }
  if (task.intervalDays) {
    const dueMs = new Date(task.lastDoneDate).getTime() + task.intervalDays * DAY;
    const remaining = Math.ceil((dueMs - now.getTime()) / DAY);
    parts.push({
      remaining,
      ratio: remaining / task.intervalDays,
      soon: remaining <= DUE_SOON_DAYS,
      text: describe(remaining, 'd'),
    });
  }
  if (parts.length === 0) {
    return { ...base, status: 'ok', detail: 'No schedule set', urgency: Infinity };
  }

  const sorted = [...parts].sort((a, b) => a.ratio - b.ratio);
  const status: Status = parts.some((p) => p.remaining < 0)
    ? 'overdue'
    : parts.some((p) => p.soon)
      ? 'dueSoon'
      : 'ok';
  return { ...base, status, detail: sorted.map((p) => p.text).join('  ·  '), urgency: sorted[0].ratio };
}

export function sortDue(items: DueItem[]): DueItem[] {
  return [...items].sort(
    (a, b) => statusRank[a.status] - statusRank[b.status] || a.urgency - b.urgency,
  );
}

/** Everything overdue or due soon across all modules, most urgent first. */
export function getDueItems(
  properties: Property[],
  propertyTasks: MaintenanceTask[],
  assets: Asset[],
  serviceTasks: ServiceTask[],
  now: Date,
): DueItem[] {
  const propById = new Map(properties.map((p) => [p.id, p]));
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const items: DueItem[] = [];
  for (const t of propertyTasks) {
    const p = propById.get(t.propertyId);
    if (p) items.push(propertyTaskDue(t, p, now));
  }
  for (const t of serviceTasks) {
    const a = assetById.get(t.assetId);
    if (a) items.push(serviceTaskDue(t, a, now));
  }
  return sortDue(items.filter((i) => i.status !== 'ok'));
}

/** Assets whose hours have not been updated recently. */
export function getStaleAssets(assets: Asset[], now: Date): Asset[] {
  return assets
    .filter((a) => a.kind !== 'vehicle' || a.currentHours > 0)
    .filter((a) => daysSince(a.hoursUpdatedAt, now) >= STALE_HOURS_DAYS)
    .sort((a, b) => a.hoursUpdatedAt.localeCompare(b.hoursUpdatedAt));
}
