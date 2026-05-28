import Icon from "@/components/ui/icon";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { CityProfile } from "./useClinicStats";
import { ALL_TYPES, TYPE_COLORS } from "./types";
import CustomTooltip from "./CustomTooltip";

interface Props {
  profile: CityProfile;
  avgCity: number;
  onClose: () => void;
}

export default function ClinicCityProfile({ profile, avgCity, onClose }: Props) {
  const maxReason = profile.byReason[0]?.value || 1;
  const vsAvg = avgCity > 0 ? ((profile.total - avgCity) / avgCity) * 100 : 0;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 border border-violet-500/30" style={{ boxShadow: "0 0 40px rgba(139,92,246,0.15)" }}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gradient-violet flex items-center justify-center">
            <Icon name="MapPin" size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-xl">{profile.city}</h3>
            <p className="text-white/40 text-xs">Детальный профиль клиники</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wide">Всего</p>
          <p className="font-display text-2xl font-bold text-white">{profile.total.toLocaleString("ru-RU")}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wide">vs Среднее</p>
          <p className={`font-display text-2xl font-bold ${vsAvg > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {vsAvg > 0 ? "+" : ""}{vsAvg.toFixed(0)}%
          </p>
        </div>
        {ALL_TYPES.slice(0, 2).map(t => (
          <div key={t} className="rounded-xl p-3 text-center" style={{ background: `${TYPE_COLORS[t]}15` }}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: TYPE_COLORS[t] }}>{t}</p>
            <p className="font-display text-2xl font-bold text-white">{(profile.byType[t] || 0).toLocaleString("ru-RU")}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase font-bold mb-3">Топ причин</p>
          <div className="space-y-2">
            {profile.byReason.slice(0, 5).map(r => {
              const pct = (r.value / maxReason) * 100;
              const color = r.type ? TYPE_COLORS[r.type] : "#94a3b8";
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70 truncate">{r.label}</span>
                    <span className="text-xs font-bold" style={{ color }}>{r.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
            {profile.byReason.length === 0 && (
              <p className="text-white/30 text-sm">Нет данных по причинам</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase font-bold mb-3">Динамика месяцев</p>
          {profile.byMonth.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profile.byMonth} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`cityGrad-${profile.city}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="short" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Ошибок" stroke="#8b5cf6" strokeWidth={2}
                    fill={`url(#cityGrad-${profile.city})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/30 text-sm">Нет данных по месяцам</p>
          )}
        </div>
      </div>
    </div>
  );
}