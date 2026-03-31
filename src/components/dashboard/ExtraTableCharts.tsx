import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot,
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

const PulseDot = ({ cx, cy, color }: { cx: number; cy: number; color: string }) => (
  <g>
    <circle cx={cx} cy={cy} r="10" fill={color} opacity={0.2}>
      <animate attributeName="r" from="6" to="16" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx={cx} cy={cy} r="5" fill={color} stroke="white" strokeWidth={2.5} />
  </g>
);

interface Props {
  table: ExtraTableWithData;
  isLight: boolean;
  axisColor: string;
  selectedCity?: string | null;
  selectedMonth?: string | null;
}

export default function ExtraTableCharts({ table, isLight, axisColor, selectedCity, selectedMonth }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const gridStroke = isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)";

  const filteredRows = useMemo(() => {
    let rows = table.rows;
    if (selectedCity) rows = rows.filter(r => r.city === selectedCity);
    if (selectedMonth) rows = rows.filter(r => r.month === selectedMonth);
    return rows;
  }, [table.rows, selectedCity, selectedMonth]);

  const hasMonths = filteredRows.some(r => r.month);
  const hasCities = filteredRows.some(r => r.city);

  const col = table.columns[activeTab];
  const color = CHART_COLORS[activeTab % CHART_COLORS.length];
  const gradId = `grad-tab-${table.id}-${activeTab}`;

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    table.columns.forEach(c => {
      t[c.key] = filteredRows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0);
    });
    return t;
  }, [filteredRows, table.columns]);

  const monthData = useMemo(
    () => col && hasMonths ? aggregateByMonth(filteredRows, col.key) : [],
    [filteredRows, col, hasMonths],
  );
  const cityData = useMemo(
    () => col && hasCities ? aggregateByCity(filteredRows, col.key) : [],
    [filteredRows, col, hasCities],
  );

  const maxMonth = useMemo(() => {
    if (!monthData.length) return null;
    return monthData.reduce((max, d) => d.value > max.value ? d : max, monthData[0]);
  }, [monthData]);

  if (table.loading) {
    return (
      <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
        <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка графиков...</div>
      </div>
    );
  }

  if (!hasMonths && !hasCities) return null;
  if (table.rows.length === 0 || !col) return null;

  const totalAllCols = Object.values(totals).reduce((s, v) => s + v, 0);
  if (totalAllCols <= 0) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {table.columns.map((c, i) => {
          const tabColor = CHART_COLORS[i % CHART_COLORS.length];
          const isActive = i === activeTab;
          const total = totals[c.key] || 0;
          return (
            <button
              key={c.key}
              onClick={() => setActiveTab(i)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
              style={{
                background: isActive ? tabColor : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                color: isActive ? "#fff" : isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)",
                boxShadow: isActive ? `0 4px 24px ${tabColor}50` : "none",
                transform: isActive ? "scale(1.05)" : "scale(1)",
              }}
            >
              {c.label}
              <span
                className="text-xs font-normal opacity-70 tabular-nums"
                style={{ color: isActive ? "rgba(255,255,255,0.75)" : undefined }}
              >
                {total.toLocaleString("ru-RU")}
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={activeTab}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        style={{ animation: "fadeSlideIn 0.35s ease-out" }}
      >
        {hasMonths && monthData.length > 0 && (
          <div>
            <p className="text-sm mb-4 font-medium" style={{ color: "var(--text-secondary)" }}>
              {col.label} — в разрезе месяцев
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={monthData} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                  <filter id={`glow-${table.id}`}>
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-45}
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
                  strokeWidth={3}
                  fill={`url(#${gradId})`}
                  dot={{ r: 4, fill: color, stroke: "white", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: color, stroke: "white", strokeWidth: 2.5 }}
                  style={{ filter: `url(#glow-${table.id})` }}
                />
                {maxMonth && maxMonth.value > 0 && (
                  <ReferenceDot
                    x={maxMonth.month}
                    y={maxMonth.value}
                    shape={(props: Record<string, number>) => <PulseDot cx={props.cx} cy={props.cy} color={color} />}
                  />
                )}
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
                <defs>
                  <linearGradient id={`bar-grad-${table.id}-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="city"
                  tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-55}
                  textAnchor="end"
                  interval={0}
                  height={100}
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
                  fill={`url(#bar-grad-${table.id}-${activeTab})`}
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