import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Calendar, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "../dashboard/StatCard";

interface Transaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

interface BudgetGoal {
  category: string;
  amount: number;
}

interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  amount?: number;
  type: "bill" | "investment" | "other";
}

interface SmartAlertsProps {
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
}

export const SmartAlerts = ({ transactions, budgetGoals }: SmartAlertsProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState<{
    title: string;
    dueDate: string;
    amount: string;
    type: "bill" | "investment" | "other";
  }>({
    title: "",
    dueDate: "",
    amount: "",
    type: "bill"
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  // Calculate budget alerts
  const budgetAlerts = budgetGoals.map(goal => {
    const spent = transactions
      .filter(t => t.type === "expense" && t.category === goal.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = (spent / goal.amount) * 100;
    return {
      category: goal.category,
      spent,
      budget: goal.amount,
      percentage,
      isOverBudget: percentage > 100,
      isNearLimit: percentage > 80
    };
  }).filter(alert => alert.isOverBudget || alert.isNearLimit);

  // Calculate upcoming reminders
  const upcomingReminders = reminders.filter(reminder => {
    const dueDate = new Date(reminder.dueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const addReminder = () => {
    if (!newReminder.title || !newReminder.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in title and due date",
        variant: "destructive"
      });
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      dueDate: newReminder.dueDate,
      amount: newReminder.amount ? Number(newReminder.amount) : undefined,
      type: newReminder.type
    };

    setReminders(prev => [...prev, reminder]);
    setNewReminder({ title: "", dueDate: "", amount: "", type: "bill" });
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Reminder added successfully"
    });
  };

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    toast({
      title: "Success",
      description: "Reminder removed"
    });
  };

  useEffect(() => {
    // Check for alerts on component mount
    if (budgetAlerts.length > 0) {
      budgetAlerts.forEach(alert => {
        if (alert.isOverBudget) {
          toast({
            title: "Budget Exceeded!",
            description: `You've exceeded your ${alert.category} budget by ${formatCurrency(alert.spent - alert.budget)}`,
            variant: "destructive"
          });
        } else if (alert.isNearLimit) {
          toast({
            title: "Budget Alert",
            description: `You've used ${alert.percentage.toFixed(0)}% of your ${alert.category} budget`,
            variant: "destructive"
          });
        }
      });
    }
  }, [budgetAlerts.length]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Smart Alerts & Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Budget Alerts
            </h4>
            <div className="space-y-2">
              {budgetAlerts.map(alert => (
                <div 
                  key={alert.category}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.isOverBudget 
                      ? 'bg-danger-light border-danger' 
                      : 'bg-warning-light border-warning'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{alert.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(alert.spent)} / {formatCurrency(alert.budget)}
                      </p>
                    </div>
                    <Badge variant={alert.isOverBudget ? "destructive" : "secondary"}>
                      {alert.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Reminders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming Reminders
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {showAddForm && (
            <div className="mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reminder-title">Title</Label>
                  <Input
                    id="reminder-title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Electric bill, EMI payment..."
                  />
                </div>
                <div>
                  <Label htmlFor="reminder-date">Due Date</Label>
                  <Input
                    id="reminder-date"
                    type="date"
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="reminder-amount">Amount (Optional)</Label>
                  <Input
                    id="reminder-amount"
                    type="number"
                    value={newReminder.amount}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="reminder-type">Type</Label>
                  <select
                    id="reminder-type"
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={newReminder.type}
                    onChange={(e) => setNewReminder(prev => ({ 
                      ...prev, 
                      type: e.target.value as "bill" | "investment" | "other" 
                    }))}
                  >
                    <option value="bill">Bill Payment</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addReminder} size="sm">Add Reminder</Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map(reminder => {
                const daysLeft = Math.ceil(
                  (new Date(reminder.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div 
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-primary/10 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
                        {reminder.amount && ` • ${formatCurrency(reminder.amount)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{reminder.type}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReminder(reminder.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming reminders</p>
              </div>
            )}
          </div>
        </div>

        {budgetAlerts.length === 0 && upcomingReminders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>All good! No alerts at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};