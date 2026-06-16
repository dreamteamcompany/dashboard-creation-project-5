import Icon from "@/components/ui/icon";
import type { Filters, ClinicErrorType } from "./types";
import { ALL_TYPES, TYPE_COLORS, QUARTERS, quarterOfMonth } from "./types";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  availableMonths?: string[];
}

const PERIODS: { value: Filters["period"]; label: string }[] = [
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
  { value: "all", label: "Всё время" },
];

export default function ClinicFilters({ filters, onChange, availableMonths = [] }: Props) {
  const toggleType = (t: ClinicErrorType) => {
    const has = filters.types.includes(t);
    const next = has ? filters.types.filter(x => x !== t) : [...filters.types, t];
    if (next.length === 0) return;
    onChange({ ...filters, types: next });
  };

  // Кварталы, в которых есть данные
  const availableQuarters = QUARTERS.filter(q =>
    availableMonths.some(m => quarterOfMonth(m) === q.value),
  );

  const lastQuarter = availableMonths.length > 0
    ? quarterOfMonth(availableMonths[availableMonths.length - 1])
    : 1;

  const selectPeriod = (value: Filters["period"]) => {
    if (value === "month") {
      const defaultMonth = filters.month && availableMonths.includes(filters.month)
        ? filters.month
        : availableMonths[availableMonths.length - 1];
      onChange({ ...filters, period: value, month: defaultMonth });
    } else if (value === "quarter") {
      const defaultQuarter = filters.quarter && availableQuarters.some(q => q.value === filters.quarter)
        ? filters.quarter
        : lastQuarter;
      onChange({ ...filters, period: value, month: undefined, quarter: defaultQuarter });
    } else {
      onChange({ ...filters, period: value, month: undefined });
    }
  };

  const selectedMonth = filters.month && availableMonths.includes(filters.month)
    ? filters.month
    : availableMonths[availableMonths.length - 1];

  const selectedQuarter = filters.quarter && availableQuarters.some(q => q.value === filters.quarter)
    ? filters.quarter
    : lastQuarter;

  return (
    <div className="glass rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <Icon name="Calendar" size={14} className="text-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-wide font-semibold">Период</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => selectPeriod(p.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              filters.period === p.value
                ? "gradient-violet text-white font-semibold"
                : "bg-white/5 hover:bg-white/10 text-white/60"
            }`}
          >
            {p.label}
          </button>
        ))}
        {filters.period === "month" && availableMonths.length > 0 && (
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={e => onChange({ ...filters, period: "month", month: e.target.value })}
              className="appearance-none text-xs pl-3 pr-8 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/40 text-white font-medium outline-none cursor-pointer hover:bg-violet-500/25 transition-colors focus:border-violet-500"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-[#1e1432] text-white">{m}</option>
              ))}
            </select>
            <Icon name="ChevronDown" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          </div>
        )}
        {filters.period === "quarter" && availableQuarters.length > 0 && (
          <div className="relative">
            <select
              value={selectedQuarter}
              onChange={e => onChange({ ...filters, period: "quarter", month: undefined, quarter: Number(e.target.value) })}
              className="appearance-none text-xs pl-3 pr-8 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/40 text-white font-medium outline-none cursor-pointer hover:bg-violet-500/25 transition-colors focus:border-violet-500"
            >
              {availableQuarters.map(q => (
                <option key={q.value} value={q.value} className="bg-[#1e1432] text-white">{q.label}</option>
              ))}
            </select>
            <Icon name="ChevronDown" size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="hidden sm:block w-px h-6 bg-white/10" />

      <div className="flex items-center gap-2">
        <Icon name="Filter" size={14} className="text-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-wide font-semibold">Отделы</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {(() => {
          const allActive = filters.types.length === ALL_TYPES.length;
          return (
            <button
              onClick={() => onChange({ ...filters, types: [...ALL_TYPES] })}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 border flex items-center gap-1.5 ${
                allActive
                  ? "border-transparent text-white font-semibold gradient-violet"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-white/60"
              }`}
              style={allActive ? { boxShadow: "0 4px 14px rgba(139,92,246,0.35)" } : undefined}
            >
              <Icon name="LayoutGrid" size={11} />
              Все
            </button>
          );
        })()}
        {ALL_TYPES.map(t => {
          const active = filters.types.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 border flex items-center gap-1.5 ${
                active
                  ? "border-transparent text-white font-semibold"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-white/40"
              }`}
              style={active ? { background: TYPE_COLORS[t], boxShadow: `0 4px 14px ${TYPE_COLORS[t]}40` } : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "white" : TYPE_COLORS[t] }} />
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}