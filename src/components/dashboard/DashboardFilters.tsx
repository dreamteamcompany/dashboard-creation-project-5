import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  cities: string[];
  allMonths: string[];
  selectedCity: string | null;
  selectedMonth: string | null;
  onCityChange: (city: string | null) => void;
  onMonthChange: (month: string | null) => void;
}

export default function DashboardFilters({
  cities, allMonths, selectedCity, selectedMonth, onCityChange, onMonthChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      { threshold: [1], rootMargin: "-5px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={ref} className="h-0" />
      <div
        className={`sticky top-0 z-30 border transition-all duration-300 ${
          stuck
            ? "rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-white/10 px-4 py-2.5"
            : "glass rounded-2xl border-white/5 p-4"
        }`}
        style={stuck ? {
          background: "var(--filters-bg)",
          backdropFilter: "blur(24px)",
        } : undefined}
      >
        {stuck ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <Icon name="MapPin" size={12} className="text-violet-400" />
              <span className="text-[10px] font-semibold text-white/40 uppercase">Город</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => onCityChange(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 ${
                  !selectedCity ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                }`}>
                Все
              </button>
              {cities.map(city => (
                <button key={city}
                  onClick={() => onCityChange(selectedCity === city ? null : city)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 ${
                    selectedCity === city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                  }`}>
                  {city}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-white/10 shrink-0" />

            <div className="flex items-center gap-1.5 shrink-0">
              <Icon name="Calendar" size={12} className="text-cyan-400" />
              <span className="text-[10px] font-semibold text-white/40 uppercase">Месяц</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => onMonthChange(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 ${
                  !selectedMonth ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                }`}>
                Все
              </button>
              {allMonths.map(m => (
                <button key={m}
                  onClick={() => onMonthChange(selectedMonth === m ? null : m)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 ${
                    selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="MapPin" size={14} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Город</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onCityChange(null)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                    !selectedCity ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                  }`}>
                  Все города
                </button>
                {cities.map(city => (
                  <button key={city}
                    onClick={() => onCityChange(selectedCity === city ? null : city)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                      selectedCity === city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                    }`}>
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/8" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Calendar" size={14} className="text-cyan-400" />
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Месяц</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onMonthChange(null)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                    !selectedMonth ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                  }`}>
                  Все месяцы
                </button>
                {allMonths.map(m => (
                  <button key={m}
                    onClick={() => onMonthChange(selectedMonth === m ? null : m)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                      selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
