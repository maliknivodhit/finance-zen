import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseChartProps {
  data: ExpenseData[];
}

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#F97316", // Orange
  "#06B6D4", // Cyan
];

export const ExpenseChart = ({ data }: ExpenseChartProps) => {
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="glass-card p-3 shadow-medium">
          <p className="font-medium">{data.payload.category}</p>
          <p className="text-primary">${data.payload.amount.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>No expense data to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};