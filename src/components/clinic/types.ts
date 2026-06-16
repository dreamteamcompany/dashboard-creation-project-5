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
}

export const ALL_TYPES: ClinicErrorType[] = ["Дженерики", "Фин", "Сервис"];

export type { ColumnDef, ClinicErrorType };