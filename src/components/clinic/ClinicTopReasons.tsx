import Icon from "@/components/ui/icon";
import type { ReasonTotal } from "./useClinicStats";
import { TYPE_COLORS } from "./types";

interface Props {
  reasons: ReasonTotal[];
}

export default function ClinicTopReasons({ reasons }: Props) {
  const top = reasons.slice(0, 5);
  if (top.length === 0) return null;
  const max = top[0].total || 1;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">Топ-5 причин ошибок</h3>
          <p className="text-white/40 text-xs">Самые частые жалобы по отделам</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="ListOrdered" size={18} />
        </div>
      </div>
      <div className="space-y-3">
        {top.map((r, i) => {
          const pct = (r.total / max) * 100;
          const color = r.type ? TYPE_COLORS[r.type] : "#94a3b8";
          const delta = r.prev > 0 ? ((r.total - r.prev) / r.prev) * 100 : 0;
          return (
            <div key={r.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-display font-bold text-white/80"
                  style={{ background: `${color}25`, color }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.label}</p>
                  {r.type && (
                    <p className="text-[11px]" style={{ color }}>{r.type}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-white">{r.total.toLocaleString("ru-RU")}</p>
                  {r.prev > 0 && (
                    <p className={`text-[10px] font-semibold ${delta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(0)}% vs пред.
                    </p>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 8px ${color}40` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}