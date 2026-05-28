import Icon from "@/components/ui/icon";
import type { Filters, ClinicErrorType } from "./types";
import { ALL_TYPES, TYPE_COLORS } from "./types";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const PERIODS: { value: Filters["period"]; label: string }[] = [
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
  { value: "all", label: "Всё время" },
];

export default function ClinicFilters({ filters, onChange }: Props) {
  const toggleType = (t: ClinicErrorType) => {
    const has = filters.types.includes(t);
    const next = has ? filters.types.filter(x => x !== t) : [...filters.types, t];
    if (next.length === 0) return;
    onChange({ ...filters, types: next });
  };

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
            onClick={() => onChange({ ...filters, period: p.value })}
            className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              filters.period === p.value
                ? "gradient-violet text-white font-semibold"
                : "bg-white/5 hover:bg-white/10 text-white/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="hidden sm:block w-px h-6 bg-white/10" />

      <div className="flex items-center gap-2">
        <Icon name="Filter" size={14} className="text-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-wide font-semibold">Отделы</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
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
