import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import type { CityMonthCell } from "./useClinicStats";
import type { ClinicErrorType } from "./types";
import { ALL_TYPES, TYPE_COLORS } from "./types";

interface Props {
  cities: string[];
  months: string[];
  cells: CityMonthCell[];
  max: number;
  onCityClick?: (city: string) => void;
}

const TYPE_SHORT: Record<ClinicErrorType, string> = {
  "Бухгалтерия": "БУХ",
  "Фин": "ФИН",
  "Сервис": "СРВ",
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function colorForType(value: number, max: number, type: ClinicErrorType): string {
  if (value === 0) return "rgba(255,255,255,0.04)";
  const ratio = max > 0 ? value / max : 0;
  const alpha = 0.2 + ratio * 0.7;
  return hexToRgba(TYPE_COLORS[type], Math.min(alpha, 0.9));
}

export default function ClinicHeatmap({ cities, months, cells, onCityClick }: Props) {
  const [activeType, setActiveType] = useState<ClinicErrorType | "all">("all");
  const visibleTypes = activeType === "all" ? ALL_TYPES : [activeType];

  const map: Record<string, Record<string, CityMonthCell>> = useMemo(() => {
    const m: Record<string, Record<string, CityMonthCell>> = {};
    cells.forEach(c => {
      m[c.city] = m[c.city] || {};
      m[c.city][c.month] = c;
    });
    return m;
  }, [cells]);

  const typeMax: Record<ClinicErrorType, number> = useMemo(() => {
    const res: Record<ClinicErrorType, number> = { "Бухгалтерия": 0, "Фин": 0, "Сервис": 0 };
    cities.forEach(city => {
      months.forEach(m => {
        ALL_TYPES.forEach(t => {
          const v = map[city]?.[m]?.types[t] || 0;
          if (v > res[t]) res[t] = v;
        });
      });
    });
    return res;
  }, [cities, months, map]);

  const typeTotals: Record<ClinicErrorType, number> = useMemo(() => {
    const res: Record<ClinicErrorType, number> = { "Бухгалтерия": 0, "Фин": 0, "Сервис": 0 };
    cities.forEach(city => {
      months.forEach(m => {
        ALL_TYPES.forEach(t => {
          res[t] += map[city]?.[m]?.types[t] || 0;
        });
      });
    });
    return res;
  }, [cities, months, map]);

  if (cities.length === 0 || months.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">
            Тепловая карта Город × Месяц
          </h3>
          <p className="text-white/40 text-xs">
            {activeType === "all" ? "Три отдела в одной таблице" : `Только: ${activeType}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveType("all")}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              activeType === "all"
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:text-white/80"
            }`}
          >
            Все
          </button>
          {ALL_TYPES.map(t => {
            const active = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5"
                style={{
                  background: active ? hexToRgba(TYPE_COLORS[t], 0.25) : "rgba(255,255,255,0.05)",
                  color: active ? TYPE_COLORS[t] : "rgba(255,255,255,0.5)",
                  boxShadow: active ? `inset 0 0 0 1px ${hexToRgba(TYPE_COLORS[t], 0.5)}` : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
                {TYPE_SHORT[t]}
                <span className="tabular-nums opacity-70">{typeTotals[t].toLocaleString("ru-RU")}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs border-separate" style={{ borderSpacing: "2px" }}>
          <thead>
            <tr>
              <th
                className="text-left text-white/40 font-medium px-2 sticky left-0 z-10"
                style={{ background: "var(--page-bg, #0a0812)" }}
              >
                Город
              </th>
              <th
                className="text-left text-white/40 font-medium px-1 sticky z-10"
                style={{ background: "var(--page-bg, #0a0812)", left: 0 }}
              >
                Отдел
              </th>
              {months.map(m => (
                <th
                  key={m}
                  className="text-white/40 font-medium px-1 text-center min-w-[38px]"
                >
                  {m.slice(0, 3)}
                </th>
              ))}
              <th className="text-white/40 font-medium px-2 text-right">Σ</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((city, ci) => (
              <>
                {visibleTypes.map((t, ti) => {
                  const color = TYPE_COLORS[t];
                  const rowTotal = months.reduce(
                    (s, m) => s + (map[city]?.[m]?.types[t] || 0),
                    0,
                  );
                  return (
                    <tr
                      key={`${city}-${t}`}
                      className={ti === 0 && ci > 0 ? "border-t border-white/[0.04]" : ""}
                    >
                      {ti === 0 ? (
                        <td
                          rowSpan={visibleTypes.length}
                          className={`px-2 py-1 text-white/85 font-medium whitespace-nowrap sticky left-0 z-10 align-middle ${onCityClick ? "cursor-pointer hover:text-white" : ""}`}
                          style={{
                            background: "var(--page-bg, #0a0812)",
                            borderTop: ci > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                          }}
                          onClick={onCityClick ? () => onCityClick(city) : undefined}
                        >
                          {city}
                        </td>
                      ) : null}
                      <td
                        className="px-1.5 text-[9px] font-bold tracking-wider"
                        style={{ color }}
                        title={t}
                      >
                        {TYPE_SHORT[t]}
                      </td>
                      {months.map(m => {
                        const v = map[city]?.[m]?.types[t] || 0;
                        return (
                          <td
                            key={m}
                            className="text-center rounded transition-all duration-150 hover:scale-110"
                            style={{
                              background: colorForType(v, typeMax[t], t),
                              minWidth: 38,
                              height: 20,
                            }}
                            title={`${city} · ${m} · ${t}: ${v}`}
                          >
                            <span className="text-[10px] font-semibold text-white/95">
                              {v || ""}
                            </span>
                          </td>
                        );
                      })}
                      <td
                        className="px-2 text-right text-[11px] font-bold tabular-nums"
                        style={{ color: rowTotal > 0 ? color : "rgba(255,255,255,0.25)" }}
                      >
                        {rowTotal.toLocaleString("ru-RU")}
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 mt-3 text-[10px] text-white/40 flex-wrap">
        {ALL_TYPES.map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="text-white/50">{TYPE_SHORT[t]}</span>
            <div className="flex gap-0.5">
              {[0.2, 0.5, 0.9].map(r => (
                <div
                  key={r}
                  className="w-3 h-2 rounded-sm"
                  style={{ background: colorForType(typeMax[t] * r, typeMax[t], t) }}
                />
              ))}
            </div>
            <span className="tabular-nums">{typeMax[t]}</span>
          </div>
        ))}
        <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center ml-2">
          <Icon name="Grid3x3" size={14} />
        </div>
      </div>
    </div>
  );
}