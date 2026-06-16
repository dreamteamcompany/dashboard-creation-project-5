import type { ColumnDef, ClinicErrorType } from "@/config/dashboards";

export interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

export const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
] as const;

export const QUARTERS: { value: number; label: string; months: string[] }[] = [
  { value: 1, label: "I квартал", months: ["Январь", "Февраль", "Март"] },
  { value: 2, label: "II квартал", months: ["Апрель", "Май", "Июнь"] },
  { value: 3, label: "III квартал", months: ["Июль", "Август", "Сентябрь"] },
  { value: 4, label: "IV квартал", months: ["Октябрь", "Ноябрь", "Декабрь"] },
];

export function quarterOfMonth(month: string): number {
  const idx = MONTHS.indexOf(month as typeof MONTHS[number]);
  return idx < 0 ? 0 : Math.floor(idx / 3) + 1;
}

export const MONTH_SHORT: Record<string, string> = {
  "Январь": "Янв", "Февраль": "Фев", "Март": "Мар", "Апрель": "Апр",
  "Май": "Май", "Июнь": "Июн", "Июль": "Июл", "Август": "Авг",
  "Сентябрь": "Сен", "Октябрь": "Окт", "Ноябрь": "Ноя", "Декабрь": "Дек",
};

export const TYPE_COLORS: Record<ClinicErrorType, string> = {
  "Дженерики": "#f59e0b",
  "Фин": "#10b981",
  "Сервис": "#8b5cf6",
};

export const TYPE_TEXT: Record<ClinicErrorType, string> = {
  "Дженерики": "text-amber-400",
  "Фин": "text-emerald-400",
  "Сервис": "text-violet-400",
};

export const TYPE_BG: Record<ClinicErrorType, string> = {
  "Дженерики": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Фин": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Сервис": "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

export type Period = "all" | "month" | "quarter" | "year";

export interface Filters {
  period: Period;
  types: ClinicErrorType[];
  month?: string;
  quarter?: number;
}

export const ALL_TYPES: ClinicErrorType[] = ["Дженерики", "Фин", "Сервис"];

export type { ColumnDef, ClinicErrorType };