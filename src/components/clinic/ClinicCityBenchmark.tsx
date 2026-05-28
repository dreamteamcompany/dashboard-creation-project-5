import { useState } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import Icon from "@/components/ui/icon";
import type { ClinicErrorType } from "./types";
import { ALL_TYPES, TYPE_COLORS, TYPE_BG } from "./types";
import type { CityProfile, CityTotal } from "./useClinicStats";

interface Props {
  cityTotals: CityTotal[];
  cityProfiles: Record<string, CityProfile>;
  total: number;
  avgCity: number;
  onCityClick?: (city: string) => void;
}

type SortKey = "total" | "delta" | "share" | "name";

export default function ClinicCityBenchmark({
  cityTotals,
  cityProfiles,
  total,
  avgCity,
  onCityClick,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [limit, setLimit] = useState<10 | 20 | 0>(10);

  if (cityTotals.length === 0) return null;

  const enriched = cityTotals.map(c => {
    const profile = cityProfiles[c.city];
    const deltaPct = c.prev > 0 ? ((c.total - c.prev) / c.prev) * 100 : null;
    const dominant = profile
      ? (Object.entries(profile.byType) as [ClinicErrorType, number][])
          .sort((a, b) => b[1] - a[1])[0]
      : undefined;
    const dominantType = dominant && dominant[1] > 0 ? dominant[0] : null;
    const trend = profile?.byMonth.map(m => ({ v: m.total })) || [];
    const share = total > 0 ? (c.total / total) * 100 : 0;
    return { ...c, deltaPct, dominantType, trend, share };
  });

  const sorted = [...enriched].sort((a, b) => {
    if (sortKey === "total") return b.total - a.total;
    if (sortKey === "share") return b.share - a.share;
    if (sortKey === "delta") {
      const da = a.deltaPct ?? -Infinity;
      const db = b.deltaPct ?? -Infinity;
      return db - da;
    }
    return a.city.localeCompare(b.city, "ru");
  });

  const display = limit === 0 ? sorted : sorted.slice(0, limit);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
        sortKey === k
          ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
          : "bg-white/5 text-white/50 border border-white/10 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );

  const LimitBtn = ({ v, label }: { v: 10 | 20 | 0; label: string }) => (
    <button
      onClick={() => setLimit(v)}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
        limit === v
          ? "bg-white/15 text-white border border-white/20"
          : "bg-white/5 text-white/50 border border-white/10 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">
            Бенчмарк городов
          </h3>
          <p className="text-white/40 text-xs">
            Сравнение по объёму, доле, динамике и главному отделу
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="BarChart3" size={18} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40 uppercase tracking-wide mr-1">Сортировка</span>
          <SortBtn k="total" label="Всего" />
          <SortBtn k="share" label="Доля" />
          <SortBtn k="delta" label="Динамика" />
          <SortBtn k="name" label="А-Я" />
        </div>
        <div className="flex items-center gap-1.5">
          <LimitBtn v={10} label="Топ-10" />
          <LimitBtn v={20} label="Топ-20" />
          <LimitBtn v={0} label="Все" />
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-white/40 uppercase tracking-wide">
              <th className="text-left font-medium py-2 px-2">#</th>
              <th className="text-left font-medium py-2 px-2">Город</th>
              <th className="text-right font-medium py-2 px-2">Всего</th>
              <th className="text-right font-medium py-2 px-2 hidden sm:table-cell">Доля</th>
              <th className="text-center font-medium py-2 px-2">Главный отдел</th>
              <th className="text-center font-medium py-2 px-2 hidden md:table-cell">Тренд</th>
              <th className="text-right font-medium py-2 px-2">Динамика</th>
              <th className="text-center font-medium py-2 px-2 hidden lg:table-cell">vs средн.</th>
            </tr>
          </thead>
          <tbody>
            {display.map((c, idx) => {
              const rank = idx + 1;
              const isAbove = c.total > avgCity;
              const trendColor =
                c.deltaPct === null
                  ? "#71717a"
                  : c.deltaPct > 0
                    ? "#ef4444"
                    : c.deltaPct < 0
                      ? "#10b981"
                      : "#71717a";
              return (
                <tr
                  key={c.city}
                  className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-2 px-2 text-white/40 text-xs font-medium">{rank}</td>
                  <td className="py-2 px-2">
                    <button
                      onClick={onCityClick ? () => onCityClick(c.city) : undefined}
                      className={`text-white/90 font-medium truncate text-left ${
                        onCityClick ? "hover:text-violet-300 hover:underline" : ""
                      }`}
                    >
                      {c.city}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-white tabular-nums">
                    {c.total.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-2 px-2 text-right text-white/60 tabular-nums hidden sm:table-cell">
                    {c.share.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-center">
                    {c.dominantType ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${TYPE_BG[c.dominantType]}`}
                      >
                        {c.dominantType}
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 hidden md:table-cell">
                    {c.trend.length > 1 ? (
                      <div className="h-7 w-20 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={c.trend}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke={trendColor}
                              strokeWidth={1.8}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {c.deltaPct === null ? (
                      <span className="text-white/30 text-xs">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                          c.deltaPct > 0
                            ? "text-red-400"
                            : c.deltaPct < 0
                              ? "text-emerald-400"
                              : "text-white/50"
                        }`}
                      >
                        <Icon
                          name={
                            c.deltaPct > 0
                              ? "ArrowUp"
                              : c.deltaPct < 0
                                ? "ArrowDown"
                                : "Minus"
                          }
                          size={11}
                        />
                        {Math.abs(c.deltaPct).toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center hidden lg:table-cell">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isAbove
                          ? "bg-red-500/10 text-red-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {isAbove ? "выше" : "ниже"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-white/40">
        <span className="text-white/50">Легенда отделов:</span>
        {ALL_TYPES.map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[t] }} />
            <span className="text-white/60">{t}</span>
          </div>
        ))}
        <span className="ml-auto text-white/40">
          Средний город: <span className="text-white/70 font-medium">{avgCity.toFixed(0)}</span>
        </span>
      </div>
    </div>
  );
}
