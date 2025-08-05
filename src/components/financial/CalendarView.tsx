import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";

interface Transaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface CalendarViewProps {
  transactions: Transaction[];
}

export const CalendarView = ({ transactions }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const data: Record<string, { income: number; expense: number; transactions: Transaction[] }> = {};

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
        const dateKey = transaction.date;
        if (!data[dateKey]) {
          data[dateKey] = { income: 0, expense: 0, transactions: [] };
        }
        
        if (transaction.type === 'income') {
          data[dateKey].income += transaction.amount;
        } else {
          data[dateKey].expense += transaction.amount;
        }
        data[dateKey].transactions.push(transaction);
      }
    });

    return data;
  }, [transactions, currentMonth, currentYear]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const getDayData = (day: number) => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarData[dateKey];
  };

  const getDayColor = (dayData: { income: number; expense: number } | undefined) => {
    if (!dayData) return '';
    
    const netAmount = dayData.income - dayData.expense;
    if (netAmount > 0) return 'bg-success/20 border-success/50';
    if (netAmount < 0) return 'bg-danger/20 border-danger/50';
    if (dayData.income > 0 || dayData.expense > 0) return 'bg-warning/20 border-warning/50';
    return '';
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Generate calendar days array
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDateData = selectedDate ? calendarData[selectedDate] : null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Financial Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">{monthName}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="p-2 h-16"></div>;
            }

            const dayData = getDayData(day);
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateKey;
            const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

            return (
              <div
                key={`day-${day}-${currentMonth}-${currentYear}`}
                className={`p-1 h-16 border border-border/30 rounded-lg cursor-pointer transition-smooth hover:bg-muted/30 ${
                  getDayColor(dayData)
                } ${isSelected ? 'ring-2 ring-primary' : ''} ${isToday ? 'border-primary' : ''}`}
                onClick={() => setSelectedDate(selectedDate === dateKey ? null : dateKey)}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                    {day}
                  </span>
                  {dayData && (
                    <div className="flex-1 flex flex-col justify-end">
                      {dayData.income > 0 && (
                        <div className="text-xs text-success">+{(dayData.income / 1000).toFixed(0)}k</div>
                      )}
                      {dayData.expense > 0 && (
                        <div className="text-xs text-danger">-{(dayData.expense / 1000).toFixed(0)}k</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/20 border border-success/50 rounded"></div>
            <span>Net Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-danger/20 border border-danger/50 rounded"></div>
            <span>Net Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/20 border border-warning/50 rounded"></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary rounded"></div>
            <span>Today</span>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedDateData && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-success-light p-3 rounded-lg">
                <p className="text-sm font-medium">Income</p>
                <p className="text-lg font-bold text-success">
                  {formatCurrency(selectedDateData.income)}
                </p>
              </div>
              <div className="bg-danger-light p-3 rounded-lg">
                <p className="text-sm font-medium">Expenses</p>
                <p className="text-lg font-bold text-danger">
                  {formatCurrency(selectedDateData.expense)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                selectedDateData.income >= selectedDateData.expense 
                  ? 'bg-success-light' 
                  : 'bg-danger-light'
              }`}>
                <p className="text-sm font-medium">Net</p>
                <p className={`text-lg font-bold ${
                  selectedDateData.income >= selectedDateData.expense 
                    ? 'text-success' 
                    : 'text-danger'
                }`}>
                  {formatCurrency(selectedDateData.income - selectedDateData.expense)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium">Transactions:</h5>
              {selectedDateData.transactions.map((transaction, index) => (
                <div 
                  key={`transaction-${selectedDate}-${index}-${transaction.amount}-${transaction.category}`}
                  className="flex items-center justify-between p-2 bg-background/50 rounded"
                >
                  <div>
                    <p className="font-medium">{transaction.category}</p>
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                    <span className={`font-semibold ${
                      transaction.type === 'income' ? 'text-success' : 'text-danger'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};