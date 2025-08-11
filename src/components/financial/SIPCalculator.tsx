import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PieChart, TrendingUp, Calculator, Save, Trash2 } from "lucide-react";
import { formatCurrency } from "../dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

export const SIPCalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [tenure, setTenure] = useState(15);
  const [viewType, setViewType] = useState<'pie' | 'line'>('pie');
  const [savedSIPs, setSavedSIPs] = useState<any[]>([]);
  const { toast } = useToast();

  const loadSavedSIPs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sip_investments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedSIPs(data || []);
    } catch (error) {
      console.error('Error loading SIPs:', error);
    }
  };

  const saveSIP = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Please log in to save SIP plans" });
        return;
      }

      const { error } = await supabase
        .from('sip_investments')
        .insert({
          user_id: user.id,
          monthly_amount: monthlyInvestment,
          expected_return: expectedReturn,
          tenure_years: tenure
        });

      if (error) throw error;

      await loadSavedSIPs();
      toast({ title: "Success", description: "SIP plan saved successfully" });
    } catch (error) {
      console.error('Error saving SIP:', error);
      toast({ title: "Error", description: "Failed to save SIP plan" });
    }
  };

  const deleteSIP = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sip_investments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadSavedSIPs();
      toast({ title: "Success", description: "SIP plan deleted successfully" });
    } catch (error) {
      console.error('Error deleting SIP:', error);
      toast({ title: "Error", description: "Failed to delete SIP plan" });
    }
  };

  useEffect(() => {
    loadSavedSIPs();
  }, []);

  const calculatedData = useMemo(() => {
    const monthlyReturn = expectedReturn / 12 / 100;
    const totalMonths = tenure * 12;
    
    // SIP Future Value Formula
    const futureValue = monthlyInvestment * 
      (((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) * (1 + monthlyReturn));
    
    const totalInvestment = monthlyInvestment * totalMonths;
    const totalReturns = futureValue - totalInvestment;
    
    // Generate yearly data for line chart
    const yearlyData = [];
    for (let year = 1; year <= tenure; year++) {
      const months = year * 12;
      const value = monthlyInvestment * 
        (((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn));
      const investment = monthlyInvestment * months;
      
      yearlyData.push({
        year,
        value: Math.round(value),
        investment: Math.round(investment),
        returns: Math.round(value - investment)
      });
    }
    
    return {
      futureValue: Math.round(futureValue),
      totalInvestment: Math.round(totalInvestment),
      totalReturns: Math.round(totalReturns),
      yearlyData
    };
  }, [monthlyInvestment, expectedReturn, tenure]);

  const pieData = [
    { name: 'Principal Amount', value: calculatedData.totalInvestment },
    { name: 'Capital Gains', value: calculatedData.totalReturns }
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          SIP Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="monthly-investment">Monthly Investment (₹)</Label>
            <Input
              id="monthly-investment"
              type="number"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              min="500"
              step="500"
            />
          </div>
          <div>
            <Label htmlFor="expected-return">Expected Return (% p.a.)</Label>
            <Input
              id="expected-return"
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              min="1"
              max="30"
              step="0.5"
            />
          </div>
          <div>
            <Label htmlFor="tenure">Investment Period (Years)</Label>
            <Input
              id="tenure"
              type="number"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              min="1"
              max="50"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveSIP} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save SIP Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Investment</span>
            </div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(calculatedData.totalInvestment)}
            </p>
          </div>

          <div className="bg-success-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">Expected Returns</span>
            </div>
            <p className="text-xl font-bold text-success">
              {formatCurrency(calculatedData.totalReturns)}
            </p>
          </div>

          <div className="bg-warning-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <p className="text-xl font-bold text-warning">
              {formatCurrency(calculatedData.futureValue)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            variant={viewType === 'pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('pie')}
          >
            Pie Chart
          </Button>
          <Button
            variant={viewType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('line')}
          >
            Growth Chart
          </Button>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'pie' ? (
              <RechartsPieChart>
                <Pie 
                  data={pieData}
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={120} 
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            ) : (
              <LineChart data={calculatedData.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  labelFormatter={(year) => `Year ${year}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="investment" 
                  stroke={COLORS[0]} 
                  strokeWidth={2}
                  name="Investment"
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS[1]} 
                  strokeWidth={3}
                  name="Total Value"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Monthly SIP: {formatCurrency(monthlyInvestment)}</p>
          <p>• Wealth gain: {formatCurrency(calculatedData.totalReturns)} ({((calculatedData.totalReturns / calculatedData.totalInvestment) * 100).toFixed(1)}%)</p>
          <p>• Effective annual return: {((Math.pow(calculatedData.futureValue / calculatedData.totalInvestment, 1/tenure) - 1) * 100).toFixed(1)}%</p>
          <p>• Tax on long-term gains (&gt;1 year): 12.5% on gains above ₹1 lakh</p>
        </div>

        {savedSIPs.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Your Saved SIP Plans</h4>
            <div className="space-y-3">
              {savedSIPs.map((sip) => {
                const months = sip.tenure_years * 12;
                const monthlyRate = sip.expected_return / 100 / 12;
                const futureValue = sip.monthly_amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
                const totalInvestment = sip.monthly_amount * months;
                const returns = futureValue - totalInvestment;
                
                return (
                  <div key={sip.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">₹{sip.monthly_amount}/month for {sip.tenure_years} years</p>
                      <p className="text-sm text-muted-foreground">
                        Expected: {formatCurrency(futureValue)} ({sip.expected_return}% return)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gains: {formatCurrency(returns)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSIP(sip.id)}
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