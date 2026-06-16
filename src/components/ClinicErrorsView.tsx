import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ColumnDef, ClinicErrorType } from "@/config/dashboards";
import type { Row, Filters } from "@/components/clinic/types";
import { ALL_TYPES, TYPE_COLORS, TYPE_TEXT } from "@/components/clinic/types";
import { useClinicStats } from "@/components/clinic/useClinicStats";
import CustomTooltip from "@/components/clinic/CustomTooltip";
import ClinicFilters from "@/components/clinic/ClinicFilters";
import ClinicDepartmentLights from "@/components/clinic/ClinicDepartmentLights";
import ClinicTopReasons from "@/components/clinic/ClinicTopReasons";
import ClinicHeatmap from "@/components/clinic/ClinicHeatmap";
import ClinicDepartmentsTrend from "@/components/clinic/ClinicDepartmentsTrend";
import ClinicCityProfile from "@/components/clinic/ClinicCityProfile";
import ClinicAnomalies from "@/components/clinic/ClinicAnomalies";
import ClinicForecast from "@/components/clinic/ClinicForecast";
import ClinicDepartmentsBreakdown from "@/components/clinic/ClinicDepartmentsBreakdown";
import ClinicCityBenchmark from "@/components/clinic/ClinicCityBenchmark";

interface Props {
  title: string;
  apiUrl: string;
  dashboardId: number;
  columns: ColumnDef[];
}

