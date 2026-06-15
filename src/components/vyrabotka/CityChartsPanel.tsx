import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  COLORS,
  fmtShort,
  CustomTooltip,
} from "./VyrabotkaUtils";

interface MonthlyDataItem {
  name: string;
  shortName: string;
  plan: number;
  fact: number;
  pct: number;
}

interface CumulativeItem {
  name: string;
  cumPlan: number;
  cumFact: number;
}

interface Props {
  monthlyData: MonthlyDataItem[];
  cumulativeData: CumulativeItem[];
  isLight: boolean;
  axisColor: string;
}

export default function CityChartsPanel({ monthlyData, cumulativeData, isLight, axisColor }: Props) {
  const filtered = monthlyData.filter(d => d.plan > 0 || d.fact > 0);

  return (
    <>
      {filtered.length > 0 && <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-white text-lg">Динамика по месяцам</h3>
            <p className="text-white/40 text-xs mt-0.5">План vs Факт · 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.plan }} />
              <span className="text-xs text-white/50">План УК</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.fact }} />
              <span className="text-xs text-white/50">Факт</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={filtered} margin={{ top: 20, right: 20, left: 10, bottom: 0 }} barCategoryGap="8%" barGap={2}>
            <defs>
              <linearGradient id="gradBarPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.plan} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.planDark} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="gradBarFact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.fact} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.factDark} stopOpacity={1} />
              </linearGradient>
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => fmtShort(v)} width={70} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)", radius: 8 }} />
            <Bar dataKey="plan" name="План УК" fill="url(#gradBarPlan)" radius={[6, 6, 0, 0]}
              label={({ x, y, width: w, value }: { x: number; y: number; width: number; value: number }) =>
                value > 0 ? (
                  <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10}>
                    {fmtShort(value)}
                  </text>
                ) : null
              }
            />
            <Bar dataKey="fact" name="Факт" radius={[6, 6, 0, 0]}
              label={({ x, y, width: w, value }: { x: number; y: number; width: number; value: number }) =>
                value > 0 ? (
                  <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="rgba(0,191,255,0.7)" fontSize={10} fontWeight={600}>
                    {fmtShort(value)}
                  </text>
                ) : null
              }
            >
              {filtered.map((entry, index) => (
                <Cell key={`fact-${index}`}
                  fill={entry.plan > 0 && entry.fact >= entry.plan ? "url(#gradBarFact)" : entry.fact > 0 ? COLORS.factDark : "transparent"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>}

      {filtered.length > 0 && <div className="grid grid-cols-1 gap-2 sm:gap-4">
        <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">% выполнения плана</h3>
            <p className="text-white/40 text-xs mt-0.5">Динамика по месяцам</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filtered} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPctAbove" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.good} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.good} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradPctBelow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.good} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.good} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `${v}%`} domain={[0, 'auto']} />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Выполнение"]}
                contentStyle={{ background: "rgba(15,10,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                itemStyle={{ color: "#fff" }} />
              <ReferenceLine y={100} stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"} strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: "100%", position: "right", fill: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)", fontSize: 11 }} />
              <Area type="natural" dataKey="pct" stroke="url(#)" strokeWidth={0} fill="url(#gradPctBelow)" tooltipType="none" />
              <Area type="natural" dataKey="pct" name="Выполнение"
                stroke={COLORS.good}
                strokeWidth={2.5}
                fill="none"
                dot={({ cx, cy, payload }: { cx: number; cy: number; payload?: { name?: string; pct?: number } }) => (
                  <circle key={`dot-${payload?.name}`} cx={cx} cy={cy} r={4}
                    fill={COLORS.good}
                    stroke={isLight ? "#fff" : "#1a1030"} strokeWidth={2} />
                )}
                activeDot={{ r: 6, strokeWidth: 2, stroke: isLight ? "#fff" : "#1a1030" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>}

    </>
  );
}