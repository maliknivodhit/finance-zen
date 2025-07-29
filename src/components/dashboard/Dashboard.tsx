import { useState, useEffect } from "react";
import { StatCard } from "./StatCard";
import { TransactionForm } from "./TransactionForm";
import { ExpenseChart } from "./ExpenseChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Receipt,
  Target,
  Calendar,
  Plus
} from "lucide-react";
import heroImage from "@/assets/finance-hero.jpg";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load transactions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("finance-tracker-transactions");
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem("finance-tracker-transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (newTransaction: Omit<Transaction, "id">) => {
    const transaction = {
      ...newTransaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  // Calculate financial metrics
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  // Calculate expense breakdown
  const expenseByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseChartData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    amount,
    color: "",
  }));

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              FinanceZen
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Take control of your financial future with intelligent tracking and insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="gradient" 
                size="lg"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Transaction
              </Button>
              <Button variant="outline" size="lg">
                <Target className="mr-2 h-5 w-5" />
                Set Budget Goals
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Balance"
            value={`$${balance.toFixed(2)}`}
            icon={DollarSign}
            variant={balance >= 0 ? "success" : "danger"}
            trend={{ value: 12.5, isPositive: balance >= 0 }}
          />
          <StatCard
            title="Total Income"
            value={`$${totalIncome.toFixed(2)}`}
            icon={TrendingUp}
            variant="success"
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
            icon={TrendingDown}
            variant="warning"
            trend={{ value: 3.1, isPositive: false }}
          />
          <StatCard
            title="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            icon={PiggyBank}
            variant={savingsRate >= 20 ? "success" : savingsRate >= 10 ? "warning" : "danger"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Chart */}
          <ExpenseChart data={expenseChartData} />

          {/* Recent Transactions */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 transition-smooth hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === "income" 
                            ? "bg-success-light text-success" 
                            : "bg-danger-light text-danger"
                        }`}>
                          {transaction.type === "income" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === "income" ? "text-success" : "text-danger"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        ${transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start by adding your first transaction</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transaction Form */}
      <TransactionForm
        onAddTransaction={addTransaction}
        isOpen={isFormOpen}
        onToggle={() => setIsFormOpen(!isFormOpen)}
      />
    </div>
  );
};