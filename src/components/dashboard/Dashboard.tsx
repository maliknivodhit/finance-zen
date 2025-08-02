import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, formatCurrency } from "./StatCard";
import { TransactionForm } from "./TransactionForm";
import { ExpenseChart } from "./ExpenseChart";
import { FinancialChart } from "./FinancialChart";
import { BudgetGoals } from "./BudgetGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Receipt,
  Target,
  LogOut,
  Plus,
  Calculator,
  Brain,
  Calendar,
  Coins,
  FileText,
  Bell
} from "lucide-react";
import { TaxCalculator } from "@/components/financial/TaxCalculator";
import { SavingsGrowthCalculator } from "@/components/financial/SavingsGrowthCalculator";
import { SIPCalculator } from "@/components/financial/SIPCalculator";
import { SmartAlerts } from "@/components/financial/SmartAlerts";
import { MonthlyReport } from "@/components/financial/MonthlyReport";
import { CalendarView } from "@/components/financial/CalendarView";
import { AIInsights } from "@/components/financial/AIInsights";
import { CryptoCurrencyTracker } from "@/components/financial/CryptoCurrencyTracker";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [isBudgetGoalsOpen, setIsBudgetGoalsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { user, session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [authLoading, session, navigate]);

  // Load transactions from database
  useEffect(() => {
    if (session?.user) {
      loadTransactions();
    }
  }, [session]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        });
      } else {
        const formattedTransactions = data.map(expense => ({
          id: expense.id,
          type: expense.type as "income" | "expense",
          amount: parseFloat(expense.amount.toString()),
          category: expense.category,
          description: expense.description || "",
          date: expense.date,
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (newTransaction: Omit<Transaction, "id">) => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: session.user.id,
          type: newTransaction.type,
          amount: newTransaction.amount,
          category: newTransaction.category,
          description: newTransaction.description,
          date: newTransaction.date,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add transaction",
          variant: "destructive",
        });
      } else {
        const formattedTransaction = {
          id: data.id,
          type: data.type as "income" | "expense",
          amount: parseFloat(data.amount.toString()),
          category: data.category,
          description: data.description || "",
          date: data.date,
        };
        setTransactions(prev => [formattedTransaction, ...prev]);
        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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

  // Generate monthly financial data for the chart
  const generateMonthlyData = () => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleDateString('en-IN', { 
        month: 'short', 
        year: '2-digit' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      }))
      .slice(-6); // Last 6 months
  };

  const monthlyFinancialData = generateMonthlyData();

  // Expense chart data for pie chart
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                FinanceZen
              </h1>
              <div className="flex gap-2">
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
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
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsBudgetGoalsOpen(true)}
              >
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
            value={formatCurrency(balance)}
            icon={DollarSign}
            variant={balance >= 0 ? "success" : "danger"}
            trend={{ value: 12.5, isPositive: balance >= 0 }}
          />
          <StatCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            icon={TrendingUp}
            variant="success"
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Overview Chart */}
          <FinancialChart data={monthlyFinancialData} />
          
          {/* Expense Breakdown Chart */}
          <ExpenseChart data={expenseChartData} />
        </div>

        {/* Enhanced Features Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tax">Tax Calc</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="sip">SIP Calc</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <Button variant="outline" size="sm">View All</Button>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${transaction.type === "income" ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
                            {transaction.type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.category}</p>
                            <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-danger"}`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <AIInsights transactions={transactions} />
          </TabsContent>

          <TabsContent value="tax"><TaxCalculator transactions={transactions} /></TabsContent>
          <TabsContent value="savings"><SavingsGrowthCalculator currentSavings={balance > 0 ? balance : 0} /></TabsContent>
          <TabsContent value="sip"><SIPCalculator /></TabsContent>
          <TabsContent value="alerts"><SmartAlerts transactions={transactions} budgetGoals={[]} /></TabsContent>
          <TabsContent value="reports"><MonthlyReport transactions={transactions} /></TabsContent>
          <TabsContent value="calendar"><CalendarView transactions={transactions.map(t => ({ ...t, description: t.description || '' }))} /></TabsContent>
          <TabsContent value="crypto"><CryptoCurrencyTracker /></TabsContent>
        </Tabs>
      </section>

      {/* Budget Goals Modal */}
      <BudgetGoals
        isOpen={isBudgetGoalsOpen}
        onToggle={() => setIsBudgetGoalsOpen(!isBudgetGoalsOpen)}
        expenses={Object.entries(expenseByCategory).map(([category, amount]) => ({
          category,
          amount,
        }))}
      />

      {/* Transaction Form */}
      <TransactionForm
        onAddTransaction={addTransaction}
        isOpen={isFormOpen}
        onToggle={() => setIsFormOpen(!isFormOpen)}
      />
    </div>
  );
};