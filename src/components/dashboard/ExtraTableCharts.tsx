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

interface ChartGroup {
  title: string;
  subtitle: string;
  colKeys: string[];
  colLabels: string[];
  colors: string[];
}

function buildGroups(columns: { key: string; label: string }[]): ChartGroup[] {
  const countCols: string[] = [];
  const countLabels: string[] = [];
  const moneyCols: string[] = [];
  const moneyLabels: string[] = [];
  const pctCols: string[] = [];
  const pctLabels: string[] = [];
  const otherCols: string[] = [];
  const otherLabels: string[] = [];

  columns.forEach(col => {
    const l = col.label.toLowerCase();
    if (l.includes("процент") || l.includes("%")) {
      pctCols.push(col.key);
      pctLabels.push(col.label);
    } else if (l.includes("цена") || l.includes("стоимость") || l.includes("сумм")) {
      moneyCols.push(col.key);
      moneyLabels.push(col.label);
    } else if (l.includes("пациент") || l.includes("план") || l.includes("номенклатур")) {
      countCols.push(col.key);
      countLabels.push(col.label);
    } else {
      otherCols.push(col.key);
      otherLabels.push(col.label);
    }
  });

  const groups: ChartGroup[] = [];
  let colorIdx = 0;

  if (countCols.length > 0) {
    groups.push({
      title: "Количественные показатели",
      subtitle: countLabels.join(", "),
      colKeys: countCols,
      colLabels: countLabels,
      colors: countCols.map((_, i) => CHART_COLORS[(colorIdx + i) % CHART_COLORS.length]),
    });
    colorIdx += countCols.length;
  }

  if (moneyCols.length > 0) {
    groups.push({
      title: "Стоимость",
      subtitle: moneyLabels.join(", "),
      colKeys: moneyCols,
      colLabels: moneyLabels,
      colors: moneyCols.map((_, i) => CHART_COLORS[(colorIdx + i) % CHART_COLORS.length]),
    });
    colorIdx += moneyCols.length;
  }

  if (pctCols.length > 0) {
    groups.push({
      title: "Процент снижения",
      subtitle: pctLabels.join(", "),
      colKeys: pctCols,
      colLabels: pctLabels,
      colors: pctCols.map((_, i) => CHART_COLORS[(colorIdx + i) % CHART_COLORS.length]),
    });
    colorIdx += pctCols.length;
  }

  if (otherCols.length > 0) {
    groups.push({
      title: "Прочие показатели",
      subtitle: otherLabels.join(", "),
      colKeys: otherCols,
      colLabels: otherLabels,
      colors: otherCols.map((_, i) => CHART_COLORS[(colorIdx + i) % CHART_COLORS.length]),
    });
  }

  return groups;
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
  const groups = useMemo(() => buildGroups(table.columns), [table.columns]);
  const hasMonths = table.rows.some(r => r.month);
  const hasCities = table.rows.some(r => r.city);
  const gridStroke = isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)";

  if (table.loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка графиков...</div>
      </div>
    );
  }

  if (!hasMonths && !hasCities) return null;
  if (table.rows.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => {
        const monthData = hasMonths ? aggregateByMonth(table.rows, group.colKeys) : [];
        const cityData = hasCities ? aggregateByCity(table.rows, group.colKeys) : [];
        const gradIds = group.colKeys.map((_, i) => `grad-extra-${table.id}-${gi}-${i}`);

        return (
          <div key={gi} className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="mb-5">
              <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {group.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {group.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hasMonths && monthData.length > 0 && (
                <div>
                  <p className="text-sm mb-4 font-medium" style={{ color: "var(--text-secondary)" }}>
                    В разрезе месяцев
                  </p>
                  <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={monthData} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                      <defs>
                        {group.colKeys.map((_, i) => (
                          <linearGradient key={i} id={gradIds[i]} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={group.colors[i]} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={group.colors[i]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: axisColor, fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fill: axisColor, fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                        width={70}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      {group.colKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 14 }} />}
                      {group.colKeys.map((key, i) => (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={group.colLabels[i]}
                          stroke={group.colors[i]}
                          strokeWidth={2.5}
                          fill={`url(#${gradIds[i]})`}
                          fillOpacity={0.15}
                          dot={{ r: 4, fill: group.colors[i], stroke: "white", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: group.colors[i], stroke: "white", strokeWidth: 2 }}
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
                    <BarChart data={cityData} margin={{ top: 10, right: 20, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis
                        dataKey="city"
                        tick={{ fill: axisColor, fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={80}
                      />
                      <YAxis
                        tick={{ fill: axisColor, fontSize: 13 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => Number(v).toLocaleString("ru-RU")}
                        width={70}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      {group.colKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 14 }} />}
                      {group.colKeys.map((key, i) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          name={group.colLabels[i]}
                          fill={group.colors[i]}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}