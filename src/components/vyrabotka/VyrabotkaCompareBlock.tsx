import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { DASHBOARD_ID, fmtMoney, MONTHS } from "./VyrabotkaUtils";

interface DashRow {
  id: number;
  city: string;
  vyrabotka_na_20e: number;
  [key: string]: unknown;
}

interface CompareItem {
  name: string;
  value: number;
}

interface Props {
  mode: "city" | "month";
}

export default function VyrabotkaCompareBlock({ mode }: Props) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rawRows: DashRow[] = await fetch(
          `${funcUrls["dashboard-data"]}?dashboard_id=${DASHBOARD_ID}`,
        ).then(r => r.json());

        const map: Record<string, number> = {};
        rawRows.forEach(r => {
          const sep = r.city.lastIndexOf(" — ");
          const cityName = sep !== -1 ? r.city.substring(0, sep) : r.city;
          const monthName = sep !== -1 ? r.city.substring(sep + 3) : "";
          const key = mode === "city" ? cityName : monthName;
          if (!key) return;
          map[key] = (map[key] || 0) + (Number(r.vyrabotka_na_20e) || 0);
        });

        let result = Object.entries(map).map(([name, value]) => ({ name, value }));
        if (mode === "month") {
          result = result.sort((a, b) => MONTHS.indexOf(a.name) - MONTHS.indexOf(b.name));
        } else {
          result = result.sort((a, b) => b.value - a.value);
        }
        setItems(result);
      } catch (e) {
        console.error("Failed to load vyrabotka compare", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mode]);

  const maxVal = useMemo(() => items.reduce((m, i) => Math.max(m, i.value), 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.value, 0), [items]);

  const GRADIENT = "linear-gradient(90deg, #6D3ACD, #A855F7)";
  const GLOW = "0 0 20px #8B5CF666, 0 0 40px #8B5CF626";

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

  const title = mode === "city" ? "Выработка на 20-е по городам" : "Выработка на 20-е по месяцам";
  const subtitle = mode === "city" ? "Сравнение по городам" : "Сравнение по месяцам";
  const countLabel = mode === "city" ? `${items.length} городов` : `${items.length} месяцев`;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">{title}</h3>
          <p className="text-white/40 text-xs">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold tabular-nums text-[#A855F7]">
            {fmtMoney(total)}
          </p>
          <p className="text-white/40 text-[10px] uppercase tracking-wide">суммарно</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {items.map(i => {
          const pct = maxVal > 0 ? (i.value / maxVal) * 100 : 0;
          return (
            <div key={i.name} className="flex items-center gap-3">
              <div className="w-24 sm:w-32 shrink-0 text-white/80 text-sm font-medium truncate" title={i.name}>
                {i.name}
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-7 rounded-lg bg-white/[0.04] overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{ width: `${Math.max(pct, i.value > 0 ? 3 : 0)}%`, background: GRADIENT, boxShadow: i.value > 0 ? GLOW : "none" }}
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white pointer-events-none drop-shadow">
                    {fmtMoney(i.value)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={14} />
          <span>{countLabel}</span>
        </div>
        <span>Итого: {fmtMoney(total)}</span>
      </div>
    </div>
  );
}