export default function ClinicErrorsView({ apiUrl, dashboardId, columns }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ period: "all", types: [...ALL_TYPES] });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}?dashboard_id=${dashboardId}`)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const arr: Row[] = Array.isArray(parsed) ? parsed : [];
        setRows(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiUrl, dashboardId]);

  const stats = useClinicStats({ rows, columns, filters });

  const availableMonths = stats.sortedMonths;

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center gap-3 text-white/40">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
        Загрузка...
      </div>
    );
  }

  const cityProfile = selectedCity ? stats.cityProfiles[selectedCity] : null;
  const lastMonthValue = stats.monthsData.length > 0 ? stats.monthsData[stats.monthsData.length - 1].total : null;
  const sortedDesc = [...stats.cityTotals].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <ClinicFilters filters={filters} onChange={setFilters} availableMonths={availableMonths} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass glass-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(229,0,0,0.25), transparent 70%)", filter: "blur(20px)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wide">Всего ошибок</span>
              <div className="w-9 h-9 rounded-xl gradient-pink flex items-center justify-center">
                <Icon name="AlertTriangle" size={18} />
              </div>
            </div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-gradient-pink">{stats.total.toLocaleString("ru-RU")}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-white/40 text-xs">за период</p>
              {stats.totalPrev > 0 && (
                <span className={`text-xs font-bold flex items-center gap-0.5 ${stats.totalDeltaPct > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  <Icon name={stats.totalDeltaPct > 0 ? "ArrowUp" : "ArrowDown"} size={11} />
                  {Math.abs(stats.totalDeltaPct).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="glass glass-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)", filter: "blur(20px)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wide">Топ отдел</span>
              <div className="w-9 h-9 rounded-xl gradient-violet flex items-center justify-center">
                <Icon name="Users" size={18} />
              </div>
            </div>
            {stats.topType ? (
              <>
                <p className={`font-display text-2xl sm:text-3xl font-bold ${TYPE_TEXT[stats.topType.name as ClinicErrorType]}`}>
                  {stats.topType.name}
                </p>
                <p className="text-white/40 text-xs mt-1">{stats.topType.value.toLocaleString("ru-RU")} ошибок</p>
              </>
            ) : (
              <p className="text-white/30 text-sm">Нет данных</p>
            )}
          </div>
        </div>

        <div className="glass glass-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,191,255,0.25), transparent 70%)", filter: "blur(20px)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wide">Топ город</span>
              <div className="w-9 h-9 rounded-xl gradient-cyan flex items-center justify-center">
                <Icon name="MapPin" size={18} />
              </div>
            </div>
            {stats.topCity ? (
              <>
                <button
                  onClick={() => setSelectedCity(stats.topCity!.city)}
                  className="font-display text-2xl sm:text-3xl font-bold text-gradient-cyan truncate hover:underline text-left w-full"
                >
                  {stats.topCity.city}
                </button>
                <p className="text-white/40 text-xs mt-1">{stats.topCity.total.toLocaleString("ru-RU")} ошибок</p>
              </>
            ) : (
              <p className="text-white/30 text-sm">Нет данных</p>
            )}
          </div>
        </div>

        <div className="glass glass-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,184,0,0.25), transparent 70%)", filter: "blur(20px)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-xs font-medium uppercase tracking-wide">Топ причина</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/80 flex items-center justify-center">
                <Icon name="TrendingUp" size={18} />
              </div>
            </div>
            {stats.topReason ? (
              <>
                <p
                  className="font-display text-lg sm:text-xl font-bold text-amber-300 leading-tight"
                  title={stats.topReason.label}
                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {stats.topReason.label}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {stats.topReason.total.toLocaleString("ru-RU")} ошибок
                  {stats.topReason.type && <span className="ml-1">· {stats.topReason.type}</span>}
                </p>
              </>
            ) : (
              <p className="text-white/30 text-sm">Нет данных</p>
            )}
          </div>
        </div>
      </div>

      {/* Светофор по отделам */}
      <ClinicDepartmentLights typeChange={stats.typeChange} total={stats.total} />

      {/* Профиль города */}
      {cityProfile && (
        <ClinicCityProfile profile={cityProfile} avgCity={stats.avgCity} onClose={() => setSelectedCity(null)} />
      )}

      {/* Эффективность клиник */}
      {stats.totalCities > 0 && stats.maxCityVal > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(16,185,129,0.25)" }}>
              <Icon name="Activity" size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Эффективность клиник</h3>
              <p className="text-white/40 text-xs mt-0.5">Меньше ошибок = лучше клиника · клик по городу = профиль</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <div>
              <p className="text-xs text-emerald-400 font-semibold mb-3 flex items-center gap-1.5">
                <Icon name="ThumbsUp" size={14} /> Лучшие клиники
              </p>
              <div className="space-y-3">
                {stats.best3.map((c, i) => {
                  const pct = stats.maxCityVal > 0 ? (c.total / stats.maxCityVal) * 100 : 0;
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={c.city}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-base flex-shrink-0">{medals[i]}</span>
                        <button onClick={() => setSelectedCity(c.city)} className="text-sm text-white/80 flex-1 truncate text-left hover:text-white">{c.city}</button>
                        <span className="text-sm font-mono font-semibold text-emerald-400">{c.total.toLocaleString("ru-RU")}</span>
                      </div>
                      <div className="ml-9 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgba(16,185,129,0.4), #10B981)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs text-red-400 font-semibold mb-3 flex items-center gap-1.5">
                <Icon name="AlertTriangle" size={14} /> Требуют внимания
              </p>
              <div className="space-y-3">
                {stats.worst3.map((c, i) => {
                  const pct = stats.maxCityVal > 0 ? (c.total / stats.maxCityVal) * 100 : 0;
                  return (
                    <div key={c.city}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-red-400"
                          style={{ background: "rgba(239,68,68,0.15)" }}>{stats.totalCities - i}</span>
                        <button onClick={() => setSelectedCity(c.city)} className="text-sm text-white/80 flex-1 truncate text-left hover:text-white">{c.city}</button>
                        <span className="text-sm font-mono font-semibold text-red-400">{c.total.toLocaleString("ru-RU")}</span>
                      </div>
                      <div className="ml-9 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgba(239,68,68,0.4), #EF4444)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-white/40 mb-3">
              <span>Среднее: <span className="font-semibold text-white/60">{Math.round(stats.avgCity).toLocaleString("ru-RU")}</span> ошибок</span>
              <span>Разброс: <span className="font-semibold text-white/60">{stats.minCityVal.toLocaleString("ru-RU")} — {stats.maxCityVal.toLocaleString("ru-RU")}</span></span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.25), rgba(239,68,68,0.25))" }}>
              <div className="absolute top-0 h-full w-0.5 bg-white/60 z-10"
                style={{
                  left: `${Math.min(Math.max(((stats.avgCity - stats.minCityVal) / (Math.max(stats.maxCityVal - stats.minCityVal, 1))) * 100, 2), 98)}%`,
                  transition: "left 1s ease",
                }}>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70 whitespace-nowrap">
                  avg
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-emerald-400/70"><span className="font-bold text-emerald-400">{stats.belowAvg}</span> ниже среднего</span>
              <span className="text-red-400/70"><span className="font-bold text-red-400">{stats.aboveAvg}</span> выше среднего</span>
            </div>
          </div>
        </div>
      )}

      {/* Топ-5 причин + Разбивка по отделам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ClinicTopReasons reasons={stats.reasons} />
        <ClinicDepartmentsBreakdown
          byType={stats.byType}
          typeChange={stats.typeChange}
          total={stats.total}
        />
      </div>

      {/* Бенчмарк городов */}
      <ClinicCityBenchmark
        cityTotals={sortedDesc}
        cityProfiles={stats.cityProfiles}
        total={stats.total}
        avgCity={stats.avgCity}
        onCityClick={setSelectedCity}
      />

      {/* Тепловая карта + Месяцы по отделам рядом, когда карта компактная */}
      <div className={`flex flex-col ${stats.currentMonths.length <= 3 ? "lg:flex-row" : ""} gap-4 sm:gap-6 items-stretch`}>
        <ClinicHeatmap
          cities={stats.heatmapCities}
          months={stats.currentMonths}
          cells={stats.cityMonthCells}
          max={stats.heatmapMaxValue}
          columns={columns}
          onCityClick={setSelectedCity}
        />

        {stats.currentMonths.length <= 3 && stats.monthsData.length > 0 && (
          <div className="glass rounded-2xl p-4 sm:p-6 flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-base sm:text-lg">Месяцы по отделам</h3>
                <p className="text-white/40 text-xs">Сравнение Дженериков, Фина и Сервиса</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Icon name="BarChart3" size={18} />
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="short" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
                  <Bar dataKey="Дженерики" stackId="a" fill={TYPE_COLORS["Дженерики"]} />
                  <Bar dataKey="Фин" stackId="a" fill={TYPE_COLORS["Фин"]} />
                  <Bar dataKey="Сервис" stackId="a" fill={TYPE_COLORS["Сервис"]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Динамика по месяцам + Динамика по отделам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Динамика по месяцам</h3>
              <p className="text-white/40 text-xs">Общее изменение</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <Icon name="TrendingUp" size={18} />
            </div>
          </div>
          {stats.monthsData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="short" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Всего" stroke="#8b5cf6" strokeWidth={2} fill="url(#totalGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-white/30 text-sm">Нет данных по месяцам</div>
          )}
        </div>

        <ClinicDepartmentsTrend monthsData={stats.monthsData} />
      </div>

      {/* Месяцы по отделам (stacked) — на всю ширину, когда тепловая карта широкая */}
      {stats.currentMonths.length > 3 && stats.monthsData.length > 0 && (
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Месяцы по отделам</h3>
              <p className="text-white/40 text-xs">Сравнение Дженериков, Фина и Сервиса</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <Icon name="BarChart3" size={18} />
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="short" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
                <Bar dataKey="Дженерики" stackId="a" fill={TYPE_COLORS["Дженерики"]} />
                <Bar dataKey="Фин" stackId="a" fill={TYPE_COLORS["Фин"]} />
                <Bar dataKey="Сервис" stackId="a" fill={TYPE_COLORS["Сервис"]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Аномалии и Концентрация */}
      <ClinicAnomalies
        anomalies={stats.anomalies}
        concentrationPct={stats.concentrationPct}
        topCities={sortedDesc}
        total={stats.total}
      />

      {/* Прогноз и точка боли */}
      <ClinicForecast
        forecast={stats.forecast}
        forecastDirection={stats.forecastDirection}
        lastValue={lastMonthValue}
        worstPair={stats.worstPair}
      />
    </div>
  );
}