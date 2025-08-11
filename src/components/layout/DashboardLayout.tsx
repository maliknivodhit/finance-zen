import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function DashboardLayout({ children, activeSection, onSectionChange }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-muted/30">
        <AppSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="h-full px-6 flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-foreground">
                  {getSectionTitle(activeSection)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getSectionDescription(activeSection)}
                </p>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function getSectionTitle(section: string): string {
  const titles: Record<string, string> = {
    overview: "Overview",
    "add-transaction": "Add Transaction",
    sip: "SIP Calculator",
    ai: "AI Insights",
    calendar: "Calendar View",
    crypto: "Crypto Tracker",
    reports: "Monthly Report",
    alerts: "Smart Alerts",
    growth: "Savings Growth",
    tax: "Tax Calculator",
  };
  return titles[section] || "Dashboard";
}

function getSectionDescription(section: string): string {
  const descriptions: Record<string, string> = {
    overview: "Your financial dashboard and summary",
    "add-transaction": "Record your income and expenses",
    sip: "Calculate systematic investment plan returns",
    ai: "Get personalized financial insights",
    calendar: "View transactions in calendar format",
    crypto: "Track cryptocurrency portfolio",
    reports: "Detailed monthly financial reports",
    alerts: "Smart notifications and reminders",
    growth: "Analyze your savings growth potential",
    tax: "Calculate tax obligations",
  };
  return descriptions[section] || "Manage your finances efficiently";
}