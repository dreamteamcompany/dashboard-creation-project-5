import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import type { CityMonthCell } from "./useClinicStats";
import type { ClinicErrorType, ColumnDef } from "./types";
import { ALL_TYPES, TYPE_COLORS } from "./types";

interface Props {
  cities: string[];
  months: string[];
  cells: CityMonthCell[];
  max: number;
  columns?: ColumnDef[];
  onCityClick?: (city: string) => void;
}

const TYPE_SHORT: Record<ClinicErrorType, string> = {
  "Дженерики": "ДЖЕН",
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

function colorForValue(value: number, max: number, color: string): string {
  if (value === 0) return "rgba(255,255,255,0.04)";
  const ratio = max > 0 ? value / max : 0;
  const alpha = 0.2 + ratio * 0.7;
  return hexToRgba(color, Math.min(alpha, 0.9));
}

function colorForType(value: number, max: number, type: ClinicErrorType): string {
  return colorForValue(value, max, TYPE_COLORS[type]);
}

interface HoverInfo {
  rowKey: string;
  month: string;
  city: string;
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
}

export default function ClinicHeatmap({ cities, months, cells, columns = [], onCityClick }: Props) {
  const [activeType, setActiveType] = useState<ClinicErrorType | "all">("all");
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const visibleTypes = activeType === "all" ? ALL_TYPES : [activeType];
  const showReasons = activeType !== "all";

  // Подпись причины по ключу колонки (для отображения)
  const keyToLabel = useMemo(() => {
    const m: Record<string, string> = {};
    columns.forEach(c => { m[c.key] = c.label || c.key; });
    return m;
  }, [columns]);

  // Причины выбранного отдела (ключи колонок), у которых есть хотя бы одна ошибка
  const reasonLabels: string[] = useMemo(() => {
    if (activeType === "all") return [];
    const keys = columns
      .filter(c => c.type === activeType)
      .map(c => c.key);
    const present = new Set<string>();
    cells.forEach(c => {
      Object.entries(c.reasons || {}).forEach(([key, v]) => {
        if (v > 0 && keys.includes(key)) present.add(key);
      });
    });
    return keys.filter(k => present.has(k));
  }, [activeType, columns, cells]);

  const reasonColor = activeType === "all" ? "#8b5cf6" : TYPE_COLORS[activeType];

  const map: Record<string, Record<string, CityMonthCell>> = useMemo(() => {
    const m: Record<string, Record<string, CityMonthCell>> = {};
    cells.forEach(c => {
      m[c.city] = m[c.city] || {};
      m[c.city][c.month] = c;
    });
    return m;
  }, [cells]);

  const typeMax: Record<ClinicErrorType, number> = useMemo(() => {
    const res: Record<ClinicErrorType, number> = { "Дженерики": 0, "Фин": 0, "Сервис": 0 };
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
    const res: Record<ClinicErrorType, number> = { "Дженерики": 0, "Фин": 0, "Сервис": 0 };
    cities.forEach(city => {
      months.forEach(m => {
        ALL_TYPES.forEach(t => {
          res[t] += map[city]?.[m]?.types[t] || 0;
        });
      });
    });
    return res;
  }, [cities, months, map]);

  const reasonMax = useMemo(() => {
    let res = 0;
    if (!showReasons) return 0;
    cities.forEach(city => {
      months.forEach(m => {
        reasonLabels.forEach(label => {
          const v = map[city]?.[m]?.reasons?.[label] || 0;
          if (v > res) res = v;
        });
      });
    });
    return res;
  }, [cities, months, map, reasonLabels, showReasons]);

  if (cities.length === 0 || months.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 overflow-hidden w-fit max-w-full">
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

      <div className="overflow-auto -mx-2 px-2 max-h-[70vh]" onMouseLeave={() => setHover(null)}>
        <table className="w-full text-xs border-separate" style={{ borderSpacing: "5px" }}>
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                className="text-left text-white/50 font-semibold px-2 py-2 sticky left-0 z-30 whitespace-nowrap"
                style={{ background: "var(--page-bg, #0a0812)", width: "100%", minWidth: 150 }}
              >
                Город
              </th>
              <th
                className="text-left text-white/50 font-semibold px-2 py-2 whitespace-nowrap"
                style={{ background: "var(--page-bg, #0a0812)", minWidth: 120 }}
              >
                {showReasons ? "Причина" : "Отдел"}
              </th>
              {months.map(m => {
                const isHot = hover?.month === m;
                return (
                  <th
                    key={m}
                    className="font-semibold px-2 py-2.5 text-center text-[11px] rounded-md transition-colors"
                    style={{
                      width: 96,
                      minWidth: 96,
                      background: isHot ? "rgba(255,255,255,0.08)" : "var(--page-bg, #0a0812)",
                      color: isHot ? "#fff" : "rgba(255,255,255,0.45)",
                    }}
                  >
                    {m.slice(0, 3)}
                  </th>
                );
              })}
              <th
                className="text-white/50 font-semibold px-2 py-2 text-right"
                style={{ background: "var(--page-bg, #0a0812)" }}
              >
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {showReasons
              ? cities.map((city, ci) => {
                  const rowsForCity = reasonLabels.length > 0 ? reasonLabels : [""];
                  return (
                    <>
                      {ci > 0 && (
                        <tr key={`${city}-sep`} aria-hidden>
                          <td colSpan={months.length + 3} style={{ height: 6, padding: 0 }}>
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }} />
                          </td>
                        </tr>
                      )}
                      {rowsForCity.map((label, li) => {
                        const rowKey = `${city}-${label}`;
                        const rowHot = hover?.rowKey === rowKey;
                        const rowTotal = months.reduce(
                          (s, m) => s + (map[city]?.[m]?.reasons?.[label] || 0),
                          0,
                        );
                        return (
                          <tr key={rowKey}>
                            {li === 0 ? (
                              <td
                                rowSpan={rowsForCity.length}
                                className={`px-3 py-2 text-white/85 text-[13px] font-semibold whitespace-nowrap sticky left-0 z-10 align-middle ${onCityClick ? "cursor-pointer hover:text-white" : ""}`}
                                style={{
                                  background: ci % 2 === 1 ? "rgba(255,255,255,0.02)" : "var(--page-bg, #0a0812)",
                                }}
                                onClick={onCityClick ? () => onCityClick(city) : undefined}
                              >
                                {city}
                              </td>
                            ) : null}
                            <td
                              className="px-2 text-[11px] font-medium whitespace-nowrap max-w-[220px] truncate transition-colors"
                              style={{ color: rowHot ? "#fff" : reasonColor }}
                              title={keyToLabel[label] || label}
                            >
                              {keyToLabel[label] || "—"}
                            </td>
                            {months.map(m => {
                              const v = map[city]?.[m]?.reasons?.[label] || 0;
                              const colHot = hover?.month === m;
                              const cellHot = rowHot && colHot;
                              return (
                                <td
                                  key={m}
                                  className="text-center rounded-lg transition-all duration-100 cursor-default"
                                  style={{
                                    background: colorForValue(v, reasonMax, reasonColor),
                                    width: 96,
                                    minWidth: 96,
                                    height: 34,
                                    boxShadow: cellHot
                                      ? "inset 0 0 0 1.5px rgba(255,255,255,0.9)"
                                      : (rowHot || colHot)
                                      ? "inset 0 0 0 1px rgba(255,255,255,0.25)"
                                      : undefined,
                                  }}
                                  onMouseEnter={e =>
                                    setHover({
                                      rowKey, month: m, city, label: keyToLabel[label] || label, value: v, color: reasonColor,
                                      x: e.currentTarget.getBoundingClientRect().left + e.currentTarget.offsetWidth / 2,
                                      y: e.currentTarget.getBoundingClientRect().top,
                                    })
                                  }
                                >
                                  <span className="text-[13px] font-bold text-white/95 tabular-nums">
                                    {v || ""}
                                  </span>
                                </td>
                              );
                            })}
                            <td
                              className="px-3 text-right text-[13px] font-bold tabular-nums transition-colors"
                              style={{
                                color: rowTotal > 0 ? reasonColor : "rgba(255,255,255,0.25)",
                                background: rowHot ? "rgba(255,255,255,0.06)" : undefined,
                              }}
                            >
                              {rowTotal.toLocaleString("ru-RU")}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })
              : cities.map((city, ci) => (
                  <>
                    {ci > 0 && (
                      <tr key={`${city}-sep`} aria-hidden>
                        <td colSpan={months.length + 3} style={{ height: 6, padding: 0 }}>
                          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }} />
                        </td>
                      </tr>
                    )}
                    {visibleTypes.map((t, ti) => {
                      const color = TYPE_COLORS[t];
                      const rowKey = `${city}-${t}`;
                      const rowHot = hover?.rowKey === rowKey;
                      const rowTotal = months.reduce(
                        (s, m) => s + (map[city]?.[m]?.types[t] || 0),
                        0,
                      );
                      return (
                        <tr key={rowKey}>
                          {ti === 0 ? (
                            <td
                              rowSpan={visibleTypes.length}
                              className={`px-3 py-2 text-white/85 text-[13px] font-semibold whitespace-nowrap sticky left-0 z-10 align-middle ${onCityClick ? "cursor-pointer hover:text-white" : ""}`}
                              style={{
                                background: "var(--page-bg, #0a0812)",
                              }}
                              onClick={onCityClick ? () => onCityClick(city) : undefined}
                            >
                              {city}
                            </td>
                          ) : null}
                          <td
                            className="px-2 text-[12px] font-bold whitespace-nowrap transition-colors"
                            style={{ color: rowHot ? "#fff" : color }}
                            title={t}
                          >
                            {t}
                          </td>
                          {months.map(m => {
                            const v = map[city]?.[m]?.types[t] || 0;
                            const colHot = hover?.month === m;
                            const cellHot = rowHot && colHot;
                            return (
                              <td
                                key={m}
                                className="text-center rounded-lg transition-all duration-100 cursor-default"
                                style={{
                                  background: colorForType(v, typeMax[t], t),
                                  width: 96,
                                  minWidth: 96,
                                  height: 34,
                                  boxShadow: cellHot
                                    ? "inset 0 0 0 1.5px rgba(255,255,255,0.9)"
                                    : (rowHot || colHot)
                                    ? "inset 0 0 0 1px rgba(255,255,255,0.25)"
                                    : undefined,
                                }}
                                onMouseEnter={e =>
                                  setHover({
                                    rowKey, month: m, city, label: t, value: v, color,
                                    x: e.currentTarget.getBoundingClientRect().left + e.currentTarget.offsetWidth / 2,
                                    y: e.currentTarget.getBoundingClientRect().top,
                                  })
                                }
                              >
                                <span className="text-[13px] font-bold text-white/95 tabular-nums">
                                  {v || ""}
                                </span>
                              </td>
                            );
                          })}
                          <td
                            className="px-3 text-right text-[13px] font-bold tabular-nums transition-colors"
                            style={{
                              color: rowTotal > 0 ? color : "rgba(255,255,255,0.25)",
                              background: rowHot ? "rgba(255,255,255,0.06)" : undefined,
                            }}
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

      {hover && hover.value > 0 && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-xs shadow-xl"
          style={{
            left: hover.x,
            top: hover.y - 8,
            transform: "translate(-50%, -100%)",
            background: "rgba(15,12,25,0.97)",
            border: `1px solid ${hexToRgba(hover.color, 0.5)}`,
          }}
        >
          <div className="font-semibold text-white">{hover.city}</div>
          <div className="text-white/60 mt-0.5">{hover.month}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ background: hover.color }} />
            <span className="text-white/80">{hover.label}</span>
            <span className="font-bold tabular-nums ml-1" style={{ color: hover.color }}>
              {hover.value.toLocaleString("ru-RU")}
            </span>
          </div>
        </div>
      )}

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