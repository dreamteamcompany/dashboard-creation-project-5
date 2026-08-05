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

    let raf = 0;
    let current = false;

    const check = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top;
      const next = current ? top < 40 : top < -10;
      if (next !== current) {
        current = next;
        setStuck(next);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const btnCity = (active: boolean) =>
    `rounded-full transition-all duration-300 ${active ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"}`;
  const btnMonth = (active: boolean) =>
    `rounded-full transition-all duration-300 ${active ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"}`;

  return (
    <>
      <div ref={ref} className="h-0" />
      <div
        className="sticky top-0 z-30 border overflow-hidden"
        style={{
          padding: stuck ? "8px 16px" : "16px",
          borderRadius: stuck ? "12px" : "16px",
          background: stuck ? "var(--filters-bg)" : "var(--glass-bg)",
          borderColor: stuck ? "rgba(255,255,255,0.1)" : "var(--glass-border)",
          boxShadow: stuck ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
          backdropFilter: "blur(24px)",
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="flex flex-col"
          style={{
            gap: stuck ? "6px" : "12px",
            transition: "gap 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div
            className="flex items-center shrink-0"
            style={{
              flexWrap: "wrap",
              gap: stuck ? "4px" : "6px",
              transition: "gap 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="flex items-center gap-1.5 shrink-0 mr-1">
              <Icon name="MapPin" size={stuck ? 11 : 14} className="text-violet-400" />
              <span
                className="font-semibold text-white/40 uppercase tracking-wider"
                style={{
                  fontSize: stuck ? "9px" : "11px",
                  transition: "font-size 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Город
              </span>
            </div>
            <button
              onClick={() => onCityChange(null)}
              className={btnCity(!selectedCity)}
              style={{
                fontSize: stuck ? "10px" : "12px",
                padding: stuck ? "3px 8px" : "6px 12px",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {stuck ? "Все" : "Все города"}
            </button>
            {cities.map(city => (
              <button key={city}
                onClick={() => onCityChange(selectedCity === city ? null : city)}
                className={`${btnCity(selectedCity === city)} truncate max-w-[140px] sm:max-w-none`}
                style={{
                  fontSize: stuck ? "10px" : "12px",
                  padding: stuck ? "3px 8px" : "6px 12px",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                title={city}
              >
                {city}
              </button>
            ))}
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(255,255,255,0.08)",
              transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: stuck ? 0 : 1,
            }}
          />

          <div
            className="flex items-center shrink-0"
            style={{
              flexWrap: "wrap",
              gap: stuck ? "4px" : "6px",
              transition: "gap 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="flex items-center gap-1.5 shrink-0 mr-1">
              <Icon name="Calendar" size={stuck ? 11 : 14} className="text-cyan-400" />
              <span
                className="font-semibold text-white/40 uppercase tracking-wider"
                style={{
                  fontSize: stuck ? "9px" : "11px",
                  transition: "font-size 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Месяц
              </span>
            </div>
            <button
              onClick={() => onMonthChange(null)}
              className={btnMonth(!selectedMonth)}
              style={{
                fontSize: stuck ? "10px" : "12px",
                padding: stuck ? "3px 8px" : "6px 12px",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {stuck ? "Все" : "Все месяцы"}
            </button>
            {allMonths.map(m => (
              <button key={m}
                onClick={() => onMonthChange(selectedMonth === m ? null : m)}
                className={`${btnMonth(selectedMonth === m)} whitespace-nowrap`}
                style={{
                  fontSize: stuck ? "10px" : "12px",
                  padding: stuck ? "3px 8px" : "6px 12px",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}