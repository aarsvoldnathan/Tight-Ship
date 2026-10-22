import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import {
  Asset,
  AssetKind,
  MaintenanceLog,
  MaintenanceTask,
  Profile,
  Property,
  PropertyKind,
  ServiceLog,
  ServiceTask,
} from './types';

type Data = {
  profile: Profile | null;
  properties: Property[];
  propertyTasks: MaintenanceTask[];
  propertyLogs: MaintenanceLog[];
  assets: Asset[];
  serviceTasks: ServiceTask[];
  serviceLogs: ServiceLog[];
};

const empty: Data = {
  profile: null,
  properties: [],
  propertyTasks: [],
  propertyLogs: [],
  assets: [],
  serviceTasks: [],
  serviceLogs: [],
};

export type NewProperty = {
  name: string;
  address?: string;
  kind: PropertyKind;
  tenantName?: string;
  tenantContact?: string;
  monthlyRent?: number;
  notes?: string;
};

export type NewAsset = { name: string; serial?: string; kind: AssetKind; currentHours: number };

export type NewServiceTask = {
  assetId: string;
  name: string;
  intervalHours: number | null;
  intervalDays: number | null;
};

/** Each action returns an error message, or null on success. */
type Result = Promise<string | null>;

type StoreValue = Data & {
  ready: boolean;
  refresh: () => Promise<void>;

  addProperty: (p: NewProperty) => Result;
  deleteProperty: (id: string) => Result;
  addPropertyTask: (propertyId: string, name: string, intervalDays: number | null) => Result;
  deletePropertyTask: (id: string) => Result;
  completePropertyTask: (
    task: MaintenanceTask,
    details: { performedBy?: string; cost?: number; notes?: string },
  ) => Result;

  addAsset: (a: NewAsset) => Result;
  deleteAsset: (id: string) => Result;
  updateHours: (assetId: string, hours: number) => Result;
  addServiceTask: (t: NewServiceTask) => Result;
  deleteServiceTask: (id: string) => Result;
  completeServiceTask: (
    task: ServiceTask,
    asset: Asset,
    details: { performedBy?: string; notes?: string },
  ) => Result;
};

