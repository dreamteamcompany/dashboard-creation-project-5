import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
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

interface ColInfo {
  key: string;
  label: string;
  color: string;
  yAxisId: "left" | "right";
}

function classifyColumns(columns: { key: string; label: string }[]): { cols: ColInfo[]; hasRight: boolean } {
  const cols: ColInfo[] = columns.map((col, i) => {
    const l = col.label.toLowerCase();
    const isRight = l.includes("цена") || l.includes("стоимость") || l.includes("сумм") || l.includes("процент") || l.includes("%");
    return {
      key: col.key,
      label: col.label,
      color: CHART_COLORS[i % CHART_COLORS.length],
      yAxisId: isRight ? "right" as const : "left" as const,
    };
  });
  const hasRight = cols.some(c => c.yAxisId === "right");
  return { cols, hasRight };
}

function aggregateByMonth(rows: ExtraRow[], colKeys: string[]) {
  const map: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    const m = r.month || "—";
    if (!map[m]) map[m] = {};
    colKeys.forEach(k => {
      map[m][k] = (map[m][k] || 0) + (Number(r[k]) || 0);
    });
  });
  return MONTHS_ORDER
    .filter(m => map[m])
    .map(m => ({ month: m, ...map[m] }));
}

function aggregateByCity(rows: ExtraRow[], colKeys: string[]) {
  const map: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    const c = r.city || "—";
    if (!map[c]) map[c] = {};
    colKeys.forEach(k => {
      map[c][k] = (map[c][k] || 0) + (Number(r[k]) || 0);
    });
  });
  return Object.entries(map)
    .map(([city, vals]) => ({ city, ...vals }))
    .sort((a, b) => {
      const ta = colKeys.reduce((s, k) => s + (Number(a[k]) || 0), 0);
      const tb = colKeys.reduce((s, k) => s + (Number(b[k]) || 0), 0);
      return tb - ta;
    });
}

interface Props {
  table: ExtraTableWithData;
  isLight: boolean;
  axisColor: string;
}

export default function ExtraTableCharts({ table, isLight, axisColor }: Props) {
  const { cols, hasRight } = useMemo(() => classifyColumns(table.columns), [table.columns]);
  const allKeys = useMemo(() => cols.map(c => c.key), [cols]);
  const hasMonths = table.rows.some(r => r.month);
  const hasCities = table.rows.some(r => r.city);
  const gridStroke = isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)";

  const monthData = useMemo(
    () => hasMonths ? aggregateByMonth(table.rows, allKeys) : [],
    [table.rows, allKeys, hasMonths],
  );
  const cityData = useMemo(
    () => hasCities ? aggregateByCity(table.rows, allKeys) : [],
    [table.rows, allKeys, hasCities],
  );

  if (table.loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка графиков...</div>
      </div>
    );
  }

  if (!hasMonths && !hasCities) return null;
  if (table.rows.length === 0) return null;

  const leftCols = cols.filter(c => c.yAxisId === "left");
  const rightCols = cols.filter(c => c.yAxisId === "right");
  const leftLabel = leftCols.map(c => c.label).join(", ");
  const rightLabel = rightCols.map(c => c.label).join(", ");

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      <div className="mb-5">
        <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
          {table.title} — аналитика
        </h3>
        {hasRight && (
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Левая ось: {leftLabel} · Правая ось: {rightLabel}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasMonths && monthData.length > 0 && (
          <div>
            <p className="text-sm mb-4 font-medium" style={{ color: "var(--text-secondary)" }}>
              В разрезе месяцев
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={monthData} margin={{ top: 10, right: hasRight ? 15 : 20, left: 15, bottom: 5 }}>
                <defs>
                  {cols.map((col, i) => (
                    <linearGradient key={i} id={`grad-month-${table.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={col.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={col.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
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
                  yAxisId="left"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                  width={60}
                />
                {hasRight && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                    width={70}
                  />
                )}
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                {cols.map((col, i) => (
                  <Area
                    key={col.key}
                    yAxisId={hasRight ? col.yAxisId : "left"}
                    type="monotone"
                    dataKey={col.key}
                    name={col.label}
                    stroke={col.color}
                    strokeWidth={2.5}
                    fill={`url(#grad-month-${table.id}-${i})`}
                    fillOpacity={1}
                    dot={{ r: 4, fill: col.color, stroke: "white", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: col.color, stroke: "white", strokeWidth: 2 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasCities && cityData.length > 0 && (
          <div>
            <p className="text-sm mb-4 font-medium" style={{ color: "var(--text-secondary)" }}>
              По городам (итого)
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={cityData} margin={{ top: 10, right: hasRight ? 15 : 20, left: 15, bottom: 5 }}>
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
                  yAxisId="left"
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                  width={60}
                />
                {hasRight && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                    width={70}
                  />
                )}
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                {cols.map((col) => (
                  <Bar
                    key={col.key}
                    yAxisId={hasRight ? col.yAxisId : "left"}
                    dataKey={col.key}
                    name={col.label}
                    fill={col.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
