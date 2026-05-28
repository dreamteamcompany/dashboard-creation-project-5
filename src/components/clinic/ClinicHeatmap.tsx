import { useMemo } from "react";
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

interface SingleHeatmapProps {
  type: ClinicErrorType;
  cities: string[];
  months: string[];
  map: Record<string, Record<string, CityMonthCell>>;
  onCityClick?: (city: string) => void;
}

function SingleTypeHeatmap({ type, cities, months, map, onCityClick }: SingleHeatmapProps) {
  const color = TYPE_COLORS[type];

  const typeMax = useMemo(() => {
    let mx = 0;
    cities.forEach(city => {
      months.forEach(m => {
        const v = map[city]?.[m]?.types[type] || 0;
        if (v > mx) mx = v;
      });
    });
    return mx;
  }, [cities, months, map, type]);

  const grandTotal = useMemo(() => {
    let s = 0;
    cities.forEach(city => {
      months.forEach(m => {
        s += map[city]?.[m]?.types[type] || 0;
      });
    });
    return s;
  }, [cities, months, map, type]);

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 border"
      style={{
        background: hexToRgba(color, 0.04),
        borderColor: hexToRgba(color, 0.18),
      }}
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: hexToRgba(color, 0.18) }}
          >
            <Icon name="Building2" size={18} style={{ color }} />
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-base">
              Отдел: {type}
            </h4>
            <p className="text-white/40 text-xs">Ошибки по городам и месяцам</p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="font-display text-xl font-bold tabular-nums"
            style={{ color }}
          >
            {grandTotal.toLocaleString("ru-RU")}
          </p>
          <p className="text-white/40 text-[10px] uppercase tracking-wide">
            всего по отделу
          </p>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs border-separate" style={{ borderSpacing: "3px" }}>
          <thead>
            <tr>
              <th
                className="text-left text-white/40 font-medium px-2 sticky left-0 z-10"
                style={{ background: "var(--page-bg, #0a0812)" }}
              >
                Город
              </th>
              {months.map(m => (
                <th
                  key={m}
                  className="text-white/40 font-medium px-1 text-center min-w-[48px]"
                >
                  {m.slice(0, 3)}
                </th>
              ))}
              <th className="text-white/40 font-medium px-2 text-right">Итого</th>
            </tr>
          </thead>
          <tbody>
            {cities.map(city => {
              const rowTotal = months.reduce(
                (s, m) => s + (map[city]?.[m]?.types[type] || 0),
                0,
              );
              return (
                <tr key={city}>
                  <td
                    className={`px-2 py-1.5 text-white/80 font-medium whitespace-nowrap sticky left-0 z-10 ${onCityClick ? "cursor-pointer hover:text-white" : ""}`}
                    style={{ background: "var(--page-bg, #0a0812)" }}
                    onClick={onCityClick ? () => onCityClick(city) : undefined}
                  >
                    {city}
                  </td>
                  {months.map(m => {
                    const v = map[city]?.[m]?.types[type] || 0;
                    return (
                      <td
                        key={m}
                        className="text-center rounded-md transition-all duration-200 hover:scale-110"
                        style={{
                          background: colorForType(v, typeMax, type),
                          minWidth: 48,
                          height: 34,
                        }}
                        title={`${city} · ${m} · ${type}: ${v}`}
                      >
                        <span className="text-[11px] font-semibold text-white/95">
                          {v || ""}
                        </span>
                      </td>
                    );
                  })}
                  <td
                    className="px-2 text-right font-bold tabular-nums"
                    style={{ color: rowTotal > 0 ? color : "rgba(255,255,255,0.3)" }}
                  >
                    {rowTotal.toLocaleString("ru-RU")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-white/40">
        <span>0</span>
        <div className="flex gap-0.5">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(r => (
            <div
              key={r}
              className="w-5 h-2.5 rounded"
              style={{ background: colorForType(typeMax * r, typeMax, type) }}
            />
          ))}
        </div>
        <span>{typeMax}</span>
      </div>
    </div>
  );
}

export default function ClinicHeatmap({ cities, months, cells, onCityClick }: Props) {
  const map: Record<string, Record<string, CityMonthCell>> = useMemo(() => {
    const m: Record<string, Record<string, CityMonthCell>> = {};
    cells.forEach(c => {
      m[c.city] = m[c.city] || {};
      m[c.city][c.month] = c;
    });
    return m;
  }, [cells]);

  if (cities.length === 0 || months.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">
            Тепловая карта Город × Месяц
          </h3>
          <p className="text-white/40 text-xs">
            Отдельная карта на каждый отдел — Бухгалтерия, Фин, Сервис
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="Grid3x3" size={18} />
        </div>
      </div>

      <div className="space-y-5">
        {ALL_TYPES.map(t => (
          <SingleTypeHeatmap
            key={t}
            type={t}
            cities={cities}
            months={months}
            map={map}
            onCityClick={onCityClick}
          />
        ))}
      </div>
    </div>
  );
}
