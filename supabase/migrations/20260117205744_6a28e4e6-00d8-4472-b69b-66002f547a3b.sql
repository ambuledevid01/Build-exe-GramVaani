-- Create accounts table to store user balances
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  account_number TEXT NOT NULL DEFAULT 'ACC' || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'bill')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  recipient_name TEXT,
  recipient_phone TEXT,
  bill_type TEXT CHECK (bill_type IN ('electricity', 'mobile', 'gas', 'water', NULL)),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view their own account"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own account"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update account balance on new transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'credit' THEN
    UPDATE public.accounts 
    SET balance = balance + NEW.amount, updated_at = now()
    WHERE id = NEW.account_id;
  ELSIF NEW.type IN ('debit', 'bill') THEN
    UPDATE public.accounts 
    SET balance = balance - NEW.amount, updated_at = now()
    WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance();

-- Trigger to create account when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.accounts (user_id, balance)
  VALUES (NEW.id, 24580.00);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_account();

-- Add updated_at trigger for accounts
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();