import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { DASHBOARD_ID, fmtMoney } from "./VyrabotkaUtils";

interface DashRow {
  id: number;
  city: string;
  plan_uk: number;
  fact: number;
  [key: string]: unknown;
}

interface CityDiff {
  city: string;
  uk: number;
  cityVal: number;
  diff: number;
}

interface Props {
  selectedMonth?: string | null;
}

export default function RaskhozhdenieDiffBlock({ selectedMonth = null }: Props) {
  const [rawRows, setRawRows] = useState<DashRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data: DashRow[] = await fetch(
          `${funcUrls["dashboard-data"]}?dashboard_id=${DASHBOARD_ID}`,
        ).then(r => r.json());
        setRawRows(data);
      } catch (e) {
        console.error("Failed to load raskhozhdenie diff", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rows = useMemo<CityDiff[]>(() => {
    const cityMap: Record<string, CityDiff> = {};
    rawRows.forEach(r => {
      const sep = r.city.lastIndexOf(" — ");
      const cityName = sep !== -1 ? r.city.substring(0, sep) : r.city;
      const month = sep !== -1 ? r.city.substring(sep + 3) : null;
      if (selectedMonth && month !== selectedMonth) return;
      if (!cityMap[cityName]) cityMap[cityName] = { city: cityName, uk: 0, cityVal: 0, diff: 0 };
      cityMap[cityName].uk += Number(r.fact) || 0;
      cityMap[cityName].cityVal += Number(r.plan_uk) || 0;
    });
    return Object.values(cityMap).map(c => ({ ...c, diff: c.uk - c.cityVal }));
  }, [rawRows, selectedMonth]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.city.localeCompare(b.city, "ru")),
    [rows],
  );

  const maxVal = useMemo(
    () => sorted.reduce((m, r) => Math.max(m, r.uk, r.cityVal), 0),
    [sorted],
  );

  const UK_COLOR = "#3B82F6";
  const CITY_COLOR = "#7F00FF";
  const UK_GRADIENT = "linear-gradient(90deg, #2563EB, #60A5FA)";
  const CITY_GRADIENT = "linear-gradient(90deg, #5B00B5, #7F00FF)";
  const UK_GLOW = "0 0 20px #3B82F666, 0 0 40px #3B82F626";
  const CITY_GLOW = "0 0 20px #7F00FF66, 0 0 40px #7F00FF26";

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
            Отклонение от плана
          </h3>
          <p className="text-white/40 text-xs">Факт минус План УК</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="w-3 h-3 rounded-sm" style={{ background: UK_COLOR }} />Факт
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="w-3 h-3 rounded-sm" style={{ background: CITY_COLOR }} />План УК
            </span>
          </div>
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
          const diffColor = pos ? "#00CC44" : "#E50000";
          const ukPct = maxVal > 0 ? (r.uk / maxVal) * 100 : 0;
          const cityPct = maxVal > 0 ? (r.cityVal / maxVal) * 100 : 0;
          return (
            <div key={r.city} className="flex items-center gap-3">
              <div className="w-24 sm:w-32 shrink-0 text-white/80 text-sm font-medium truncate" title={r.city}>
                {r.city}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-7 rounded-lg bg-white/[0.04] overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{ width: `${Math.max(ukPct, r.uk > 0 ? 3 : 0)}%`, background: UK_GRADIENT, boxShadow: r.uk > 0 ? UK_GLOW : "none" }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white pointer-events-none drop-shadow">
                    Факт: {fmtMoney(r.uk)}
                  </span>
                </div>
                <div className="h-7 rounded-lg bg-white/[0.04] overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{ width: `${Math.max(cityPct, r.cityVal > 0 ? 3 : 0)}%`, background: CITY_GRADIENT, boxShadow: r.cityVal > 0 ? CITY_GLOW : "none" }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white pointer-events-none drop-shadow">
                    План УК: {fmtMoney(r.cityVal)}
                  </span>
                </div>
              </div>
              <div
                className="w-28 shrink-0 text-right font-bold tabular-nums text-sm"
                style={{ color: diffColor }}
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
          <span>Факт: {fmtMoney(totals.uk)}</span>
          <span>План УК: {fmtMoney(totals.cityVal)}</span>
        </div>
      </div>
    </div>
  );
}