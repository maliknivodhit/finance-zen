-- Create crypto holdings table
CREATE TABLE public.crypto_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SIP investments table
CREATE TABLE public.sip_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monthly_amount NUMERIC NOT NULL,
  expected_return NUMERIC NOT NULL,
  tenure_years INTEGER NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create savings accounts table
CREATE TABLE public.savings_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  current_balance NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  monthly_contribution NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for crypto holdings
ALTER TABLE public.crypto_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own crypto holdings" 
ON public.crypto_holdings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own crypto holdings" 
ON public.crypto_holdings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crypto holdings" 
ON public.crypto_holdings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crypto holdings" 
ON public.crypto_holdings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS for SIP investments
ALTER TABLE public.sip_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SIP investments" 
ON public.sip_investments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SIP investments" 
ON public.sip_investments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SIP investments" 
ON public.sip_investments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SIP investments" 
ON public.sip_investments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS for savings accounts
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings accounts" 
ON public.savings_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings accounts" 
ON public.savings_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings accounts" 
ON public.savings_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings accounts" 
ON public.savings_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_crypto_holdings_updated_at
BEFORE UPDATE ON public.crypto_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sip_investments_updated_at
BEFORE UPDATE ON public.sip_investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_savings_accounts_updated_at
BEFORE UPDATE ON public.savings_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();