import { useMemo } from "react";
import type { ColumnDef, ClinicErrorType, Row, Filters } from "./types";
import { MONTHS, quarterOfMonth } from "./types";

interface Params {
  rows: Row[];
  columns: ColumnDef[];
  filters: Filters;
}

export interface CityTotal {
  city: string;
  total: number;
  prev: number;
}

export interface ReasonTotal {
  label: string;
  key: string;
  type?: ClinicErrorType;
  total: number;
  prev: number;
}

export interface MonthBucket {
  month: string;
  short: string;
  total: number;
  "Дженерики": number;
  "Фин": number;
  "Сервис": number;
}

export interface CityMonthCell {
  city: string;
  month: string;
  value: number;
  types: Record<ClinicErrorType, number>;
  reasons: Record<string, number>;
}

export interface CityProfile {
  city: string;
  total: number;
  byType: Record<ClinicErrorType, number>;
  byReason: Array<{ label: string; value: number; type?: ClinicErrorType }>;
  byMonth: MonthBucket[];
}

export interface WorstPair {
  city: string;
  reason: string;
  type?: ClinicErrorType;
  value: number;
}

function parseCity(row: Row): { city: string; month?: string } {
  const cityStr = String(row.city || "");
  const sep = cityStr.lastIndexOf(" — ");
  let city = cityStr;
  let month: string | undefined = (row.month as string) || undefined;
  if (sep !== -1) {
    city = cityStr.substring(0, sep);
    if (!month) month = cityStr.substring(sep + 3);
  }
  return { city, month };
}

function monthIdx(m: string): number {
  return MONTHS.indexOf(m as typeof MONTHS[number]);
}

