import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { ExtraTableWithData, ExtraRow } from "@/hooks/useExtraTableData";

const MONTHS_ORDER = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const CHART_COLORS = [
  "#8B5CF6", "#00BFFF", "#FF3CAC", "#00D46A", "#F59E0B",
  "#3B82F6", "#EF4444", "#06B6D4", "#A855F7", "#10B981",
];

interface TPayload { color: string; name: string; value: number }
interface TTooltip { active?: boolean; payload?: TPayload[]; label?: string }
const ChartTooltip = ({ active, payload, label }: TTooltip) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 160 }}>
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-semibold text-white ml-auto pl-2">
            {typeof p.value === "number" ? p.value.toLocaleString("ru-RU") : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function aggregateByMonth(rows: ExtraRow[], key: string) {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const m = r.month || "—";
    map[m] = (map[m] || 0) + (Number(r[key]) || 0);
  });
  return MONTHS_ORDER
    .filter(m => map[m] !== undefined)
    .map(m => ({ month: m, value: map[m] || 0 }));
}

function aggregateByCity(rows: ExtraRow[], key: string) {
  const map: Record<string, number> = {};
  rows.forEach(r => {
    const c = r.city || "—";
    map[c] = (map[c] || 0) + (Number(r[key]) || 0);
  });
  return Object.entries(map)
    .map(([city, value]) => ({ city, value }))
    .sort((a, b) => b.value - a.value);
}

interface Props {
  table: ExtraTableWithData;
  isLight: boolean;
  axisColor: string;
}

export default function ExtraTableCharts({ table, isLight, axisColor }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const hasMonths = table.rows.some(r => r.month);
  const hasCities = table.rows.some(r => r.city);
  const gridStroke = isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)";

  const col = table.columns[activeTab];
  const color = CHART_COLORS[activeTab % CHART_COLORS.length];
  const gradId = `grad-tab-${table.id}-${activeTab}`;

  const monthData = useMemo(
    () => col && hasMonths ? aggregateByMonth(table.rows, col.key) : [],
    [table.rows, col, hasMonths],
  );
  const cityData = useMemo(
    () => col && hasCities ? aggregateByCity(table.rows, col.key) : [],
    [table.rows, col, hasCities],
  );

  if (table.loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка графиков...</div>
      </div>
    );
  }

  if (!hasMonths && !hasCities) return null;
  if (table.rows.length === 0 || !col) return null;

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {table.columns.map((c, i) => {
          const tabColor = CHART_COLORS[i % CHART_COLORS.length];
          const isActive = i === activeTab;
          return (
            <button
              key={c.key}
              onClick={() => setActiveTab(i)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive ? tabColor : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                color: isActive ? "#fff" : isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)",
                boxShadow: isActive ? `0 4px 20px ${tabColor}40` : "none",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasMonths && monthData.length > 0 && (
          <div>
            <p className="text-sm mb-4 font-medium" style={{ color: "var(--text-secondary)" }}>
              {col.label} — в разрезе месяцев
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={monthData} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                  width={65}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={col.label}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#${gradId})`}
                  dot={{ r: 4, fill: color, stroke: "white", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: color, stroke: "white", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasCities && cityData.length > 0 && (
          <div>
            <p className="text-sm mb-4 font-medium" style={{ color: "var(--text-secondary)" }}>
              {col.label} — по городам (итого)
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={cityData} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="city"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                  width={65}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="value"
                  name={col.label}
                  fill={color}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
