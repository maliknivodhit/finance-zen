import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, PiggyBank, IndianRupee } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
}

interface TaxCalculatorProps {
  transactions: Transaction[];
}

export const TaxCalculator = ({ transactions }: TaxCalculatorProps) => {
  const [annualIncome, setAnnualIncome] = useState(0);
  const [taxLiability, setTaxLiability] = useState(0);
  const [taxSavingSuggestions, setTaxSavingSuggestions] = useState<string[]>([]);

  // Indian tax slabs for 2024-25 (New Tax Regime)
  const calculateTax = (income: number) => {
    let tax = 0;
    
    if (income <= 300000) {
      tax = 0;
    } else if (income <= 700000) {
      tax = (income - 300000) * 0.05;
    } else if (income <= 1000000) {
      tax = 20000 + (income - 700000) * 0.10;
    } else if (income <= 1200000) {
      tax = 50000 + (income - 1000000) * 0.15;
    } else if (income <= 1500000) {
      tax = 80000 + (income - 1200000) * 0.20;
    } else {
      tax = 140000 + (income - 1500000) * 0.30;
    }

    return tax;
  };

  const getTaxSavingSuggestions = (income: number) => {
    const suggestions = [];
    
    if (income > 300000) {
      suggestions.push("Invest ₹1,50,000 in ELSS mutual funds under Section 80C");
      suggestions.push("Consider PPF investment for long-term tax savings");
    }
    
    if (income > 500000) {
      suggestions.push("Health insurance premium up to ₹25,000 under Section 80D");
      suggestions.push("NPS investment up to ₹50,000 under Section 80CCD(1B)");
    }
    
    if (income > 1000000) {
      suggestions.push("Consider House Rent Allowance (HRA) exemption if applicable");
      suggestions.push("Explore tax-saving fixed deposits");
    }

    return suggestions;
  };

  useEffect(() => {
    // Detect salary transactions (assuming salary is regular monthly income)
    const salaryTransactions = transactions.filter(
      t => t.type === 'income' && 
      (t.category.toLowerCase().includes('salary') || 
       t.category.toLowerCase().includes('income') ||
       t.description.toLowerCase().includes('salary'))
    );

    if (salaryTransactions.length > 0) {
      // Calculate average monthly salary and project annually
      const totalSalary = salaryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const avgMonthlySalary = totalSalary / salaryTransactions.length;
      const projectedAnnual = avgMonthlySalary * 12;
      
      setAnnualIncome(projectedAnnual);
      setTaxLiability(calculateTax(projectedAnnual));
      setTaxSavingSuggestions(getTaxSavingSuggestions(projectedAnnual));
    }
  }, [transactions]);

  const taxRate = annualIncome > 0 ? (taxLiability / annualIncome) * 100 : 0;
  const netIncome = annualIncome - taxLiability;

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calculator className="h-5 w-5" />
            Tax Calculator & Income Estimator
          </CardTitle>
          <CardDescription>
            Auto-calculated based on your salary transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Annual Income</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                ₹{annualIncome.toLocaleString('en-IN')}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-danger/10 to-danger/5 border border-danger/20">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-danger" />
                <span className="text-sm font-medium">Tax Liability</span>
              </div>
              <div className="text-2xl font-bold text-danger">
                ₹{taxLiability.toLocaleString('en-IN')}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Net Income</span>
              </div>
              <div className="text-2xl font-bold text-success">
                ₹{netIncome.toLocaleString('en-IN')}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Effective Tax Rate</span>
              </div>
              <div className="text-2xl font-bold text-warning mb-2">
                {taxRate.toFixed(2)}%
              </div>
              <Progress value={taxRate} className="h-2" />
            </div>
          </div>

          {annualIncome > 0 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-success">
                  <PiggyBank className="h-4 w-4" />
                  Tax Saving Suggestions
                </h4>
                <div className="grid gap-3">
                  {taxSavingSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                      <Badge variant="secondary" className="mt-0.5 min-w-fit">
                        {index + 1}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {suggestion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <h4 className="font-semibold mb-3">Tax Breakdown by Slab</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Up to ₹3,00,000</span>
                    <span className="text-success">0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>₹3,00,001 - ₹7,00,000</span>
                    <span>5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>₹7,00,001 - ₹10,00,000</span>
                    <span>10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>₹10,00,001 - ₹12,00,000</span>
                    <span>15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>₹12,00,001 - ₹15,00,000</span>
                    <span>20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Above ₹15,00,000</span>
                    <span className="text-danger">30%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {annualIncome === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No Salary Data Found</h3>
              <p className="mb-2">Add salary transactions to see tax calculations</p>
              <p className="text-sm">Tag transactions with "salary" or "income" category</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};