import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendPoint = { t: string; value: number };

export function TrendChart({
  data,
  color = "#22c3a6",
  label,
}: {
  data: TrendPoint[];
  color?: string;
  label: string;
}) {
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="t" hide />
          <YAxis hide domain={[0, "dataMax + 20"]} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#grad)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