const StoreContext = createContext<StoreValue | null>(null);

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProfile = (r: any): Profile => ({
  id: r.id,
  displayName: r.display_name,
  workType: r.work_type,
  modules: r.modules ?? [],
});
const toProperty = (r: any): Property => ({
  id: r.id,
  name: r.name,
  address: r.address,
  kind: r.kind,
  tenantName: r.tenant_name,
  tenantContact: r.tenant_contact,
  monthlyRent: r.monthly_rent === null ? null : Number(r.monthly_rent),
  notes: r.notes,
});
const toPropertyTask = (r: any): MaintenanceTask => ({
  id: r.id,
  propertyId: r.property_id,
  name: r.name,
  intervalDays: r.interval_days,
  lastDoneDate: r.last_done_date,
  notes: r.notes,
});
const toPropertyLog = (r: any): MaintenanceLog => ({
  id: r.id,
  propertyId: r.property_id,
  taskId: r.task_id,
  taskName: r.task_name,
  performedBy: r.performed_by,
  performedAt: r.performed_at,
  cost: r.cost === null ? null : Number(r.cost),
  notes: r.notes,
});
const toAsset = (r: any): Asset => ({
  id: r.id,
  name: r.name,
  serial: r.serial,
  kind: r.kind,
  currentHours: Number(r.current_hours),
  hoursUpdatedAt: r.hours_updated_at,
});
const toServiceTask = (r: any): ServiceTask => ({
  id: r.id,
  assetId: r.asset_id,
  name: r.name,
  intervalHours: r.interval_hours === null ? null : Number(r.interval_hours),
  intervalDays: r.interval_days,
  lastDoneHours: Number(r.last_done_hours),
  lastDoneDate: r.last_done_date,
});
const toServiceLog = (r: any): ServiceLog => ({
  id: r.id,
  assetId: r.asset_id,
  taskId: r.task_id,
  taskName: r.task_name,
  performedBy: r.performed_by,
  performedAt: r.performed_at,
  hoursAtService: r.hours_at_service === null ? null : Number(r.hours_at_service),
  notes: r.notes,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [data, setData] = useState<Data>(empty);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(empty);
      setReady(true);
      return;
    }
    // Make sure this user has a profile row (first sign-in).
    await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

    const [pr, p, pt, pl, a, st, sl] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('properties').select('*').order('name'),
      supabase.from('maintenance_tasks').select('*').order('name'),
      supabase.from('maintenance_logs').select('*').order('performed_at', { ascending: false }),
      supabase.from('assets').select('*').order('name'),
      supabase.from('service_tasks').select('*').order('name'),
      supabase.from('service_logs').select('*').order('performed_at', { ascending: false }),
    ]);
    const failed = [pr, p, pt, pl, a, st, sl].some((r) => r.error);
    if (!failed) {
      setData({
        profile: pr.data ? toProfile(pr.data) : null,
        properties: (p.data ?? []).map(toProperty),
        propertyTasks: (pt.data ?? []).map(toPropertyTask),
        propertyLogs: (pl.data ?? []).map(toPropertyLog),
        assets: (a.data ?? []).map(toAsset),
        serviceTasks: (st.data ?? []).map(toServiceTask),
        serviceLogs: (sl.data ?? []).map(toServiceLog),
      });
    }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    setReady(false);
    refresh();
  }, [refresh]);

  /** Await a Supabase write, reload data, and return an error message or null. */
  const run = useCallback(
    async (action: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await action;
      if (error) return error.message;
      await refresh();
      return null;
    },
    [refresh],
  );

  /* ----- Home & Rentals ----- */

  const addProperty = useCallback(
    (p: NewProperty) =>
      run(
        supabase.from('properties').insert({
          name: p.name,
          address: p.address || null,
          kind: p.kind,
          tenant_name: p.tenantName || null,
          tenant_contact: p.tenantContact || null,
          monthly_rent: p.monthlyRent ?? null,
          notes: p.notes || null,
        }),
      ),
    [run],
  );

  const deleteProperty = useCallback(
    (id: string) => run(supabase.from('properties').delete().eq('id', id)),
    [run],
  );

  const addPropertyTask = useCallback(
    (propertyId: string, name: string, intervalDays: number | null) =>
      run(
        supabase
          .from('maintenance_tasks')
          .insert({ property_id: propertyId, name, interval_days: intervalDays }),
      ),
    [run],
  );

  const deletePropertyTask = useCallback(
    (id: string) => run(supabase.from('maintenance_tasks').delete().eq('id', id)),
    [run],
  );

  const completePropertyTask = useCallback(
    async (
      task: MaintenanceTask,
      details: { performedBy?: string; cost?: number; notes?: string },
    ) => {
      const now = new Date().toISOString();
      const ins = await supabase.from('maintenance_logs').insert({
        property_id: task.propertyId,
        task_id: task.id,
        task_name: task.name,
        performed_by: details.performedBy || null,
        performed_at: now,
        cost: details.cost ?? null,
        notes: details.notes || null,
      });
      if (ins.error) return ins.error.message;
      return run(
        supabase.from('maintenance_tasks').update({ last_done_date: now }).eq('id', task.id),
      );
    },
    [run],
  );

  /* ----- Service ----- */

  const addAsset = useCallback(
    (a: NewAsset) =>
      run(
        supabase.from('assets').insert({
          name: a.name,
          serial: a.serial || null,
          kind: a.kind,
          current_hours: a.currentHours,
        }),
      ),
    [run],
  );

  const deleteAsset = useCallback(
    (id: string) => run(supabase.from('assets').delete().eq('id', id)),
    [run],
  );

  const updateHours = useCallback(
    async (assetId: string, hours: number) => {
      const asset = data.assets.find((a) => a.id === assetId);
      if (!asset) return 'Equipment not found.';
      if (!Number.isFinite(hours) || hours < 0) return 'Enter a valid number of hours.';
      if (hours < asset.currentHours) {
        return `Hours cannot be lower than the current reading (${asset.currentHours}).`;
      }
      return run(
        supabase
          .from('assets')
          .update({ current_hours: hours, hours_updated_at: new Date().toISOString() })
          .eq('id', assetId),
      );
    },
    [data.assets, run],
  );

  const addServiceTask = useCallback(
    (t: NewServiceTask) => {
      const asset = data.assets.find((a) => a.id === t.assetId);
      return run(
        supabase.from('service_tasks').insert({
          asset_id: t.assetId,
          name: t.name,
          interval_hours: t.intervalHours,
          interval_days: t.intervalDays,
          last_done_hours: asset?.currentHours ?? 0,
        }),
      );
    },
    [data.assets, run],
  );

  const deleteServiceTask = useCallback(
    (id: string) => run(supabase.from('service_tasks').delete().eq('id', id)),
    [run],
  );

  const completeServiceTask = useCallback(
    async (
      task: ServiceTask,
      asset: Asset,
      details: { performedBy?: string; notes?: string },
    ) => {
      const now = new Date().toISOString();
      const ins = await supabase.from('service_logs').insert({
        asset_id: task.assetId,
        task_id: task.id,
        task_name: task.name,
        performed_by: details.performedBy || null,
        performed_at: now,
        hours_at_service: asset.currentHours,
        notes: details.notes || null,
      });
      if (ins.error) return ins.error.message;
      return run(
        supabase
          .from('service_tasks')
          .update({ last_done_date: now, last_done_hours: asset.currentHours })
          .eq('id', task.id),
      );
    },
    [run],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      ready,
      refresh,
      addProperty,
      deleteProperty,
      addPropertyTask,
      deletePropertyTask,
      completePropertyTask,
      addAsset,
      deleteAsset,
      updateHours,
      addServiceTask,
      deleteServiceTask,
      completeServiceTask,
    }),
    [
      data,
      ready,
      refresh,
      addProperty,
      deleteProperty,
      addPropertyTask,
      deletePropertyTask,
      completePropertyTask,
      addAsset,
      deleteAsset,
      updateHours,
      addServiceTask,
      deleteServiceTask,
      completeServiceTask,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
