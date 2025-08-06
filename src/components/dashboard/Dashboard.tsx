
import { useState, useEffect } from "react";
import { StatCard, formatCurrency } from "./StatCard";
import { FinancialChart } from "./FinancialChart";
import { ExpenseChart } from "./ExpenseChart";
import { TransactionForm } from "./TransactionForm";
import { BudgetGoals } from "./BudgetGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  Calculator,
  Bot,
  Calendar,
  Coins,
  FileText,
  AlertTriangle,
  TrendingUp as Growth,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SIPCalculator } from "../financial/SIPCalculator";
import { AIInsights } from "../financial/AIInsights";
import { CalendarView } from "../financial/CalendarView";
import { CryptoCurrencyTracker } from "../financial/CryptoCurrencyTracker";
import { MonthlyReport } from "../financial/MonthlyReport";
import { SmartAlerts } from "../financial/SmartAlerts";
import { SavingsGrowthCalculator } from "../financial/SavingsGrowthCalculator";
import { TaxCalculator } from "../financial/TaxCalculator";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date: string;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetGoals, setShowBudgetGoals] = useState(false);

  // Fetch transactions
  const { data: transactionsData, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        amount: Number(item.amount),
        category: item.category,
        description: item.description || '',
        type: item.type as 'income' | 'expense',
        date: item.date
      }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData);
    }
  }, [transactionsData]);

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          type: transaction.type,
          date: transaction.date
        }]);

      if (error) {
        console.error('Error adding transaction:', error);
        return;
      }

      await refetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

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
    "#8B5CF6", "#A855F7", "#C084FC", "#D8B4FE", "#E9D5FF", 
    "#F3E8FF", "#7C3AED", "#9333EA", "#A855F7", "#B45ECC"
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

  // Sample budget goals for SmartAlerts
  const budgetGoals = [
    { category: "Food & Dining", amount: 15000 },
    { category: "Transportation", amount: 8000 },
    { category: "Entertainment", amount: 5000 }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: DollarSign },
    { id: "sip", label: "SIP Calculator", icon: Calculator },
    { id: "ai", label: "AI Insights", icon: Bot },
    { id: "calendar", label: "Calendar View", icon: Calendar },
    { id: "crypto", label: "Crypto Tracker", icon: Coins },
    { id: "reports", label: "Monthly Report", icon: FileText },
    { id: "alerts", label: "Smart Alerts", icon: AlertTriangle },
    { id: "growth", label: "Savings Growth", icon: Growth },
    { id: "tax", label: "Tax Calculator", icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Finance Tracker
              </h1>
              <p className="text-muted-foreground text-sm">
                Welcome back, {user?.email}
              </p>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 h-auto p-2 bg-card/50 backdrop-blur-sm">
            {menuItems.map((item) => (
              <TabsTrigger 
                key={item.id} 
                value={item.id} 
                className="flex flex-col items-center gap-1 p-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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

            {/* Transaction Form and Budget Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowBudgetGoals(true)}
                  variant="outline"
                  className="w-full"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Manage Budget Goals
                </Button>
              </div>
            </div>

            <TransactionForm 
              onAddTransaction={handleAddTransaction}
              isOpen={showTransactionForm}
              onToggle={() => setShowTransactionForm(!showTransactionForm)}
            />

            <BudgetGoals 
              isOpen={showBudgetGoals}
              onToggle={() => setShowBudgetGoals(!showBudgetGoals)}
              expenses={expenseData}
            />

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
          </TabsContent>

          <TabsContent value="sip">
            <SIPCalculator />
          </TabsContent>

          <TabsContent value="ai">
            <AIInsights transactions={transactions} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView transactions={transactions} />
          </TabsContent>

          <TabsContent value="crypto">
            <CryptoCurrencyTracker />
          </TabsContent>

          <TabsContent value="reports">
            <MonthlyReport transactions={transactions} />
          </TabsContent>

          <TabsContent value="alerts">
            <SmartAlerts transactions={transactions} budgetGoals={budgetGoals} />
          </TabsContent>

          <TabsContent value="growth">
            <SavingsGrowthCalculator currentSavings={balance > 0 ? balance : 0} />
          </TabsContent>

          <TabsContent value="tax">
            <TaxCalculator transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
