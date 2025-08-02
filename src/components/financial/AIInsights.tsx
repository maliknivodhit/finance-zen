import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, Lightbulb, Target, AlertCircle } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";

interface Transaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

interface AIInsightsProps {
  transactions: Transaction[];
}

interface Insight {
  id: string;
  type: "spending" | "saving" | "optimization" | "trend" | "warning";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  suggestion?: string;
}

export const AIInsights = ({ transactions }: AIInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = () => {
    setLoading(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const newInsights: Insight[] = [];

      // Analyze spending patterns
      const expensesByCategory = transactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
      const highestCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)[0];

      // Generate insights based on patterns
      if (highestCategory && (highestCategory[1] / totalExpenses) > 0.4) {
        newInsights.push({
          id: "high-category",
          type: "warning",
          title: "High Spending in One Category",
          description: `${highestCategory[0]} accounts for ${((highestCategory[1] / totalExpenses) * 100).toFixed(0)}% of your total expenses.`,
          impact: "high",
          actionable: true,
          suggestion: `Consider setting a budget limit for ${highestCategory[0]} and track daily spending in this category.`
        });
      }

      // Analyze monthly trends
      const monthlyData = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toISOString().slice(0, 7);
        if (!acc[month]) acc[month] = { income: 0, expense: 0 };
        if (t.type === 'income') acc[month].income += t.amount;
        else acc[month].expense += t.amount;
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      const months = Object.keys(monthlyData).sort();
      if (months.length >= 2) {
        const currentMonth = monthlyData[months[months.length - 1]];
        const prevMonth = monthlyData[months[months.length - 2]];
        
        const expenseChange = ((currentMonth.expense - prevMonth.expense) / prevMonth.expense) * 100;
        
        if (expenseChange > 20) {
          newInsights.push({
            id: "spending-increase",
            type: "warning",
            title: "Spending Increase Detected",
            description: `Your expenses increased by ${expenseChange.toFixed(0)}% this month compared to last month.`,
            impact: "high",
            actionable: true,
            suggestion: "Review your recent transactions and identify unexpected or one-time expenses. Consider creating alerts for future spending."
          });
        } else if (expenseChange < -10) {
          newInsights.push({
            id: "spending-decrease",
            type: "saving",
            title: "Great Job on Reducing Expenses!",
            description: `You've reduced your expenses by ${Math.abs(expenseChange).toFixed(0)}% this month.`,
            impact: "high",
            actionable: false,
            suggestion: "Keep up the good work! Consider investing the saved amount."
          });
        }
      }

      // Weekend vs weekday spending analysis
      const weekendSpending = transactions
        .filter(t => {
          const day = new Date(t.date).getDay();
          return t.type === "expense" && (day === 0 || day === 6);
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const weekdaySpending = transactions
        .filter(t => {
          const day = new Date(t.date).getDay();
          return t.type === "expense" && day > 0 && day < 6;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const weekendDays = transactions
        .filter(t => {
          const day = new Date(t.date).getDay();
          return day === 0 || day === 6;
        })
        .map(t => t.date)
        .filter((date, index, arr) => arr.indexOf(date) === index).length;

      const weekdayDays = transactions
        .filter(t => {
          const day = new Date(t.date).getDay();
          return day > 0 && day < 6;
        })
        .map(t => t.date)
        .filter((date, index, arr) => arr.indexOf(date) === index).length;

      if (weekendDays > 0 && weekdayDays > 0) {
        const avgWeekendSpending = weekendSpending / weekendDays;
        const avgWeekdaySpending = weekdaySpending / weekdayDays;

        if (avgWeekendSpending > avgWeekdaySpending * 1.5) {
          newInsights.push({
            id: "weekend-spending",
            type: "optimization",
            title: "High Weekend Spending",
            description: `You spend ${((avgWeekendSpending / avgWeekdaySpending - 1) * 100).toFixed(0)}% more on weekends than weekdays.`,
            impact: "medium",
            actionable: true,
            suggestion: "Plan weekend activities in advance and set a weekend spending budget to avoid impulse purchases."
          });
        }
      }

      // Savings rate analysis
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

      if (savingsRate < 10) {
        newInsights.push({
          id: "low-savings",
          type: "warning",
          title: "Low Savings Rate",
          description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of income.`,
          impact: "high",
          actionable: true,
          suggestion: "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Start by reducing discretionary spending."
        });
      } else if (savingsRate > 30) {
        newInsights.push({
          id: "high-savings",
          type: "saving",
          title: "Excellent Savings Rate!",
          description: `Your savings rate of ${savingsRate.toFixed(1)}% is well above average.`,
          impact: "high",
          actionable: true,
          suggestion: "Consider investing your excess savings in SIP/mutual funds for long-term wealth creation."
        });
      }

      // Best time to pay bills analysis
      const billCategories = ['utilities', 'rent', 'internet', 'phone', 'insurance'];
      const billTransactions = transactions.filter(t => 
        t.type === "expense" && 
        billCategories.some(category => 
          t.category.toLowerCase().includes(category)
        )
      );

      if (billTransactions.length > 0) {
        const paymentDays = billTransactions.map(t => new Date(t.date).getDate());
        const avgPaymentDay = paymentDays.reduce((sum, day) => sum + day, 0) / paymentDays.length;

        if (avgPaymentDay > 20) {
          newInsights.push({
            id: "bill-timing",
            type: "optimization",
            title: "Optimize Bill Payment Timing",
            description: "You typically pay bills late in the month, which might affect cash flow.",
            impact: "medium",
            actionable: true,
            suggestion: "Consider paying bills early in the month to better manage cash flow and avoid late fees."
          });
        }
      }

      setInsights(newInsights);
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    if (transactions.length > 0) {
      generateInsights();
    }
  }, [transactions]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'saving': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'optimization': return <Target className="h-4 w-4 text-primary" />;
      case 'trend': return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
      case 'spending': return <TrendingDown className="h-4 w-4 text-danger" />;
      default: return <Lightbulb className="h-4 w-4 text-primary" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'bg-warning-light border-l-warning';
      case 'saving': return 'bg-success-light border-l-success';
      case 'optimization': return 'bg-primary/10 border-l-primary';
      case 'trend': return 'bg-muted/30 border-l-muted-foreground';
      case 'spending': return 'bg-danger-light border-l-danger';
      default: return 'bg-muted/30 border-l-muted-foreground';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Powered Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your financial patterns...</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No insights available yet</p>
            <Button onClick={generateInsights} variant="outline">
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map(insight => (
              <div 
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-semibold">{insight.title}</h4>
                  </div>
                  <Badge 
                    variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}
                  >
                    {insight.impact} impact
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.description}
                </p>
                
                {insight.suggestion && insight.actionable && (
                  <div className="bg-background/50 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium mb-1">Suggestion:</p>
                        <p className="text-sm text-muted-foreground">{insight.suggestion}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button 
                onClick={generateInsights} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="w-full"
              >
                <Brain className="h-4 w-4 mr-2" />
                Refresh Insights
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};