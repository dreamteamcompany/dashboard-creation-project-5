import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import funcUrls from "../../backend/func2url.json";
import {
  type CityData,
  type CityMonthData,
  MONTHS,
  MONTH_LABELS,
  PIE_COLORS,
  DASHBOARD_ID,
  fmtMoney,
  getCityTotals,
} from "./vyrabotka/VyrabotkaUtils";
import VyrabotkaKPI from "./vyrabotka/VyrabotkaKPI";
import VyrabotkaCityView from "./vyrabotka/VyrabotkaCityView";
import VyrabotkaAllView from "./vyrabotka/VyrabotkaAllView";
import VyrabotkaCompareBlock from "./vyrabotka/VyrabotkaCompareBlock";
import RaskhozhdenieDiffBlock from "./vyrabotka/RaskhozhdenieDiffBlock";

export default function VyrabotkaView() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)";

  const [DATA, setDATA] = useState<CityData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      { threshold: [1], rootMargin: "-5px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dataLoading]);

  useEffect(() => {
    const url = `${funcUrls["dashboard-data"]}?dashboard_id=${DASHBOARD_ID}`;
    fetch(url)
      .then(r => r.json())
      .then((rows: Array<{ id: number; city: string; plan: number; fact?: number; fakt?: number; plan_uk: number; vyrabotka_na_20e: number; dolgi_klinik?: number }>) => {
        const cityMap: Record<string, Record<string, CityMonthData>> = {};
        rows.forEach(r => {
          const sep = r.city.lastIndexOf(" — ");
          if (sep === -1) return;
          const cityName = r.city.substring(0, sep);
          const month = r.city.substring(sep + 3);
          if (!cityMap[cityName]) cityMap[cityName] = {};
          const factVal = Number(r.fakt ?? r.fact) || 0;
          cityMap[cityName][month] = { plan: Number(r.plan) || 0, fact: factVal, planUk: Number(r.plan_uk) || 0, vyrabotkaNa20e: Number(r.vyrabotka_na_20e) || 0, dolgiKlinik: Number(r.dolgi_klinik) || 0 };
        });
        const mapped: CityData[] = Object.entries(cityMap).map(([city, months]) => ({ city, months }));
        setDATA(mapped);
      })
      .catch(e => console.error("Failed to load vyrabotka data", e))
      .finally(() => setDataLoading(false));
  }, []);

  const activeMonths = MONTHS;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
          Загрузка данных...
        </div>
      </div>
    );
  }

  const filteredData = selectedCity ? DATA.filter(d => d.city === selectedCity) : DATA;

  let totalPlan = 0, totalFact = 0, totalPlanUk = 0;
  filteredData.forEach(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    totalPlan += t.plan;
    totalFact += t.fact;
    totalPlanUk += t.planUk;
  });
  const totalDiff = totalFact - totalPlanUk;
  const totalPct = totalPlan > 0 ? (totalFact / totalPlan) * 100 : 0;

  const cityRanking = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { ...d, ...t, pct: t.planUk > 0 ? (t.fact / t.planUk) * 100 : 0 };
  }).filter(c => c.planUk > 0).sort((a, b) => b.pct - a.pct);

  const worstCity = cityRanking[cityRanking.length - 1];

  const bestCity = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { city: d.city, pct: t.planUk > 0 ? (t.fact / t.planUk) * 100 : 0, planUk: t.planUk };
  }).filter(c => c.planUk > 0).sort((a, b) => b.pct - a.pct)[0];

  const monthlyData = activeMonths.map(m => {
    let plan = 0, fact = 0;
    filteredData.forEach(d => {
      const md = d.months[m];
      if (md) { plan += md.planUk; fact += md.fact; }
    });
    return { name: MONTH_LABELS[m] || m, shortName: m, plan, fact, pct: plan > 0 ? ((fact / plan) * 100) : 0 };
  });

  const barData = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { name: d.city, plan: t.plan, fact: t.fact, pct: t.pct };
  }).sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const pieDataFact = DATA.map((d, i) => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { name: d.city, value: t.fact, color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const deviationData = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { name: d.city, value: t.diff, pct: t.pct };
  }).filter(d => d.value !== 0).sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const kpiKey = `${selectedCity || "all"}-${selectedMonth || "all"}`;

  const kpiCards = selectedCity
    ? (() => {
        const ct = getCityTotals(DATA.find(d => d.city === selectedCity)!, activeMonths, selectedMonth);
        const rank = cityRanking.findIndex(c => c.city === selectedCity) + 1;
        return [
          {
            label: `План УК · ${selectedCity}`,
            value: fmtMoney(ct.planUk),
            icon: "Target",
            gradient: "gradient-violet",
            textGradient: "text-gradient-violet",
            glow: "rgba(124,92,255,0.35)",
            sub: selectedMonth ? MONTH_LABELS[selectedMonth] : "За период",
          },
          {
            label: `Факт · ${selectedCity}`,
            value: fmtMoney(ct.fact),
            icon: "TrendingUp",
            gradient: "gradient-cyan",
            textGradient: "text-gradient-cyan",
            glow: "rgba(0,229,204,0.35)",
            sub: `${ct.pct.toFixed(1)}% от плана`,
          },
          {
            label: "Отклонение",
            value: (ct.diffUk >= 0 ? "+" : "") + fmtMoney(ct.diffUk),
            icon: ct.diffUk >= 0 ? "ArrowUpRight" : "ArrowDownRight",
            gradient: ct.diffUk >= 0 ? "gradient-green" : "gradient-pink",
            textGradient: ct.diffUk >= 0 ? "text-gradient-green" : "text-gradient-pink",
            glow: ct.diffUk >= 0 ? "rgba(0,212,106,0.35)" : "rgba(255,60,172,0.35)",
            sub: fmtMoney(Math.abs(ct.diffUk)) + " ₽",
          },
          {
            label: "Место в рейтинге",
            value: `${rank} из ${cityRanking.length}`,
            icon: "Award",
            gradient: rank <= 3 ? "gradient-green" : rank <= 10 ? "gradient-violet" : "gradient-pink",
            textGradient: rank <= 3 ? "text-gradient-green" : rank <= 10 ? "text-gradient-violet" : "text-gradient-pink",
            glow: rank <= 3 ? "rgba(0,212,106,0.35)" : "rgba(124,92,255,0.35)",
            sub: `${ct.pct.toFixed(1)}% выполнения`,
          },
        ];
      })()
    : [
        {
          label: "Общий план",
          value: fmtMoney(totalPlanUk),
          icon: "Target",
          gradient: "gradient-violet",
          textGradient: "text-gradient-violet",
          glow: "rgba(124,92,255,0.35)",
          sub: selectedMonth ? MONTH_LABELS[selectedMonth] : "За период",
        },
        {
          label: "Общий факт",
          value: fmtMoney(totalFact),
          icon: "TrendingUp",
          gradient: "gradient-cyan",
          textGradient: "text-gradient-cyan",
          glow: "rgba(0,229,204,0.35)",
          sub: `${totalPct.toFixed(1)}% от плана`,
        },
        {
          label: "Отклонение",
          value: (totalDiff >= 0 ? "+" : "") + fmtMoney(totalDiff),
          icon: totalDiff >= 0 ? "ArrowUpRight" : "ArrowDownRight",
          gradient: totalDiff >= 0 ? "gradient-green" : "gradient-pink",
          textGradient: totalDiff >= 0 ? "text-gradient-green" : "text-gradient-pink",
          glow: totalDiff >= 0 ? "rgba(0,212,106,0.35)" : "rgba(255,60,172,0.35)",
          sub: `${DATA.length} городов`,
        },
        {
          label: "Лучший город",
          value: bestCity?.city ?? "—",
          icon: "Award",
          gradient: "gradient-green",
          textGradient: "text-gradient-green",
          glow: "rgba(0,212,106,0.35)",
          sub: bestCity ? `${bestCity.pct.toFixed(1)}%` : "",
        },
      ];

  return (
    <div className="space-y-4">
      <div ref={filtersRef} className="h-0" />
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
              onClick={() => setSelectedCity(null)}
              className={`rounded-full transition-all duration-300 ${!selectedCity ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"}`}
              style={{
                fontSize: stuck ? "10px" : "12px",
                padding: stuck ? "3px 8px" : "6px 12px",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {stuck ? "Все" : "Все города"}
            </button>
            {[...DATA].sort((a, b) => a.city.localeCompare(b.city, "ru")).map(d => (
              <button key={d.city}
                onClick={() => setSelectedCity(selectedCity === d.city ? null : d.city)}
                className={`rounded-full transition-all duration-300 ${selectedCity === d.city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"}`}
                style={{
                  fontSize: stuck ? "10px" : "12px",
                  padding: stuck ? "3px 8px" : "6px 12px",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {d.city}
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
              onClick={() => setSelectedMonth(null)}
              className={`rounded-full transition-all duration-300 ${!selectedMonth ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"}`}
              style={{
                fontSize: stuck ? "10px" : "12px",
                padding: stuck ? "3px 8px" : "6px 12px",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {stuck ? "Все" : "Все месяцы"}
            </button>
            {activeMonths.map(m => (
              <button key={m}
                onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
                className={`rounded-full transition-all duration-300 ${selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"}`}
                style={{
                  fontSize: stuck ? "10px" : "12px",
                  padding: stuck ? "3px 8px" : "6px 12px",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {MONTH_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <VyrabotkaKPI cards={kpiCards} kpiKey={kpiKey} />

      {selectedCity ? (
        <VyrabotkaCityView
          selectedCity={selectedCity}
          DATA={DATA}
          activeMonths={activeMonths}
          selectedMonth={selectedMonth}
          monthlyData={monthlyData}
          totalPlan={totalPlan}
          totalFact={totalFact}
          totalDiff={totalDiff}
          totalPct={totalPct}
          kpiKey={kpiKey}
          isLight={isLight}
          axisColor={axisColor}
          cityRanking={cityRanking}
        />
      ) : (
        <VyrabotkaAllView
          DATA={DATA}
          activeMonths={activeMonths}
          selectedMonth={selectedMonth}
          monthlyData={monthlyData}
          barData={barData}
          pieDataFact={pieDataFact}
          deviationData={deviationData}
          cityRanking={cityRanking}
          isLight={isLight}
          axisColor={axisColor}
          setSelectedCity={setSelectedCity}
        />
      )}

      {!selectedCity && (
        <>
          <RaskhozhdenieDiffBlock selectedMonth={selectedMonth} />
          <VyrabotkaCompareBlock mode="city" selectedMonth={selectedMonth} />
          <VyrabotkaCompareBlock mode="month" selectedCity={selectedCity} />
        </>
      )}
    </div>
  );
}