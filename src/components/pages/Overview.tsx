import { useState } from "react";
import { StatCard, formatCurrency } from "../dashboard/StatCard";
import { FinancialChart } from "../dashboard/FinancialChart";
import { ExpenseChart } from "../dashboard/ExpenseChart";
import { BudgetGoals } from "../dashboard/BudgetGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  Plus,
  Target
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: string;
}

interface OverviewProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
}

export const Overview = ({ transactions, onAddTransaction }: OverviewProps) => {
  const [showBudgetGoals, setShowBudgetGoals] = useState(false);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const monthlyChange = transactions.length > 0 ? 
    ((totalIncome - totalExpenses) / Math.max(totalIncome, 1)) * 100 : 0;

  // Process data for charts
  const chartData = transactions.length > 0 ? [
    {
      month: "Current",
      income: totalIncome,
      expenses: totalExpenses,
      savings: balance > 0 ? balance : 0
    }
  ] : [];

  const COLORS = [
    "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", 
    "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
  ];

  const expenseData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction, index) => {
      const existing = acc.find(item => item.category === transaction.category);
      if (existing) {
        existing.amount += transaction.amount;
      } else {
        acc.push({
          category: transaction.category,
          amount: transaction.amount,
          color: COLORS[acc.length % COLORS.length]
        });
      }
      return acc;
    }, [] as { category: string; amount: number; color: string }[]);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={onAddTransaction}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Transaction
        </Button>
        <Button 
          onClick={() => setShowBudgetGoals(true)}
          variant="outline"
          size="lg"
        >
          <Target className="h-5 w-5 mr-2" />
          Manage Budget Goals
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Balance" 
          value={formatCurrency(balance)} 
          icon={DollarSign}
          trend={{
            value: Math.abs(monthlyChange),
            isPositive: monthlyChange >= 0
          }}
          variant={balance >= 0 ? "success" : "danger"}
        />
        <StatCard 
          title="Total Income" 
          value={formatCurrency(totalIncome)} 
          icon={TrendingUp}
          trend={{
            value: 15.2,
            isPositive: true
          }}
          variant="success"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(totalExpenses)} 
          icon={TrendingDown}
          trend={{
            value: 8.1,
            isPositive: false
          }}
          variant="danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialChart data={chartData} />
        <ExpenseChart data={expenseData} />
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-success/20' : 'bg-danger/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Goals Modal */}
      <BudgetGoals 
        isOpen={showBudgetGoals}
        onToggle={() => setShowBudgetGoals(!showBudgetGoals)}
        expenses={expenseData.map(item => ({ category: item.category, amount: item.amount }))}
      />
    </div>
  );
};