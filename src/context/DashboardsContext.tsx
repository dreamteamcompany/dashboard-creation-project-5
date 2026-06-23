import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { MANAGE_DASHBOARDS_URL, type DashboardConfig } from "@/config/dashboards";

interface DashboardsContextValue {
  dashboards: DashboardConfig[];
  loading: boolean;
  reload: () => void;
  create: (payload: Omit<DashboardConfig, "id"> & { rows?: Record<string, string | number>[] }) => Promise<DashboardConfig>;
  update: (id: number, payload: Partial<Omit<DashboardConfig, "id">>) => Promise<DashboardConfig>;
  remove: (id: number) => Promise<void>;
}

const DashboardsContext = createContext<DashboardsContextValue | null>(null);

export function DashboardsProvider({ children }: { children: ReactNode }) {
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);

    const fetchWithTimeout = async (ms: number) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      try {
        const r = await fetch(MANAGE_DASHBOARDS_URL, { signal: ctrl.signal });
        return await r.json();
      } finally {
        clearTimeout(t);
      }
    };

    (async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const data = await fetchWithTimeout(10000);
          if (Array.isArray(data)) {
            setDashboards(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Failed to load dashboards (attempt " + (attempt + 1) + ")", e);
        }
      }
      setDashboards([]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: Omit<DashboardConfig, "id"> & { rows?: Record<string, string | number>[] }) => {
    const res = await fetch(MANAGE_DASHBOARDS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await res.json();
    setDashboards(prev => [...prev, created]);
    return created;
  };

  const update = async (id: number, payload: Partial<Omit<DashboardConfig, "id">>) => {
    const res = await fetch(`${MANAGE_DASHBOARDS_URL}?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    setDashboards(prev => prev.map(d => d.id === id ? updated : d));
    return updated;
  };

  const remove = async (id: number) => {
    await fetch(`${MANAGE_DASHBOARDS_URL}?id=${id}`, { method: "DELETE" });
    setDashboards(prev => prev.filter(d => d.id !== id));
  };

  return (
    <DashboardsContext.Provider value={{ dashboards, loading, reload: load, create, update, remove }}>
      {children}
    </DashboardsContext.Provider>
  );
}

export function useDashboards() {
  const ctx = useContext(DashboardsContext);
  if (!ctx) throw new Error("useDashboards must be used inside DashboardsProvider");
  return ctx;
}