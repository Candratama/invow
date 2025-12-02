"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  height?: number;
}

/**
 * Reusable line chart component for analytics
 */
export function LineChart({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  color = "#3b82f6",
  formatValue = (v) => v.toLocaleString("id-ID"),
  formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  },
  height = 300,
}: LineChartProps) {
  // Format data for Recharts
  const chartData = data.map((d) => ({
    date: d.date,
    displayDate: formatDate(d.date),
    value: d.value,
  }));

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={{ stroke: "#e5e7eb" }}
            axisLine={{ stroke: "#e5e7eb" }}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: "bottom", offset: -5 }
                : undefined
            }
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={{ stroke: "#e5e7eb" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickFormatter={formatValue}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                  }
                : undefined
            }
          />
          <Tooltip
            formatter={(value: number) => [formatValue(value), "Value"]}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: color }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
