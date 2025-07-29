import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
}

export const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-success-light/50";
      case "warning":
        return "border-warning/20 bg-warning-light/50";
      case "danger":
        return "border-danger/20 bg-danger-light/50";
      default:
        return "border-border/50";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "success":
        return "text-success bg-success-light";
      case "warning":
        return "text-warning bg-warning-light";
      case "danger":
        return "text-danger bg-danger-light";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card className={`glass-card transition-smooth hover:shadow-medium ${getVariantStyles()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center text-xs ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
                <span className={`mr-1 ${trend.isPositive ? '↗' : '↙'}`}>
                  {trend.isPositive ? '↗' : '↙'}
                </span>
                {Math.abs(trend.value)}% from last month
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${getIconStyles()}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};