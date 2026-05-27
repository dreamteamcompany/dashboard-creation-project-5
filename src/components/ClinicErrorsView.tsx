import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ColumnDef, ClinicErrorType } from "@/config/dashboards";

interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

interface Props {
  title: string;
  apiUrl: string;
  dashboardId: number;
  columns: ColumnDef[];
}

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const TYPE_COLORS: Record<ClinicErrorType, string> = {
  "Бухгалтерия": "#f59e0b",
  "Фин": "#10b981",
  "Сервис": "#8b5cf6",
};

const TYPE_TEXT: Record<ClinicErrorType, string> = {
  "Бухгалтерия": "text-amber-400",
  "Фин": "text-emerald-400",
  "Сервис": "text-violet-400",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md px-3 py-2 shadow-xl">
      {label && <p className="text-white/60 text-xs mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString("ru-RU")}
        </p>
      ))}
    </div>
  );
};

export default function ClinicErrorsView({ title, apiUrl, dashboardId, columns }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    const byType: Record<ClinicErrorType, number> = { "Бухгалтерия": 0, "Фин": 0, "Сервис": 0 };
    const byCity: Record<string, number> = {};
    const byReason: Record<string, { total: number; type?: ClinicErrorType }> = {};
    const byMonth: Record<string, number> = {};
    const byMonthType: Record<string, Record<ClinicErrorType, number>> = {};
    let total = 0;

    for (const row of rows) {
      const cityStr = String(row.city || "");
      const sep = cityStr.lastIndexOf(" — ");
      let city = cityStr;
      let month: string | undefined = (row.month as string) || undefined;
      if (sep !== -1) {
        city = cityStr.substring(0, sep);
        if (!month) month = cityStr.substring(sep + 3);
      }

      let rowTotal = 0;
      for (const col of columns) {
        const v = Number(row[col.key] || 0);
        if (!v) continue;
        rowTotal += v;
        if (col.type) byType[col.type] += v;

        const label = col.label || col.key;
        if (!byReason[label]) byReason[label] = { total: 0, type: col.type };
        byReason[label].total += v;

        if (month) {
          if (!byMonthType[month]) byMonthType[month] = { "Бухгалтерия": 0, "Фин": 0, "Сервис": 0 };
          if (col.type) byMonthType[month][col.type] += v;
        }
      }
      total += rowTotal;
      if (city) byCity[city] = (byCity[city] || 0) + rowTotal;
      if (month) byMonth[month] = (byMonth[month] || 0) + rowTotal;
    }

    const topType = (Object.entries(byType) as [ClinicErrorType, number][])
      .sort((a, b) => b[1] - a[1])[0];

    const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0];

    const topReason = Object.entries(byReason).sort((a, b) => b[1].total - a[1].total)[0];

    const typesData = (Object.entries(byType) as [ClinicErrorType, number][])
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    const monthsData = MONTHS
      .filter(m => byMonth[m] !== undefined)
      .map(m => ({
        month: m.slice(0, 3),
        fullMonth: m,
        total: byMonth[m] || 0,
        "Бухгалтерия": byMonthType[m]?.["Бухгалтерия"] || 0,
        "Фин": byMonthType[m]?.["Фин"] || 0,
        "Сервис": byMonthType[m]?.["Сервис"] || 0,
      }));

    return {
      total,
      topType: topType && topType[1] > 0 ? { name: topType[0], value: topType[1] } : null,
      topCity: topCity && topCity[1] > 0 ? { name: topCity[0], value: topCity[1] } : null,
      topReason: topReason && topReason[1].total > 0
        ? { name: topReason[0], value: topReason[1].total, type: topReason[1].type }
        : null,
      typesData,
      monthsData,
    };
  }, [rows, columns]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center gap-3 text-white/40">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
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
            <p className="text-3xl sm:text-4xl font-black text-gradient-pink">{stats.total.toLocaleString("ru-RU")}</p>
            <p className="text-white/40 text-xs mt-1">за весь период</p>
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
                <p className={`text-2xl sm:text-3xl font-black ${TYPE_TEXT[stats.topType.name as ClinicErrorType]}`}>
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
                <p className="text-2xl sm:text-3xl font-black text-gradient-cyan truncate">{stats.topCity.name}</p>
                <p className="text-white/40 text-xs mt-1">{stats.topCity.value.toLocaleString("ru-RU")} ошибок</p>
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
                <p className="text-xl sm:text-2xl font-black text-amber-300 truncate" title={stats.topReason.name}>
                  {stats.topReason.name}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {stats.topReason.value.toLocaleString("ru-RU")} ошибок
                  {stats.topReason.type && <span className="ml-1">· {stats.topReason.type}</span>}
                </p>
              </>
            ) : (
              <p className="text-white/30 text-sm">Нет данных</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Разбивка по отделам */}
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Разбивка по отделам</h3>
              <p className="text-white/40 text-xs">Доля ошибок каждого отдела</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <Icon name="PieChart" size={18} />
            </div>
          </div>
          {stats.typesData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-1/2 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.typesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {stats.typesData.map(entry => (
                        <Cell key={entry.name} fill={TYPE_COLORS[entry.name as ClinicErrorType]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                {stats.typesData.map(d => {
                  const pct = stats.total ? ((d.value / stats.total) * 100).toFixed(1) : "0";
                  return (
                    <div key={d.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS[d.name as ClinicErrorType] }} />
                        <span className="text-white/80 text-sm font-medium">{d.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">{d.value.toLocaleString("ru-RU")}</p>
                        <p className="text-white/40 text-[10px]">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-white/30 text-sm">
              Назначьте тип колонкам в настройках
            </div>
          )}
        </div>

        {/* Динамика по месяцам */}
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Динамика по месяцам</h3>
              <p className="text-white/40 text-xs">Изменение количества ошибок</p>
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
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Всего"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-white/30 text-sm">
              Добавьте данные по месяцам в настройках
            </div>
          )}
        </div>
      </div>

      {/* Месяцы по отделам */}
      {stats.monthsData.length > 0 && (
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base sm:text-lg">Месяцы по отделам</h3>
              <p className="text-white/40 text-xs">Сравнение Бухгалтерии, Фина и Сервиса</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <Icon name="BarChart3" size={18} />
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
                <Bar dataKey="Бухгалтерия" stackId="a" fill={TYPE_COLORS["Бухгалтерия"]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Фин" stackId="a" fill={TYPE_COLORS["Фин"]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Сервис" stackId="a" fill={TYPE_COLORS["Сервис"]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