export function useClinicStats({ rows, columns, filters }: Params) {
  return useMemo(() => {
    const activeColumns = columns.filter(c => !c.type || filters.types.includes(c.type));

    // 1. Determine months that exist in data
    const allMonthsPresent = new Set<string>();
    rows.forEach(r => {
      const { month } = parseCity(r);
      if (month) allMonthsPresent.add(month);
    });
    const sortedMonths = MONTHS.filter(m => allMonthsPresent.has(m));

    // 2. Compute current/prev period months
    let currentMonths: string[] = sortedMonths.slice();
    let prevMonths: string[] = [];
    if (filters.period === "month" && sortedMonths.length > 0) {
      const idx = filters.month && sortedMonths.includes(filters.month)
        ? sortedMonths.indexOf(filters.month)
        : sortedMonths.length - 1;
      currentMonths = [sortedMonths[idx]];
      prevMonths = idx > 0 ? [sortedMonths[idx - 1]] : [];
    } else if (filters.period === "quarter" && sortedMonths.length > 0) {
      const q = filters.quarter && filters.quarter >= 1 && filters.quarter <= 4
        ? filters.quarter
        : quarterOfMonth(sortedMonths[sortedMonths.length - 1]);
      currentMonths = sortedMonths.filter(m => quarterOfMonth(m) === q);
      const prevQ = q > 1 ? q - 1 : 0;
      prevMonths = prevQ ? sortedMonths.filter(m => quarterOfMonth(m) === prevQ) : [];
    } else if (filters.period === "year") {
      currentMonths = sortedMonths.slice();
      prevMonths = [];
    } else if (filters.period === "all") {
      currentMonths = sortedMonths.slice();
      prevMonths = [];
    }

    const isInCurrent = (m?: string) => {
      if (!m) return filters.period === "all";
      return currentMonths.includes(m);
    };
    const isInPrev = (m?: string) => {
      if (!m) return false;
      return prevMonths.includes(m);
    };

    const byType: Record<ClinicErrorType, number> = { "Дженерики": 0, "Фин": 0, "Сервис": 0 };
    const byTypePrev: Record<ClinicErrorType, number> = { "Дженерики": 0, "Фин": 0, "Сервис": 0 };

    const cityMap: Record<string, { total: number; prev: number; byType: Record<ClinicErrorType, number>; byReason: Record<string, { value: number; type?: ClinicErrorType }>; byMonth: Record<string, { total: number; types: Record<ClinicErrorType, number>; reasons: Record<string, number> }> }> = {};
    const reasonMap: Record<string, ReasonTotal> = {};
    const monthMap: Record<string, { total: number; types: Record<ClinicErrorType, number> }> = {};
    const monthMapPrev: Record<string, { total: number; types: Record<ClinicErrorType, number> }> = {};
    const cityMonthCells: CityMonthCell[] = [];
    const worstPairs: WorstPair[] = [];

    let total = 0;
    let totalPrev = 0;

    for (const row of rows) {
      const { city, month } = parseCity(row);
      const inCurrent = isInCurrent(month);
      const inPrev = isInPrev(month);
      if (!inCurrent && !inPrev) continue;

      if (!cityMap[city]) {
        cityMap[city] = {
          total: 0, prev: 0,
          byType: { "Дженерики": 0, "Фин": 0, "Сервис": 0 },
          byReason: {},
          byMonth: {},
        };
      }

      let rowTotal = 0;
      for (const col of activeColumns) {
        const v = Number(row[col.key] || 0);
        if (!v) continue;
        rowTotal += v;

        if (inCurrent) {
          if (col.type) byType[col.type] += v;
          if (city) cityMap[city].byType[col.type as ClinicErrorType] = (cityMap[city].byType[col.type as ClinicErrorType] || 0) + (col.type ? v : 0);

          const label = col.label || col.key;
          if (!reasonMap[label]) reasonMap[label] = { label, key: col.key, type: col.type, total: 0, prev: 0 };
          reasonMap[label].total += v;

          if (city) {
            cityMap[city].byReason[label] = cityMap[city].byReason[label] || { value: 0, type: col.type };
            cityMap[city].byReason[label].value += v;
          }

          if (month) {
            if (!monthMap[month]) monthMap[month] = { total: 0, types: { "Дженерики": 0, "Фин": 0, "Сервис": 0 } };
            monthMap[month].total += v;
            if (col.type) monthMap[month].types[col.type] += v;

            if (city) {
              cityMap[city].byMonth[month] = cityMap[city].byMonth[month] || { total: 0, types: { "Дженерики": 0, "Фин": 0, "Сервис": 0 }, reasons: {} };
              cityMap[city].byMonth[month].total += v;
              if (col.type) cityMap[city].byMonth[month].types[col.type] += v;
              cityMap[city].byMonth[month].reasons[col.key] = (cityMap[city].byMonth[month].reasons[col.key] || 0) + v;
            }
          }

          if (city && v > 0) {
            worstPairs.push({ city, reason: label, type: col.type, value: v });
          }
        }

        if (inPrev) {
          if (col.type) byTypePrev[col.type] += v;
          const label = col.label || col.key;
          if (!reasonMap[label]) reasonMap[label] = { label, key: col.key, type: col.type, total: 0, prev: 0 };
          reasonMap[label].prev += v;
          if (month) {
            if (!monthMapPrev[month]) monthMapPrev[month] = { total: 0, types: { "Дженерики": 0, "Фин": 0, "Сервис": 0 } };
            monthMapPrev[month].total += v;
            if (col.type) monthMapPrev[month].types[col.type] += v;
          }
        }
      }

      if (inCurrent) {
        total += rowTotal;
        if (city) cityMap[city].total += rowTotal;
      }
      if (inPrev) {
        totalPrev += rowTotal;
        if (city) cityMap[city].prev += rowTotal;
      }
    }

    const cityTotals: CityTotal[] = Object.entries(cityMap)
      .map(([city, c]) => ({ city, total: c.total, prev: c.prev }))
      .sort((a, b) => a.total - b.total);

    for (const [city, c] of Object.entries(cityMap)) {
      for (const [month, mb] of Object.entries(c.byMonth)) {
        if (mb.total > 0) {
          cityMonthCells.push({
            city,
            month,
            value: mb.total,
            types: {
              "Дженерики": mb.types["Дженерики"] || 0,
              "Фин": mb.types["Фин"] || 0,
              "Сервис": mb.types["Сервис"] || 0,
            },
            reasons: mb.reasons || {},
          });
        }
      }
    }

    const reasons = Object.values(reasonMap).sort((a, b) => b.total - a.total);

    const monthsData: MonthBucket[] = sortedMonths
      .filter(m => currentMonths.includes(m))
      .map(m => ({
        month: m,
        short: m.slice(0, 3),
        total: monthMap[m]?.total || 0,
        "Дженерики": monthMap[m]?.types["Дженерики"] || 0,
        "Фин": monthMap[m]?.types["Фин"] || 0,
        "Сервис": monthMap[m]?.types["Сервис"] || 0,
      }));

    // Top type/city/reason
    const topType = (Object.entries(byType) as [ClinicErrorType, number][])
      .sort((a, b) => b[1] - a[1])[0];
    const topCity = [...cityTotals].sort((a, b) => b.total - a.total)[0];
    const topReason = reasons[0];

    // City profile
    const cityProfiles: Record<string, CityProfile> = {};
    for (const [city, c] of Object.entries(cityMap)) {
      cityProfiles[city] = {
        city,
        total: c.total,
        byType: c.byType,
        byReason: Object.entries(c.byReason)
          .map(([label, r]) => ({ label, value: r.value, type: r.type }))
          .sort((a, b) => b.value - a.value),
        byMonth: sortedMonths
          .filter(m => currentMonths.includes(m))
          .map(m => ({
            month: m,
            short: m.slice(0, 3),
            total: c.byMonth[m]?.total || 0,
            "Дженерики": c.byMonth[m]?.types["Дженерики"] || 0,
            "Фин": c.byMonth[m]?.types["Фин"] || 0,
            "Сервис": c.byMonth[m]?.types["Сервис"] || 0,
          })),
      };
    }

    // Anomalies (city with biggest growth vs prev)
    const anomalies = cityTotals
      .filter(c => c.prev > 0 && c.total > c.prev)
      .map(c => ({ ...c, growthPct: ((c.total - c.prev) / c.prev) * 100 }))
      .sort((a, b) => b.growthPct - a.growthPct)
      .slice(0, 3);

    // Concentration: top-3 cities share
    const sortedByTotalDesc = [...cityTotals].sort((a, b) => b.total - a.total);
    const top3CitiesSum = sortedByTotalDesc.slice(0, 3).reduce((s, c) => s + c.total, 0);
    const concentrationPct = total > 0 ? (top3CitiesSum / total) * 100 : 0;

    // Worst city + reason pair
    const worstPair = worstPairs.sort((a, b) => b.value - a.value)[0] || null;

    // Forecast: average of last 3 months -> next month
    let forecast: number | null = null;
    let forecastDirection: "up" | "down" | "flat" = "flat";
    if (monthsData.length >= 2) {
      const last3 = monthsData.slice(-3);
      const avg = last3.reduce((s, m) => s + m.total, 0) / last3.length;
      forecast = Math.round(avg);
      const lastVal = monthsData[monthsData.length - 1].total;
      if (forecast > lastVal * 1.05) forecastDirection = "up";
      else if (forecast < lastVal * 0.95) forecastDirection = "down";
    }

    // Heatmap rows: all cities (sorted by total desc) × months
    const heatmapCities = sortedByTotalDesc.map(c => c.city);
    const heatmapMaxValue = Math.max(0, ...cityMonthCells.map(c => c.value));

    const totalCities = cityTotals.length;
    const minCityVal = cityTotals[0]?.total ?? 0;
    const maxCityVal = cityTotals[totalCities - 1]?.total ?? 0;
    const avgCity = totalCities > 0 ? total / totalCities : 0;
    const best3 = cityTotals.slice(0, 3);
    const worst3 = [...cityTotals].slice(-3).reverse();
    const belowAvg = cityTotals.filter(c => c.total <= avgCity).length;
    const aboveAvg = cityTotals.filter(c => c.total > avgCity).length;

    const typesData = (Object.entries(byType) as [ClinicErrorType, number][])
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    // Department change vs prev
    const typeChange: Record<ClinicErrorType, { value: number; prev: number; deltaPct: number }> = {
      "Дженерики": { value: byType["Дженерики"], prev: byTypePrev["Дженерики"], deltaPct: byTypePrev["Дженерики"] > 0 ? ((byType["Дженерики"] - byTypePrev["Дженерики"]) / byTypePrev["Дженерики"]) * 100 : 0 },
      "Фин": { value: byType["Фин"], prev: byTypePrev["Фин"], deltaPct: byTypePrev["Фин"] > 0 ? ((byType["Фин"] - byTypePrev["Фин"]) / byTypePrev["Фин"]) * 100 : 0 },
      "Сервис": { value: byType["Сервис"], prev: byTypePrev["Сервис"], deltaPct: byTypePrev["Сервис"] > 0 ? ((byType["Сервис"] - byTypePrev["Сервис"]) / byTypePrev["Сервис"]) * 100 : 0 },
    };

    const totalDeltaPct = totalPrev > 0 ? ((total - totalPrev) / totalPrev) * 100 : 0;

    return {
      total,
      totalPrev,
      totalDeltaPct,
      byType,
      typeChange,
      cityTotals,
      reasons,
      monthsData,
      heatmapCities,
      cityMonthCells,
      heatmapMaxValue,
      currentMonths,
      prevMonths,
      sortedMonths,
      topType: topType && topType[1] > 0 ? { name: topType[0], value: topType[1] } : null,
      topCity: topCity && topCity.total > 0 ? topCity : null,
      topReason: topReason && topReason.total > 0 ? topReason : null,
      typesData,
      totalCities,
      minCityVal,
      maxCityVal,
      avgCity,
      best3,
      worst3,
      belowAvg,
      aboveAvg,
      cityProfiles,
      anomalies,
      concentrationPct,
      worstPair,
      forecast,
      forecastDirection,
      activeColumns,
    };
  }, [rows, columns, filters]);
}