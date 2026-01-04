"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  colors?: string[];
  formatValue?: (value: number) => string;
  formatTooltipValue?: (value: number) => string;
  height?: number;
  layout?: "horizontal" | "vertical";
}

// Default color palette
const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

/**
 * Reusable bar chart component for analytics
 */
export function BarChart({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  color,
  colors = DEFAULT_COLORS,
  formatValue = (v) => v.toLocaleString("id-ID"),
  formatTooltipValue,
  height = 300,
  layout = "horizontal",
}: BarChartProps) {
  // Use formatTooltipValue if provided, otherwise fall back to formatValue
  const tooltipFormatter = formatTooltipValue || formatValue;
  if (data.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
        )}
        <div
          className="flex items-center justify-center text-gray-500"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  const isVertical = layout === "vertical";

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#e5e7eb" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={formatValue}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={{ stroke: "#e5e7eb" }}
                axisLine={{ stroke: "#e5e7eb" }}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
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
            </>
          )}
          <Tooltip
            formatter={(value: number) => [tooltipFormatter(value), "Value"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={color || colors[index % colors.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
