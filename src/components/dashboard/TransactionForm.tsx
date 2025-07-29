import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const categories = {
  income: ["Salary", "Freelance", "Investment", "Other Income"],
  expense: ["Food & Dining", "Transportation", "Shopping", "Entertainment", "Bills & Utilities", "Healthcare", "Other"]
};

export const TransactionForm = ({ onAddTransaction, isOpen, onToggle }: TransactionFormProps) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const transaction = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    };

    onAddTransaction(transaction);
    
    // Reset form
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date().toISOString().split('T')[0]);
    
    toast({
      title: "Transaction Added",
      description: `${type === "income" ? "Income" : "Expense"} of $${amount} has been recorded.`,
    });
    
    onToggle();
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={onToggle} 
        variant="gradient" 
        size="lg"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-strong z-50"
      >
        <Plus className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Transaction</CardTitle>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "income" ? "success" : "outline"}
                onClick={() => setType("income")}
                className="w-full"
              >
                Income
              </Button>
              <Button
                type="button"
                variant={type === "expense" ? "danger" : "outline"}
                onClick={() => setType("expense")}
                className="w-full"
              >
                Expense
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[type].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full">
              Add Transaction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};