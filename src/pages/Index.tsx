import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            FinanceZen
          </h1>
          <p className="text-muted-foreground mb-8">
            Please sign in to access your expense tracker dashboard
          </p>
          <Link to="/auth">
            <Button variant="gradient" size="lg">
              Sign In / Sign Up
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
