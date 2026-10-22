/* ---------- Shared ---------- */

export type WorkType = 'w2' | '1099' | 'both';

export type Profile = {
  id: string;
  displayName: string | null;
  workType: WorkType;
  /** Which modules the user has switched on. */
  modules: string[];
};

/* ---------- Home & Rentals module ---------- */

export type PropertyKind = 'home' | 'rental' | 'other';

export const KIND_LABELS: Record<PropertyKind, string> = {
  home: 'My home',
  rental: 'Rental',
  other: 'Other',
};

export type Property = {
  id: string;
  name: string;
  address: string | null;
  kind: PropertyKind;
  tenantName: string | null;
  tenantContact: string | null;
  monthlyRent: number | null;
  notes: string | null;
};

export type MaintenanceTask = {
  id: string;
  propertyId: string;
  name: string;
  intervalDays: number | null;
  lastDoneDate: string;
  notes: string | null;
};

export type MaintenanceLog = {
  id: string;
  propertyId: string;
  taskId: string | null;
  taskName: string;
  performedBy: string | null;
  performedAt: string;
  cost: number | null;
  notes: string | null;
};

/* ---------- Service module (vehicles, machines, equipment) ---------- */

export type AssetKind = 'vehicle' | 'machine' | 'equipment' | 'other';

export const ASSET_LABELS: Record<AssetKind, string> = {
  vehicle: 'Vehicle',
  machine: 'Machine',
  equipment: 'Equipment',
  other: 'Other',
};

export type Asset = {
  id: string;
  name: string;
  serial: string | null;
  kind: AssetKind;
  currentHours: number;
  /** ISO timestamp of the last time hours were entered. */
  hoursUpdatedAt: string;
};

export type ServiceTask = {
  id: string;
  assetId: string;
  name: string;
  intervalHours: number | null;
  intervalDays: number | null;
  lastDoneHours: number;
  lastDoneDate: string;
};

export type ServiceLog = {
  id: string;
  assetId: string;
  taskId: string | null;
  taskName: string;
  performedBy: string | null;
  performedAt: string;
  hoursAtService: number | null;
  notes: string | null;
};
