import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { DASHBOARD_ID, fmtMoney } from "./VyrabotkaUtils";

interface DashRow {
  id: number;
  city: string;
  raskhod_uk: number;
  raskhod_city: number;
  [key: string]: unknown;
}

interface CityDiff {
  city: string;
  uk: number;
  cityVal: number;
  diff: number;
}

export default function RaskhozhdenieDiffBlock() {
  const [rows, setRows] = useState<CityDiff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rawRows: DashRow[] = await fetch(
          `${funcUrls["dashboard-data"]}?dashboard_id=${DASHBOARD_ID}`,
        ).then(r => r.json());

        const cityMap: Record<string, CityDiff> = {};
        rawRows.forEach(r => {
          const sep = r.city.lastIndexOf(" — ");
          const cityName = sep !== -1 ? r.city.substring(0, sep) : r.city;
          if (!cityMap[cityName]) cityMap[cityName] = { city: cityName, uk: 0, cityVal: 0, diff: 0 };
          cityMap[cityName].uk += Number(r.raskhod_uk) || 0;
          cityMap[cityName].cityVal += Number(r.raskhod_city) || 0;
        });
        const mapped = Object.values(cityMap).map(c => ({
          ...c,
          diff: c.uk - c.cityVal,
        }));
        setRows(mapped);
      } catch (e) {
        console.error("Failed to load raskhozhdenie diff", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
    [rows],
  );

  const maxAbs = useMemo(
    () => sorted.reduce((m, r) => Math.max(m, Math.abs(r.diff)), 0),
    [sorted],
  );

  const totals = useMemo(() => {
    const uk = rows.reduce((s, r) => s + r.uk, 0);
    const cityVal = rows.reduce((s, r) => s + r.cityVal, 0);
    return { uk, cityVal, diff: uk - cityVal };
  }, [rows]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
          Загрузка...
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">
            Разница расхождений
          </h3>
          <p className="text-white/40 text-xs">Расхождение УК минус Расхождение города</p>
        </div>
        <div className="text-right">
          <p
            className="font-display text-xl font-bold tabular-nums"
            style={{ color: totals.diff >= 0 ? "#00CC44" : "#E50000" }}
          >
            {(totals.diff >= 0 ? "+" : "") + fmtMoney(totals.diff)}
          </p>
          <p className="text-white/40 text-[10px] uppercase tracking-wide">суммарно</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {sorted.map(r => {
          const pos = r.diff >= 0;
          const color = pos ? "#00CC44" : "#E50000";
          const widthPct = maxAbs > 0 ? (Math.abs(r.diff) / maxAbs) * 100 : 0;
          return (
            <div key={r.city} className="flex items-center gap-3">
              <div className="w-24 sm:w-32 shrink-0 text-white/80 text-sm font-medium truncate" title={r.city}>
                {r.city}
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-7 rounded-lg bg-white/[0.04] overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center"
                    style={{
                      width: `${Math.max(widthPct, 4)}%`,
                      background: `linear-gradient(90deg, ${color}66, ${color}cc)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 gap-3 text-[10px] text-white/50 pointer-events-none">
                    <span>УК: {fmtMoney(r.uk)}</span>
                    <span>Город: {fmtMoney(r.cityVal)}</span>
                  </div>
                </div>
              </div>
              <div
                className="w-28 shrink-0 text-right font-bold tabular-nums text-sm"
                style={{ color }}
              >
                {(pos ? "+" : "") + fmtMoney(r.diff)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <Icon name="GitCompareArrows" size={14} />
          <span>{rows.length} городов</span>
        </div>
        <div className="flex items-center gap-4">
          <span>УК: {fmtMoney(totals.uk)}</span>
          <span>Город: {fmtMoney(totals.cityVal)}</span>
        </div>
      </div>
    </div>
  );
}