import { useState, useEffect, useCallback, useMemo } from "react";
import { EXTRA_TABLES_URL } from "@/config/dashboards";
import type { ExtraTableConfig, ColumnDef } from "@/config/dashboards";

interface ExtraRow {
  id: number;
  city?: string;
  month?: string;
  [key: string]: number | string | undefined;
}

interface ExtraTableWithData extends ExtraTableConfig {
  rows: ExtraRow[];
  loading: boolean;
  totals: Record<string, number>;
}

export default function useExtraTableData(
  dashboardId?: number,
  selectedCity?: string | null,
  selectedMonth?: string | null,
) {
  const [tables, setTables] = useState<ExtraTableConfig[]>([]);
  const [tableData, setTableData] = useState<Record<number, ExtraRow[]>>({});
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingData, setLoadingData] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!dashboardId) return;
    setLoadingTables(true);
    fetch(`${EXTRA_TABLES_URL}?dashboard_id=${dashboardId}`)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const list: ExtraTableConfig[] = Array.isArray(parsed) ? parsed : [];
        setTables(list);
        list.forEach(t => {
          setLoadingData(prev => ({ ...prev, [t.id]: true }));
          fetch(`${EXTRA_TABLES_URL}?table_id=${t.id}&action=data`)
            .then(r => r.json())
            .then(d => {
              const rows = typeof d === "string" ? JSON.parse(d) : d;
              setTableData(prev => ({ ...prev, [t.id]: Array.isArray(rows) ? rows : [] }));
              setLoadingData(prev => ({ ...prev, [t.id]: false }));
            })
            .catch(() => setLoadingData(prev => ({ ...prev, [t.id]: false })));
        });
      })
      .catch(() => {})
      .finally(() => setLoadingTables(false));
  }, [dashboardId]);

  const tablesWithData: ExtraTableWithData[] = useMemo(() => {
    return tables.map(t => {
      let rows = tableData[t.id] || [];
      if (selectedCity) {
        rows = rows.filter(r => r.city === selectedCity);
      }
      if (selectedMonth) {
        rows = rows.filter(r => r.month === selectedMonth);
      }
      const totals: Record<string, number> = {};
      t.columns.forEach(col => {
        totals[col.key] = rows.reduce((sum, r) => sum + (Number(r[col.key]) || 0), 0);
      });
      return { ...t, rows, loading: loadingData[t.id] ?? true, totals };
    });
  }, [tables, tableData, loadingData, selectedCity, selectedMonth]);

  return { tablesWithData, loadingTables };
}

export type { ExtraTableWithData, ExtraRow };