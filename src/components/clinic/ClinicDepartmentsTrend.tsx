import Icon from "@/components/ui/icon";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { MonthBucket } from "./useClinicStats";
import { ALL_TYPES, TYPE_COLORS } from "./types";
import CustomTooltip from "./CustomTooltip";

interface Props {
  monthsData: MonthBucket[];
}

export default function ClinicDepartmentsTrend({ monthsData }: Props) {
  if (monthsData.length === 0) return null;
  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-base sm:text-lg">Динамика по отделам</h3>
          <p className="text-white/40 text-xs">Кто растёт, а кто падает</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon name="LineChart" size={18} />
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="short" stroke="rgba(255,255,255,0.4)" fontSize={11} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
            {ALL_TYPES.map(t => (
              <Line
                key={t}
                type="monotone"
                dataKey={t}
                stroke={TYPE_COLORS[t]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: TYPE_COLORS[t] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
