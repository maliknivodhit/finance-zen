import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  monthlyLimit: number;
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
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { session } = useAuth();
  const { toast } = useToast();

  // Load budget goals from database
  useEffect(() => {
    if (session?.user && isOpen) {
      loadBudgetGoals();
    }
  }, [session, isOpen]);

  const loadBudgetGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_goals')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load budget goals",
          variant: "destructive",
        });
      } else {
        const formattedGoals = data.map(goal => ({
          id: goal.id,
          category: goal.category,
          monthlyLimit: parseFloat(goal.monthly_limit.toString()),
        }));
        setBudgetGoals(formattedGoals);
      }
    } catch (error) {
      console.error('Error loading budget goals:', error);
    }
  };

  const addBudgetGoal = async () => {
    if (!session?.user || !category || !monthlyLimit) {
      toast({
        title: "Missing Information",
        description: "Please select a category and enter a budget limit.",
        variant: "destructive",
      });
      return;
    }

    // Check if goal already exists for this category
    const existingGoal = budgetGoals.find(goal => goal.category === category);
    if (existingGoal) {
      toast({
        title: "Goal Already Exists",
        description: "A budget goal for this category already exists.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_goals')
        .insert({
          user_id: session.user.id,
          category: category,
          monthly_limit: parseFloat(monthlyLimit),
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add budget goal",
          variant: "destructive",
        });
      } else {
        const newGoal: BudgetGoal = {
          id: data.id,
          category: data.category,
          monthlyLimit: parseFloat(data.monthly_limit.toString()),
        };
        setBudgetGoals(prev => [...prev, newGoal]);
        setCategory("");
        setMonthlyLimit("");
        toast({
          title: "Success",
          description: `Budget goal of ${formatCurrency(parseFloat(monthlyLimit))} set for ${category}.`,
        });
      }
    } catch (error) {
      console.error('Error adding budget goal:', error);
      toast({
        title: "Error",
        description: "Failed to add budget goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBudgetGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove budget goal",
          variant: "destructive",
        });
      } else {
        setBudgetGoals(prev => prev.filter(goal => goal.id !== id));
        toast({
          title: "Success",
          description: "Budget goal removed successfully",
        });
      }
    } catch (error) {
      console.error('Error removing budget goal:', error);
      toast({
        title: "Error",
        description: "Failed to remove budget goal",
        variant: "destructive",
      });
    }
  };

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
                <Label htmlFor="monthly-limit">Monthly Budget (₹)</Label>
                <Input
                  id="monthly-limit"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={addBudgetGoal} variant="gradient" className="w-full" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? 'Adding...' : 'Add Budget Goal'}
            </Button>
          </div>

          {/* Existing Goals */}
          <div className="space-y-4">
            <h3 className="font-medium">Current Budget Goals</h3>
            {budgetGoals.length > 0 ? (
              <div className="space-y-3">
                {budgetGoals.map((goal) => {
                  const currentExpense = expenses
                    .filter(e => e.category === goal.category)
                    .reduce((sum, e) => sum + e.amount, 0);
                  
                  const progress = goal.monthlyLimit > 0 ? (currentExpense / goal.monthlyLimit) * 100 : 0;
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
                            {formatCurrency(currentExpense)} of {formatCurrency(goal.monthlyLimit)}
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
                            onClick={() => removeBudgetGoal(goal.id)}
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
                          ⚠️ Over budget by {formatCurrency(currentExpense - goal.monthlyLimit)}
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
