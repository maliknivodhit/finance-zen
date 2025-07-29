import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "./StatCard";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface FinancialChartProps {
  data: FinancialData[];
  type?: "bar" | "area";
}

export const FinancialChart = ({ data, type = "area" }: FinancialChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 shadow-medium">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.dataKey === 'income' && '💰 Income: '}
                {entry.dataKey === 'expenses' && '💸 Expenses: '}
                {entry.dataKey === 'savings' && '🏦 Savings: '}
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (type === "bar") {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="savings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    return (
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="income" 
          stroke="#10B981" 
          strokeWidth={2}
          fill="url(#incomeGradient)" 
        />
        <Area 
          type="monotone" 
          dataKey="expenses" 
          stroke="#EF4444" 
          strokeWidth={2}
          fill="url(#expensesGradient)" 
        />
        <Area 
          type="monotone" 
          dataKey="savings" 
          stroke="#3B82F6" 
          strokeWidth={2}
          fill="url(#savingsGradient)" 
        />
      </AreaChart>
    );
  };

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const totalSavings = data.reduce((sum, d) => sum + d.savings, 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Financial Overview</span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success">Income</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown className="h-4 w-4 text-danger" />
              <span className="text-danger">Expenses</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-lg font-semibold text-success">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-semibold text-danger">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Net Savings</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(totalSavings)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No financial data to display</p>
              <p className="text-sm">Add some transactions to see your financial trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};