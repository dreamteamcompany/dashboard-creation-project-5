import Icon from "@/components/ui/icon";
import type { CityMonthCell } from "./useClinicStats";

interface Props {
  cities: string[];
  months: string[];
  cells: CityMonthCell[];
  max: number;
  onCityClick?: (city: string) => void;
}

function colorFor(value: number, max: number): string {
  if (value === 0) return "rgba(255,255,255,0.04)";
  const ratio = max > 0 ? value / max : 0;
  if (ratio < 0.2) return "rgba(16,185,129,0.4)";
  if (ratio < 0.4) return "rgba(245,158,11,0.4)";
  if (ratio < 0.7) return "rgba(245,158,11,0.65)";
  if (ratio < 0.9) return "rgba(239,68,68,0.6)";
  return "rgba(239,68,68,0.85)";
}

export default function ClinicHeatmap({ cities, months, cells, max, onCityClick }: Props) {
  if (cities.length === 0 || months.length === 0) return null;
  const map: Record<string, Record<string, number>> = {};
  cells.forEach(c => {
    map[c.city] = map[c.city] || {};
    map[c.city][c.month] = c.value;
  });

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">Тепловая карта Город × Месяц</h3>
          <p className="text-white/40 text-xs">Чем краснее — тем больше ошибок</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="Grid3x3" size={18} />
        </div>
      </div>
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs border-separate" style={{ borderSpacing: "3px" }}>
          <thead>
            <tr>
              <th className="text-left text-white/40 font-medium px-2 sticky left-0 z-10" style={{ background: "var(--page-bg, #0a0812)" }}>Город</th>
              {months.map(m => (
                <th key={m} className="text-white/40 font-medium px-1 text-center min-w-[44px]">{m.slice(0, 3)}</th>
              ))}
              <th className="text-white/40 font-medium px-2 text-right">Итого</th>
            </tr>
          </thead>
          <tbody>
            {cities.map(city => {
              const row = map[city] || {};
              const rowTotal = months.reduce((s, m) => s + (row[m] || 0), 0);
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
                    const v = row[m] || 0;
                    return (
                      <td key={m} className="text-center rounded-md transition-all duration-200 hover:scale-110"
                        style={{ background: colorFor(v, max), minWidth: 44, height: 32 }}
                        title={`${city} · ${m}: ${v}`}
                      >
                        <span className="text-[11px] font-semibold text-white/90">{v || ""}</span>
                      </td>
                    );
                  })}
                  <td className="px-2 text-right text-white/70 font-bold">{rowTotal.toLocaleString("ru-RU")}</td>
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
            <div key={r} className="w-5 h-2.5 rounded" style={{ background: colorFor(max * r, max) }} />
          ))}
        </div>
        <span>{max}</span>
      </div>
    </div>
  );
}
