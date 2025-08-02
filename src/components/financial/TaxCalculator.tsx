import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, IndianRupee, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";

interface TaxCalculatorProps {
  transactions: Array<{
    type: "income" | "expense";
    amount: number;
    category: string;
    date: string;
  }>;
}

// Tax slabs for FY 2024-25 (New Regime)
const TAX_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

const SECTION_80C_LIMIT = 150000;

export const TaxCalculator = ({ transactions }: TaxCalculatorProps) => {
  const [annualIncome, setAnnualIncome] = useState(0);
  const [calculatedTax, setCalculatedTax] = useState(0);
  const [potentialSavings, setPotentialSavings] = useState(0);

  useEffect(() => {
    // Calculate annual income from salary transactions
    const salaryTransactions = transactions.filter(
      t => t.type === "income" && 
      (t.category.toLowerCase().includes("salary") || 
       t.category.toLowerCase().includes("job") ||
       t.category.toLowerCase().includes("work"))
    );

    const monthlyIncomes = salaryTransactions.reduce((acc, t) => {
      const month = new Date(t.date).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const avgMonthlyIncome = Object.values(monthlyIncomes).length > 0 
      ? Object.values(monthlyIncomes).reduce((sum, amount) => sum + amount, 0) / Object.values(monthlyIncomes).length
      : 0;

    const projectedAnnual = avgMonthlyIncome * 12;
    setAnnualIncome(projectedAnnual);
  }, [transactions]);

  useEffect(() => {
    // Calculate tax based on income
    let tax = 0;
    let remainingIncome = annualIncome;

    for (const slab of TAX_SLABS) {
      if (remainingIncome <= 0) break;
      
      const taxableInThisSlab = Math.min(
        remainingIncome,
        slab.max - slab.min
      );
      
      tax += (taxableInThisSlab * slab.rate) / 100;
      remainingIncome -= taxableInThisSlab;
    }

    setCalculatedTax(tax);

    // Calculate potential savings through 80C
    const maxSavings = Math.min(SECTION_80C_LIMIT, annualIncome * 0.3);
    const taxOnSavings = maxSavings * 0.2; // Approx 20% tax rate
    setPotentialSavings(taxOnSavings);
  }, [annualIncome]);

  const effectiveTaxRate = annualIncome > 0 ? (calculatedTax / annualIncome) * 100 : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tax Calculator & Estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Projected Annual Income</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(annualIncome)}
            </p>
          </div>

          <div className="bg-warning-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Estimated Tax</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              {formatCurrency(calculatedTax)}
            </p>
            <p className="text-xs text-muted-foreground">
              {effectiveTaxRate.toFixed(1)}% effective rate
            </p>
          </div>

          <div className="bg-success-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Potential Savings</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(potentialSavings)}
            </p>
            <p className="text-xs text-muted-foreground">via 80C investments</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Tax Saving Suggestions:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
              <span>Invest up to ₹1.5L in ELSS, PPF, or NSC under Section 80C</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
              <span>Health insurance premiums up to ₹25K under Section 80D</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
              <span>Home loan interest deduction under Section 24(b)</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
              <span>NPS contributions up to ₹50K under Section 80CCD(1B)</span>
            </div>
          </div>
        </div>

        {annualIncome === 0 && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Add salary transactions to see accurate tax calculations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};