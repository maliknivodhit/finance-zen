import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Save, Trash2 } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavingsGrowthCalculatorProps {
  currentSavings: number;
}

export const SavingsGrowthCalculator = ({ currentSavings }: SavingsGrowthCalculatorProps) => {
  const [interestRate, setInterestRate] = useState(8);
  const [years, setYears] = useState(10);
  const [monthlyContribution, setMonthlyContribution] = useState(5000);
  const [accountName, setAccountName] = useState("");
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const { toast } = useToast();

  const loadSavedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedAccounts(data || []);
    } catch (error) {
      console.error('Error loading savings accounts:', error);
    }
  };

  const saveAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in to save savings accounts" });
        return;
      }

      if (!accountName.trim()) {
        toast({ title: "Error", description: "Please enter an account name" });
        return;
      }

      const { error } = await supabase
        .from('savings_accounts')
        .insert({
          user_id: user.id,
          account_name: accountName,
          current_balance: currentSavings,
          interest_rate: interestRate,
          monthly_contribution: monthlyContribution
        });

      if (error) throw error;

      await loadSavedAccounts();
      setAccountName("");
      toast({ title: "Success", description: "Savings account saved successfully" });
    } catch (error) {
      console.error('Error saving account:', error);
      toast({ title: "Error", description: "Failed to save savings account" });
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadSavedAccounts();
      toast({ title: "Success", description: "Savings account deleted successfully" });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({ title: "Error", description: "Failed to delete savings account" });
    }
  };

  useEffect(() => {
    loadSavedAccounts();
  }, []);

  const growthData = useMemo(() => {
    const data = [];
    let currentAmount = currentSavings;
    
    for (let year = 0; year <= years; year++) {
      data.push({
        year,
        amount: Math.round(currentAmount),
        contribution: year * monthlyContribution * 12,
        interest: Math.round(currentAmount - currentSavings - (year * monthlyContribution * 12))
      });
      
      // Calculate compound growth for next year
      currentAmount = currentAmount * (1 + interestRate / 100) + (monthlyContribution * 12);
    }
    
    return data;
  }, [currentSavings, interestRate, years, monthlyContribution]);

  const finalAmount = growthData[growthData.length - 1]?.amount || 0;
  const totalContributions = monthlyContribution * 12 * years + currentSavings;
  const totalInterest = finalAmount - totalContributions;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Savings Growth Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="interest-rate">Annual Return (%)</Label>
            <Input
              id="interest-rate"
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              min="1"
              max="30"
              step="0.5"
            />
          </div>
          <div>
            <Label htmlFor="years">Time Period (Years)</Label>
            <Input
              id="years"
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              min="1"
              max="50"
            />
          </div>
          <div>
            <Label htmlFor="monthly">Monthly Addition</Label>
            <Input
              id="monthly"
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., Emergency Fund"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={saveAccount} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Account
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Current Savings</span>
            </div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(currentSavings)}
            </p>
          </div>

          <div className="bg-success-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Future Value</span>
            </div>
            <p className="text-xl font-bold text-success">
              {formatCurrency(finalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              After {years} years
            </p>
          </div>

          <div className="bg-warning-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Interest Earned</span>
            </div>
            <p className="text-xl font-bold text-warning">
              {formatCurrency(totalInterest)}
            </p>
            <p className="text-xs text-muted-foreground">
              Total compound growth
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), "Amount"]}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Total contributions: {formatCurrency(totalContributions)}</p>
          <p>• Interest earned: {formatCurrency(totalInterest)}</p>
          <p>• Effective return: {((finalAmount / totalContributions - 1) * 100).toFixed(1)}%</p>
          <p>• Tax on interest: As per income tax slab rates on interest income</p>
        </div>

        {savedAccounts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Your Saved Accounts</h4>
            <div className="space-y-3">
              {savedAccounts.map((account) => {
                const futureValue = account.current_balance * Math.pow(1 + account.interest_rate / 100, years) + 
                  (account.monthly_contribution * 12 * years);
                const interest = futureValue - account.current_balance - (account.monthly_contribution * 12 * years);
                
                return (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{account.account_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {formatCurrency(account.current_balance)} • {account.interest_rate}% interest
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Monthly: {formatCurrency(account.monthly_contribution)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAccount(account.id)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};