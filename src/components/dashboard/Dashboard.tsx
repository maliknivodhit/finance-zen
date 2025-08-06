import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../layout/DashboardLayout";
import { Overview } from "../pages/Overview";
import { TransactionForm } from "./TransactionForm";
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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [showTransactionForm, setShowTransactionForm] = useState(false);

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

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (section === "add-transaction") {
      setShowTransactionForm(true);
    }
  };

  const handleAddTransactionClick = () => {
    setShowTransactionForm(true);
  };

  // Sample budget goals for SmartAlerts
  const budgetGoals = [
    { category: "Food & Dining", amount: 15000 },
    { category: "Transportation", amount: 8000 },
    { category: "Entertainment", amount: 5000 }
  ];

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <Overview 
            transactions={transactions} 
            onAddTransaction={handleAddTransactionClick}
          />
        );
      case "sip":
        return <SIPCalculator />;
      case "ai":
        return <AIInsights transactions={transactions} />;
      case "calendar":
        return <CalendarView transactions={transactions} />;
      case "crypto":
        return <CryptoCurrencyTracker />;
      case "reports":
        return <MonthlyReport transactions={transactions} />;
      case "alerts":
        return <SmartAlerts transactions={transactions} budgetGoals={budgetGoals} />;
      case "growth":
        return <SavingsGrowthCalculator currentSavings={balance > 0 ? balance : 0} />;
      case "tax":
        return <TaxCalculator transactions={transactions} />;
      default:
        return (
          <Overview 
            transactions={transactions} 
            onAddTransaction={handleAddTransactionClick}
          />
        );
    }
  };

  return (
    <DashboardLayout 
      activeSection={activeSection} 
      onSectionChange={handleSectionChange}
    >
      {renderContent()}
      
      <TransactionForm 
        onAddTransaction={handleAddTransaction}
        isOpen={showTransactionForm}
        onToggle={() => setShowTransactionForm(!showTransactionForm)}
      />
    </DashboardLayout>
  );
};