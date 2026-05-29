import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import funcUrls from "../../../backend/func2url.json";
import { DASHBOARD_ID, fmtMoney, fmtShort, MONTHS } from "./VyrabotkaUtils";

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

interface TipPayload { value: number; }
interface TipProps { active?: boolean; payload?: TipPayload[]; label?: string; }

const Tip = ({ active, payload, label }: TipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 160 }}>
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className="text-white font-semibold">{fmtMoney(payload[0].value)}</p>
    </div>
  );
};

export default function VyrabotkaCompareBlock({ mode }: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
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
          result = result
            .filter(i => MONTHS.includes(i.name))
            .sort((a, b) => MONTHS.indexOf(a.name) - MONTHS.indexOf(b.name));
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

  const total = useMemo(() => items.reduce((s, i) => s + i.value, 0), [items]);

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
  const subtitle = mode === "city" ? "Сравнение по городам" : "Динамика по месяцам";
  const countLabel = mode === "city" ? `${items.length} городов` : `${items.length} месяцев`;
  const gradId = mode === "city" ? "gradVyrCity" : "gradVyrMonth";

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

      <ResponsiveContainer width="100%" height={360}>
        {mode === "city" ? (
          <BarChart data={items} margin={{ top: 20, right: 20, left: 10, bottom: 0 }} barCategoryGap="20%">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={1} />
                <stop offset="100%" stopColor="#6D3ACD" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={70} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtShort(v)} width={70} />
            <Tooltip content={<Tip />} cursor={{ fill: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)", radius: 8 }} />
            <Bar dataKey="value" name="Выработка на 20-е" radius={[6, 6, 0, 0]}>
              {items.map((d) => (
                <Cell key={d.name} fill={`url(#${gradId})`} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <AreaChart data={items} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#6D3ACD" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={70} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmtShort(v)} width={70} />
            <Tooltip content={<Tip />} cursor={{ stroke: "#A855F7", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="value" name="Выработка на 20-е" stroke="#A855F7" strokeWidth={2.5} fill={`url(#${gradId})`} dot={{ fill: "#A855F7", r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        )}
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <Icon name={mode === "city" ? "BarChart3" : "TrendingUp"} size={14} />
          <span>{countLabel}</span>
        </div>
        <span>Итого: {fmtMoney(total)}</span>
      </div>
    </div>
  );
}
