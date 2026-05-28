import Icon from "@/components/ui/icon";
import type { WorstPair } from "./useClinicStats";
import { TYPE_COLORS } from "./types";

interface Props {
  forecast: number | null;
  forecastDirection: "up" | "down" | "flat";
  lastValue: number | null;
  worstPair: WorstPair | null;
}

export default function ClinicForecast({ forecast, forecastDirection, lastValue, worstPair }: Props) {
  const dirIcon = forecastDirection === "up" ? "TrendingUp" : forecastDirection === "down" ? "TrendingDown" : "Minus";
  const dirColor = forecastDirection === "up" ? "text-red-400" : forecastDirection === "down" ? "text-emerald-400" : "text-white/50";
  const dirLabel = forecastDirection === "up" ? "Рост" : forecastDirection === "down" ? "Снижение" : "Стабильно";
  const deltaPct = forecast != null && lastValue && lastValue > 0
    ? ((forecast - lastValue) / lastValue) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="glass rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,191,255,0.2), transparent 70%)", filter: "blur(30px)" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Прогноз на след. месяц</h3>
              <p className="text-white/40 text-xs">Среднее по последним 3 месяцам</p>
            </div>
            <div className="w-9 h-9 rounded-xl gradient-cyan flex items-center justify-center">
              <Icon name="Sparkles" size={18} />
            </div>
          </div>

          {forecast != null ? (
            <div className="flex items-end gap-4">
              <div>
                <p className="text-5xl font-black text-gradient-cyan">{forecast.toLocaleString("ru-RU")}</p>
                <p className="text-white/40 text-xs mt-1">ожидаемых ошибок</p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 ${dirColor}`}>
                <Icon name={dirIcon} size={14} />
                <span className="text-xs font-bold">{dirLabel}</span>
                {lastValue && lastValue > 0 && (
                  <span className="text-xs font-bold ml-1">
                    {deltaPct > 0 ? "+" : ""}{deltaPct.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm py-6">Недостаточно данных для прогноза. Нужно минимум 2 месяца.</p>
          )}

          {lastValue != null && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/40">Текущий месяц</span>
              <span className="text-white font-bold">{lastValue.toLocaleString("ru-RU")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.2), transparent 70%)", filter: "blur(30px)" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Точка боли</h3>
              <p className="text-white/40 text-xs">Худшая пара «город + причина»</p>
            </div>
            <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center">
              <Icon name="Target" size={18} />
            </div>
          </div>

          {worstPair ? (
            <div>
              <div className="flex items-baseline gap-3 mb-3">
                <p className="text-5xl font-black text-gradient-pink">{worstPair.value.toLocaleString("ru-RU")}</p>
                <p className="text-white/40 text-xs">ошибок</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
                  <Icon name="MapPin" size={14} className="text-white/40" />
                  <span className="text-white font-bold flex-1">{worstPair.city}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
                  <Icon name="AlertCircle" size={14} className="text-white/40" />
                  <span className="text-white font-bold flex-1">{worstPair.reason}</span>
                  {worstPair.type && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `${TYPE_COLORS[worstPair.type]}25`, color: TYPE_COLORS[worstPair.type] }}>
                      {worstPair.type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm py-6">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
}
