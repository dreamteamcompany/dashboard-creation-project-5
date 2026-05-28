import Icon from "@/components/ui/icon";
import type { ClinicErrorType } from "./types";
import { ALL_TYPES, TYPE_COLORS } from "./types";

interface TypeChange {
  value: number;
  prev: number;
  deltaPct: number;
}

interface Props {
  typeChange: Record<ClinicErrorType, TypeChange>;
  total: number;
}

function lightFor(deltaPct: number, hasPrev: boolean, value: number): { color: string; bg: string; label: string; icon: string } {
  if (value === 0) return { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "Чисто", icon: "ShieldCheck" };
  if (!hasPrev) return { color: "#94a3b8", bg: "rgba(148,163,184,0.15)", label: "Нет сравнения", icon: "Minus" };
  if (deltaPct > 20) return { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "Хуже", icon: "TrendingUp" };
  if (deltaPct > -10) return { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "Стабильно", icon: "Equal" };
  return { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "Лучше", icon: "TrendingDown" };
}

export default function ClinicDepartmentLights({ typeChange, total }: Props) {
  if (total === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {ALL_TYPES.map(t => {
        const data = typeChange[t];
        const pct = total > 0 ? (data.value / total) * 100 : 0;
        const status = lightFor(data.deltaPct, data.prev > 0, data.value);
        return (
          <div key={t} className="glass glass-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
              style={{ background: `radial-gradient(circle, ${TYPE_COLORS[t]}30, transparent 70%)`, filter: "blur(24px)" }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS[t], boxShadow: `0 0 12px ${TYPE_COLORS[t]}` }} />
                  <span className="text-white/80 text-sm font-bold">{t}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                  <Icon name={status.icon} size={11} />
                  <span className="text-[10px] font-semibold">{status.label}</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black text-white">{data.value.toLocaleString("ru-RU")}</p>
                  <p className="text-white/40 text-xs mt-0.5">{pct.toFixed(1)}% от всех</p>
                </div>
                {data.prev > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase">vs пред.</p>
                    <p className={`text-sm font-bold ${data.deltaPct > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {data.deltaPct > 0 ? "+" : ""}{data.deltaPct.toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: TYPE_COLORS[t], boxShadow: `0 0 8px ${TYPE_COLORS[t]}60` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
