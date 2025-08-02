import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Transaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

interface MonthlyReportProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--success))', 
  'hsl(var(--warning))', 
  'hsl(var(--danger))',
  'hsl(var(--muted))',
  'hsl(var(--accent))'
];

export const MonthlyReport = ({ transactions }: MonthlyReportProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthlyData = useMemo(() => {
    const currentMonthTransactions = transactions.filter(t => {
      const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
      return transactionMonth === selectedMonth;
    });

    const previousMonth = new Date(selectedMonth + '-01');
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const previousMonthTransactions = transactions.filter(t => {
      const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
      return transactionMonth === prevMonthStr;
    });

    // Current month calculations
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = currentIncome - currentExpenses;

    // Previous month calculations for comparison
    const prevIncome = previousMonthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const prevExpenses = previousMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const pieData = Object.entries(categoryExpenses).map(([category, amount]) => ({
      name: category,
      value: amount
    }));

    // Daily spending trend
    const dailySpending = currentMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        const day = new Date(t.date).getDate();
        acc[day] = (acc[day] || 0) + t.amount;
        return acc;
      }, {} as Record<number, number>);

    const trendData = Object.entries(dailySpending).map(([day, amount]) => ({
      day: Number(day),
      amount
    })).sort((a, b) => a.day - b.day);

    return {
      currentIncome,
      currentExpenses,
      currentBalance,
      prevIncome,
      prevExpenses,
      pieData,
      trendData,
      incomeChange: prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0,
      expenseChange: prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0,
      transactionCount: currentMonthTransactions.length
    };
  }, [transactions, selectedMonth]);

  const generatePDF = () => {
    // Simple PDF generation - in real app, use jsPDF or similar
    const content = `
      Monthly Financial Report - ${new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      
      Summary:
      Income: ${formatCurrency(monthlyData.currentIncome)}
      Expenses: ${formatCurrency(monthlyData.currentExpenses)}
      Net Balance: ${formatCurrency(monthlyData.currentBalance)}
      
      Category Breakdown:
      ${monthlyData.pieData.map(item => `${item.name}: ${formatCurrency(item.value)}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const availableMonths = useMemo(() => {
    const months = new Set(
      transactions.map(t => new Date(t.date).toISOString().slice(0, 7))
    );
    return Array.from(months).sort().reverse();
  }, [transactions]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Monthly Financial Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <label htmlFor="month-select" className="text-sm font-medium">Select Month:</label>
            <select
              id="month-select"
              className="ml-2 p-2 border border-input rounded-md bg-background"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={generatePDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success-light p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Income</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(monthlyData.currentIncome)}
                </p>
              </div>
              <Badge variant={monthlyData.incomeChange >= 0 ? "default" : "destructive"}>
                {monthlyData.incomeChange >= 0 ? "+" : ""}{monthlyData.incomeChange.toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className="bg-warning-light p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Expenses</p>
                <p className="text-xl font-bold text-warning">
                  {formatCurrency(monthlyData.currentExpenses)}
                </p>
              </div>
              <Badge variant={monthlyData.expenseChange <= 0 ? "default" : "destructive"}>
                {monthlyData.expenseChange >= 0 ? "+" : ""}{monthlyData.expenseChange.toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${monthlyData.currentBalance >= 0 ? 'bg-success-light' : 'bg-danger-light'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Net Balance</p>
                <p className={`text-xl font-bold ${monthlyData.currentBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(monthlyData.currentBalance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{monthlyData.transactionCount} transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Breakdown Pie Chart */}
          <div>
            <h4 className="font-semibold mb-3">Expense by Category</h4>
            {monthlyData.pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyData.pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {monthlyData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No expense data for this month
              </div>
            )}
          </div>

          {/* Daily Spending Trend */}
          <div>
            <h4 className="font-semibold mb-3">Daily Spending Trend</h4>
            {monthlyData.trendData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No spending data for this month
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Key Insights</h4>
          <div className="space-y-1 text-sm">
            {monthlyData.currentBalance > 0 ? (
              <p className="text-success">✓ You saved {formatCurrency(monthlyData.currentBalance)} this month</p>
            ) : (
              <p className="text-danger">⚠ You overspent by {formatCurrency(Math.abs(monthlyData.currentBalance))} this month</p>
            )}
            
            {monthlyData.incomeChange > 0 && (
              <p className="text-success">✓ Income increased by {monthlyData.incomeChange.toFixed(1)}% from last month</p>
            )}
            
            {monthlyData.expenseChange < 0 && (
              <p className="text-success">✓ Expenses decreased by {Math.abs(monthlyData.expenseChange).toFixed(1)}% from last month</p>
            )}
            
            {monthlyData.pieData.length > 0 && (
              <p>• Highest expense category: {monthlyData.pieData[0]?.name} ({formatCurrency(monthlyData.pieData[0]?.value)})</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};