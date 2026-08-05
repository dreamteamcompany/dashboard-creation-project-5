import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import {
  type CityData,
  MONTH_LABELS,
  PIE_COLORS,
  COLORS,
  fmtShort,
  fmtFull,
} from "./VyrabotkaUtils";

interface Props {
  DATA: CityData[];
  activeMonths: string[];
  selectedMonth?: string | null;
  isLight: boolean;
  axisColor: string;
}

export default function AllCitiesDebtsDynamics({ DATA, activeMonths, selectedMonth, isLight, axisColor }: Props) {
  const endIdx = selectedMonth ? activeMonths.indexOf(selectedMonth) : -1;
  const months = endIdx >= 0 ? [activeMonths[endIdx]] : activeMonths;

  const cities = DATA
    .map(d => ({
      city: d.city,
      total: months.reduce((s, m) => s + (d.months[m]?.dolgiKlinik || 0), 0),
      months: d.months,
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const data = months.map(m => {
    const row: Record<string, number | string> = { name: MONTH_LABELS[m] || m };
    cities.forEach(c => {
      row[c.city] = c.months[m]?.dolgiKlinik || 0;
    });
    return row;
  });

  const totalDebt = cities.reduce((s, c) => s + c.total, 0);

  const visibleCities = cities.filter(c => !hidden[c.city]);

  const singleMonth = months.length === 1;
  const barData = visibleCities.map(c => ({
    name: c.city,
    value: c.months[months[0]]?.dolgiKlinik || 0,
  }));

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-white text-lg">Динамика долгов по городам</h3>
          <p className="text-white/40 text-xs mt-0.5">{selectedMonth ? `Долги клиник за ${MONTH_LABELS[selectedMonth]}` : "Долги клиник по месяцам за весь период"}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E50000]/10 border border-[#E50000]/20">
          <Icon name="TrendingDown" size={13} className="text-[#E50000]" />
          <span className="text-[11px] font-semibold text-[#E50000]">{cities.length} городов</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-white/40 text-xs">Всего долгов по городам</p>
        <p className="text-2xl font-bold text-[#E50000]">{fmtFull(totalDebt)}</p>
      </div>

      {!cities.length ? (
        <div className="h-[220px] flex flex-col items-center justify-center text-center">
          <Icon name="Inbox" size={28} className="text-white/20 mb-2" />
          <p className="text-white/40 text-sm">
            {selectedMonth ? `Нет данных по долгам за ${MONTH_LABELS[selectedMonth]}` : "Нет данных по долгам"}
          </p>
        </div>
      ) : singleMonth ? (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={80} />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => fmtShort(v)} width={70} domain={[0, 'auto']} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 180 }}>
                  <p className="text-xs text-white/50 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{fmtFull(payload[0].value || 0)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {barData.map((b, i) => (
              <Cell key={i} fill={PIE_COLORS[cities.findIndex(c => c.city === b.name) % PIE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      ) : (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => fmtShort(v)} width={70} domain={[0, 'auto']} />
          <Tooltip
            cursor={{ stroke: COLORS.bad, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) => {
              if (!active || !payload?.length) return null;
              const items = payload
                .filter(p => (p.value || 0) > 0)
                .sort((a, b) => (b.value || 0) - (a.value || 0));
              if (!items.length) return (
                <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 200 }}>
                  <p className="text-xs text-white/50 mb-1">{label}</p>
                  <p className="text-sm text-white/60">Нет долгов</p>
                </div>
              );
              const sum = items.reduce((s, p) => s + (p.value || 0), 0);
              return (
                <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 220 }}>
                  <p className="text-xs text-white/50 mb-2">{label}</p>
                  {items.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                      <span className="text-white/70 truncate">{p.name}:</span>
                      <span className="font-semibold text-white ml-auto pl-2">{fmtFull(p.value || 0)}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm mt-1 pt-1 border-t border-white/10">
                    <span className="text-white/70">Итого за месяц:</span>
                    <span className="font-semibold text-white ml-auto">{fmtFull(sum)}</span>
                  </div>
                </div>
              );
            }}
          />
          {visibleCities.map((c, i) => {
            const color = PIE_COLORS[cities.indexOf(c) % PIE_COLORS.length];
            return (
              <Line key={c.city} type="monotone" dataKey={c.city} name={c.city}
                stroke={color} strokeWidth={2.5}
                dot={{ fill: color, r: 3 }} activeDot={{ r: 5 }}
                isAnimationActive={i < 8} />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {(() => {
          const allHidden = cities.every(c => hidden[c.city]);
          return (
            <button
              onClick={() => setHidden(allHidden ? {} : Object.fromEntries(cities.map(c => [c.city, true])))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${allHidden ? "bg-white/[0.03] text-white/30" : "bg-white/[0.06] text-white/70 hover:bg-white/10"}`}>
              <Icon name={allHidden ? "EyeOff" : "Eye"} size={12} />
              <span>Все</span>
            </button>
          );
        })()}
        {cities.map(c => {
          const color = PIE_COLORS[cities.indexOf(c) % PIE_COLORS.length];
          const isHidden = hidden[c.city];
          return (
            <button key={c.city}
              onClick={() => setHidden(h => ({ ...h, [c.city]: !h[c.city] }))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${isHidden ? "bg-white/[0.03] text-white/30" : "bg-white/[0.06] text-white/70 hover:bg-white/10"}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: isHidden ? "rgba(255,255,255,0.2)" : color }} />
              <span className="truncate max-w-[120px]">{c.city}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}