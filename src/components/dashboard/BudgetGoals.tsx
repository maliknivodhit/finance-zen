import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { X, Target, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "./StatCard";

interface BudgetGoal {
  id: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  month: string;
}

interface BudgetGoalsProps {
  isOpen: boolean;
  onToggle: () => void;
  expenses: { category: string; amount: number }[];
}

const expenseCategories = [
  "Food & Dining", 
  "Transportation", 
  "Shopping", 
  "Entertainment", 
  "Bills & Utilities", 
  "Healthcare", 
  "Other"
];

export const BudgetGoals = ({ isOpen, onToggle, expenses }: BudgetGoalsProps) => {
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>(() => {
    const saved = localStorage.getItem("finance-tracker-budget-goals");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [category, setCategory] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const { toast } = useToast();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  const saveBudgetGoals = (goals: BudgetGoal[]) => {
    setBudgetGoals(goals);
    localStorage.setItem("finance-tracker-budget-goals", JSON.stringify(goals));
  };

  const addBudgetGoal = () => {
    if (!category || !targetAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a category and enter a target amount.",
        variant: "destructive",
      });
      return;
    }

    const existingGoal = budgetGoals.find(
      goal => goal.category === category && goal.month === currentMonth
    );

    if (existingGoal) {
      toast({
        title: "Goal Already Exists",
        description: "A budget goal for this category already exists this month.",
        variant: "destructive",
      });
      return;
    }

    const currentExpense = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);

    const newGoal: BudgetGoal = {
      id: Date.now().toString(),
      category,
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentExpense,
      month: currentMonth,
    };

    saveBudgetGoals([...budgetGoals, newGoal]);
    setCategory("");
    setTargetAmount("");
    
    toast({
      title: "Budget Goal Set",
      description: `Budget goal of ${formatCurrency(parseFloat(targetAmount))} set for ${category}.`,
    });
  };

  const deleteBudgetGoal = (id: string) => {
    saveBudgetGoals(budgetGoals.filter(goal => goal.id !== id));
    toast({
      title: "Goal Deleted",
      description: "Budget goal has been removed.",
    });
  };

  // Update current amounts based on expenses
  const updatedGoals = budgetGoals.map(goal => {
    const currentExpense = expenses
      .filter(e => e.category === goal.category)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return { ...goal, currentAmount: currentExpense };
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget Goals
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Goal Form */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Set New Budget Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-amount">Monthly Budget (₹)</Label>
                <Input
                  id="target-amount"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addBudgetGoal} variant="gradient" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Budget Goal
            </Button>
          </div>

          {/* Existing Goals */}
          <div className="space-y-4">
            <h3 className="font-medium">Current Month Goals</h3>
            {updatedGoals.length > 0 ? (
              <div className="space-y-3">
                {updatedGoals.map((goal) => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isOverBudget = progress > 100;
                  
                  return (
                    <div 
                      key={goal.id}
                      className="p-4 border rounded-lg bg-card/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{goal.category}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            isOverBudget 
                              ? "bg-danger-light text-danger" 
                              : progress > 80 
                                ? "bg-warning-light text-warning"
                                : "bg-success-light text-success"
                          }`}>
                            {progress.toFixed(0)}%
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteBudgetGoal(goal.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-danger"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-2 ${isOverBudget ? '[&>div]:bg-danger' : progress > 80 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                      />
                      
                      {isOverBudget && (
                        <p className="text-sm text-danger">
                          ⚠️ Over budget by {formatCurrency(goal.currentAmount - goal.targetAmount)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No budget goals set</p>
                <p className="text-sm">Set your first budget goal to track spending</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
