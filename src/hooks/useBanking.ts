import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Account {
  id: string;
  user_id: string;
  balance: number;
  account_number: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: "credit" | "debit" | "bill";
  amount: number;
  description: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  bill_type: string | null;
  status: string;
  created_at: string;
}

export const useBanking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's account
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching account:", error);
        throw error;
      }

      return data as Account | null;
    },
    enabled: !!user,
  });

  // Fetch user's transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }

      return (data || []) as Transaction[];
    },
    enabled: !!user,
  });

  // Create a new transaction
  const createTransaction = useMutation({
    mutationFn: async (transaction: {
      type: "credit" | "debit" | "bill";
      amount: number;
      description: string;
      recipient_name?: string;
      recipient_phone?: string;
      bill_type?: string;
    }) => {
      if (!user || !account) {
        throw new Error("User or account not found");
      }

      // Check sufficient balance for debit/bill
      if ((transaction.type === "debit" || transaction.type === "bill") && 
          account.balance < transaction.amount) {
        throw new Error("Insufficient balance");
      }

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: account.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          recipient_name: transaction.recipient_name || null,
          recipient_phone: transaction.recipient_phone || null,
          bill_type: transaction.bill_type || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating transaction:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Refetch account and transactions after successful transaction
      queryClient.invalidateQueries({ queryKey: ["account", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
    },
  });

  return {
    account,
    balance: account?.balance ?? 0,
    accountNumber: account?.account_number ?? "",
    transactions,
    isLoading: accountLoading || transactionsLoading,
    createTransaction: createTransaction.mutateAsync,
    isCreatingTransaction: createTransaction.isPending,
  };
};
