import Icon from "@/components/ui/icon";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import type { ClinicErrorType } from "./types";
import { ALL_TYPES, TYPE_COLORS } from "./types";

interface TypeChange {
  value: number;
  prev: number;
  deltaPct: number;
}

interface Props {
  byType: Record<ClinicErrorType, number>;
  typeChange: Record<ClinicErrorType, TypeChange>;
  total: number;
}

const TYPE_ICONS: Record<ClinicErrorType, string> = {
  "Бухгалтерия": "Calculator",
  "Фин": "Banknote",
  "Сервис": "Headphones",
};

export default function ClinicDepartmentsBreakdown({ byType, typeChange, total }: Props) {
  const items = ALL_TYPES
    .map(t => ({ name: t, value: byType[t] || 0 }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const max = items[0]?.value || 1;

  // Данные для RadialBar — нормализуем к 100%
  const radialData = items.map((d, i) => ({
    name: d.name,
    value: total > 0 ? (d.value / total) * 100 : 0,
    fill: TYPE_COLORS[d.name],
    order: i,
  }));

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", filter: "blur(36px)" }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-white text-base sm:text-lg">Разбивка по отделам</h3>
            <p className="text-white/40 text-xs">Доля и динамика каждого отдела</p>
          </div>
          <div className="w-9 h-9 rounded-xl gradient-violet flex items-center justify-center"
            style={{ boxShadow: "0 8px 24px rgba(139,92,246,0.35)" }}>
            <Icon name="PieChart" size={18} className="text-white" />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-white/30 text-sm">Нет данных</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[320px_1fr] gap-6 items-center">
            {/* Радиальные бары + центральный счётчик */}
            <div className="relative w-full aspect-square max-w-[320px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="100%"
                  barSize={16}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    background={{ fill: "rgba(255,255,255,0.04)" }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center">
                <p className="text-[11px] text-white/40 uppercase tracking-wider leading-none">Всего</p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight mt-1.5 whitespace-nowrap">
                  {total.toLocaleString("ru-RU")}
                </p>
                <p className="text-[11px] text-white/40 leading-none mt-1.5">ошибок</p>
              </div>
            </div>

            {/* Карточки отделов */}
            <div className="space-y-2.5">
              {items.map((d, i) => {
                const color = TYPE_COLORS[d.name];
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                const barPct = max > 0 ? (d.value / max) * 100 : 0;
                const ch = typeChange[d.name];
                const hasDelta = ch.prev > 0;
                const medals = ["🥇", "🥈", "🥉"];

                return (
                  <div
                    key={d.name}
                    className="group relative rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                    style={{ background: `linear-gradient(90deg, ${color}10, transparent 60%)` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: `${color}20`, color }}>
                          <Icon name={TYPE_ICONS[d.name]} size={16} />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 text-xs">{medals[i]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{d.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold text-white">{d.value.toLocaleString("ru-RU")}</span>
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ background: `${color}25`, color }}
                            >
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${barPct}%`,
                                background: `linear-gradient(90deg, ${color}77, ${color})`,
                                boxShadow: `0 0 10px ${color}55`,
                              }}
                            />
                          </div>
                          {hasDelta && (
                            <span
                              className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                ch.deltaPct > 0 ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              <Icon
                                name={ch.deltaPct > 0 ? "ArrowUp" : "ArrowDown"}
                                size={10}
                              />
                              {Math.abs(ch.deltaPct).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}