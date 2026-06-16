import Icon from "@/components/ui/icon";
import type { CityTotal } from "./useClinicStats";

interface Anomaly extends CityTotal { growthPct: number }

interface Props {
  anomalies: Anomaly[];
  concentrationPct: number;
  topCities: CityTotal[];
  total: number;
}

export default function ClinicAnomalies({ anomalies, concentrationPct, topCities, total }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-white text-base sm:text-lg">Города-аномалии</h3>
            <p className="text-white/40 text-xs">Кто резко вырос vs прошлый период</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Icon name="AlertOctagon" size={18} className="text-red-400" />
          </div>
        </div>
        {anomalies.length > 0 ? (
          <div className="space-y-3">
            {anomalies.map(a => (
              <div key={a.city} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="TrendingUp" size={18} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{a.city}</p>
                  <p className="text-white/40 text-xs">{a.prev} → {a.total} ошибок</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-red-400">+{a.growthPct.toFixed(0)}%</p>
                  <p className="text-[10px] text-white/40">рост</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center min-h-[260px] py-8 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Icon name="ShieldCheck" size={44} className="text-emerald-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-white/80">Резких всплесков нет</p>
            <span className="text-xs text-white/35 max-w-[280px]">Сравнение работает для периодов «Месяц» и «Квартал»</span>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-white text-base sm:text-lg">Концентрация ошибок</h3>
            <p className="text-white/40 text-xs">Насколько неравномерна нагрузка</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Icon name="Focus" size={18} className="text-amber-400" />
          </div>
        </div>

        <div className="text-center mb-5">
          <p className="font-display text-5xl font-bold text-gradient-violet">{concentrationPct.toFixed(0)}%</p>
          <p className="text-white/50 text-sm mt-1">даёт топ-3 города</p>
        </div>

        <div className="space-y-2">
          {topCities.slice(0, 3).map((c, i) => {
            const pct = total > 0 ? (c.total / total) * 100 : 0;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={c.city}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/80 flex items-center gap-2">
                    <span>{medals[i]}</span>
                    {c.city}
                  </span>
                  <span className="text-sm font-bold text-white">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full gradient-violet" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-white/60">
          {concentrationPct > 60
            ? "⚠️ Высокая концентрация — основные ошибки сосредоточены в нескольких городах."
            : concentrationPct > 40
              ? "👌 Умеренная концентрация — есть лидеры, но проблема распределена."
              : "✅ Низкая концентрация — нагрузка равномерная по сети."}
        </div>
      </div>
    </div>
  );
}