export type TxType = 'income' | 'expense' | 'transfer'

export interface Category {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
}

export interface Wallet {
  id: string
  user_id: string
  name: string
  type: string
  balance: number
  starting_balance: number
  created_at?: string
}

export interface Transaction {
  id: string
  user_id?: string
  type: TxType
  amount: number
  category_id?: string | null
  wallet_id?: string
  transfer_id?: string | null
  transaction_date: string
  note?: string | null
  receipt_url?: string | null
  created_at?: string
  categories?: Pick<Category, 'id' | 'name' | 'icon'> | null
  wallets?: Pick<Wallet, 'id' | 'name' | 'type'> | null
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: string
  start_date: string
  spent?: number
  categories?: Pick<Category, 'id' | 'name' | 'icon'> | null
}

export interface Bill {
  id: string
  user_id: string
  name: string
  amount: number
  category_id: string | null
  wallet_id: string | null
  due_day: number
  frequency: 'monthly' | 'weekly'
  active: boolean
  note: string | null
  created_at?: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  emoji: string | null
  created_at?: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
