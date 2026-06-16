import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import Icon from "@/components/ui/icon";
import {
  type CityData,
  MONTH_LABELS,
  COLORS,
  fmtShort,
  fmtFull,
} from "./VyrabotkaUtils";

interface Props {
  cd: CityData;
  activeMonths: string[];
  selectedMonth?: string | null;
  isLight: boolean;
  axisColor: string;
}

export default function CityDebtsDynamics({ cd, activeMonths, selectedMonth, isLight, axisColor }: Props) {
  // График всегда показывает весь период, выбранный месяц подсвечивается
  const months = activeMonths;
  const selIdx = selectedMonth ? activeMonths.indexOf(selectedMonth) : -1;
  const selLabel = selectedMonth ? (MONTH_LABELS[selectedMonth] || selectedMonth) : null;

  let cum = 0;
  const raw = months.map((m, i) => {
    const debt = cd.months[m]?.dolgiKlinik || 0;
    cum += debt;
    return { name: MONTH_LABELS[m] || m, debt, cum, isSel: i === selIdx };
  });

  const maxDebt = raw.length ? Math.max(...raw.map(d => d.debt)) : 0;
  // Минимальная видимая высота для ненулевых сумм, чтобы маленькие значения
  // не сливались с нулём на крупном масштабе
  const minVisible = maxDebt * 0.05;
  const data = raw.map(d => ({
    ...d,
    debtPlot: d.debt > 0 ? Math.max(d.debt, minVisible) : 0,
  }));

  const yMin = maxDebt > 0 ? -maxDebt * 0.04 : 0;
  // Итоговая сумма: за выбранный месяц или накоплено за весь период
  const selData = selIdx >= 0 ? data[selIdx] : null;
  const totalDebt = selData ? selData.debt : (data.length ? data[data.length - 1].cum : 0);
  const lastDebt = selData ? selData.debt : (data.length ? data[data.length - 1].debt : 0);
  const prevDebt = selIdx > 0 ? data[selIdx - 1].debt : (data.length > 1 ? data[data.length - 2].debt : 0);
  const growth = prevDebt > 0 ? ((lastDebt - prevDebt) / prevDebt) * 100 : (lastDebt > 0 ? 100 : 0);

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-white text-lg">Динамика роста долгов</h3>
          <p className="text-white/40 text-xs mt-0.5">{selLabel ? `Долги клиники по месяцам · ${selLabel} выделен` : "Долги клиники по месяцам за весь период"}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${growth > 0 ? "bg-[#E50000]/10 border border-[#E50000]/20" : "bg-[#00CC44]/10 border border-[#00CC44]/20"}`}>
          <Icon name={growth > 0 ? "TrendingUp" : "TrendingDown"} size={13} className={growth > 0 ? "text-[#E50000]" : "text-[#00CC44]"} />
          <span className={`text-[11px] font-semibold ${growth > 0 ? "text-[#E50000]" : "text-[#00CC44]"}`}>
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-white/40 text-xs">{selLabel ? `Долг за ${selLabel}` : "Всего долгов накоплено"}</p>
        <p className="text-2xl font-bold text-[#E50000]">{fmtFull(totalDebt)}</p>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradDebt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.bad} stopOpacity={0.4} />
              <stop offset="100%" stopColor={COLORS.bad} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => fmtShort(v)} width={70} domain={[yMin, 'auto']} />
          <Tooltip
            cursor={{ stroke: COLORS.bad, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }: { active?: boolean; payload?: Array<{ payload?: { debt?: number; cum?: number } }>; label?: string }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              if (!d) return null;
              return (
                <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 200 }}>
                  <p className="text-xs text-white/50 mb-2">{label}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS.bad }} />
                    <span className="text-white/70">За месяц:</span>
                    <span className="font-semibold text-white ml-auto">{fmtFull(d.debt || 0)}</span>
                  </div>
                </div>
              );
            }}
          />
          {selLabel && (
            <ReferenceLine x={selLabel} stroke={COLORS.bad} strokeDasharray="4 4" strokeOpacity={0.6} />
          )}
          <Area type="monotone" dataKey="debtPlot" name="За месяц" stroke={COLORS.bad} strokeWidth={3}
            fill="url(#gradDebt)"
            dot={(props: { cx?: number; cy?: number; payload?: { isSel?: boolean } }) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null) return <g />;
              const sel = payload?.isSel;
              return (
                <circle cx={cx} cy={cy} r={sel ? 7 : 4}
                  fill={sel ? "#fff" : COLORS.bad}
                  stroke={COLORS.bad} strokeWidth={sel ? 3 : 0} />
              );
            }}
            activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}