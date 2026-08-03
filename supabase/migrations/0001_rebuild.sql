-- ============================================================================
-- CASHFLOW TRACKER — REBUILD MIGRATION
-- Jalankan di Supabase Dashboard → SQL Editor (sekali jalan, idempotent).
--
-- ⚠️  PERINGATAN: Bagian 1 MENGHAPUS SEMUA DATA KEUANGAN
--     (transactions, budgets, wallets) sesuai persetujuan pemilik.
--     Akun user (auth.users) TIDAK dihapus.
-- ============================================================================

-- ============================================================================
-- BAGIAN 1 — HAPUS DATA KEUANGAN LAMA
-- ============================================================================
TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE budgets RESTART IDENTITY CASCADE;
TRUNCATE TABLE wallets RESTART IDENTITY CASCADE;

-- ============================================================================
-- BAGIAN 1.5 — SETUP SINKRONISASI SALDO OTOMATIS
-- Aplikasi baru mendukung edit & hapus transaksi. Saldo wallet dihitung ulang
-- otomatis dari "saldo awal" + seluruh transaksi wallet tsb (via trigger).
-- ============================================================================

-- Hapus trigger lama (tidak dikenal/tidak terdokumentasi) pada transactions.
DO $$
DECLARE tr RECORD;
BEGIN
  FOR tr IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'transactions'::regclass
      AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER %I ON transactions', tr.tgname);
  END LOOP;
END $$;

-- Kolom penghubung pasangan transfer (2 baris = 1 transfer).
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transfer_id uuid;

-- Kolom "saldo awal" wallet (nilai sebelum ada transaksi).
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS starting_balance numeric NOT NULL DEFAULT 0;

-- ============================================================================
-- BAGIAN 2 — SEED ULANG KATEGORI
-- Kategori bersifat global (dipakai semua user), bukan data per-user.
-- ============================================================================
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- Kategori bersifat global (dipakai semua user), user_id tidak wajib.
ALTER TABLE categories ALTER COLUMN user_id DROP NOT NULL;

INSERT INTO categories (name, icon, type) VALUES
  -- Pemasukan
  ('Gaji',        '💼', 'income'),
  ('Freelance',   '🚀', 'income'),
  ('Bonus',       '🎁', 'income'),
  ('Investasi',   '📈', 'income'),
  ('Bisnis',      '🏪', 'income'),
  ('Lainnya',     '🪙', 'income'),
  -- Pengeluaran
  ('Makanan',     '🍜', 'expense'),
  ('Belanja',     '🛒', 'expense'),
  ('Transportasi','🚗', 'expense'),
  ('Tagihan',     '🧾', 'expense'),
  ('Hiburan',     '🎮', 'expense'),
  ('Internet',    '🌐', 'expense'),
  ('Pulsa',       '📱', 'expense'),
  ('Pendidikan',  '🎓', 'expense'),
  ('Kesehatan',   '💊', 'expense'),
  ('Lainnya',     '💸', 'expense');

-- ============================================================================
-- BAGIAN 3 — TABEL BARU
-- ============================================================================

-- 3.1 Pengingat Tagihan (bills) — tagihan rutin berulang
CREATE TABLE IF NOT EXISTS bills (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  amount       numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  category_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  wallet_id    uuid REFERENCES wallets(id) ON DELETE SET NULL,
  due_day      integer NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
  frequency    text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'weekly')),
  active       boolean NOT NULL DEFAULT true,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3.2 Target Tabungan (savings_goals)
CREATE TABLE IF NOT EXISTS savings_goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  target_amount  numeric NOT NULL DEFAULT 0 CHECK (target_amount > 0),
  current_amount numeric NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline       date,
  emoji          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- BAGIAN 4 — PERKUAT KEAMANAN (RLS + POLICIES)
-- Semua query aplikasi difilter user_id; RLS menegakkan auth.uid() = user_id.
-- ============================================================================

-- 4.1 wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallets_select ON wallets;
DROP POLICY IF EXISTS wallets_insert ON wallets;
DROP POLICY IF EXISTS wallets_update ON wallets;
DROP POLICY IF EXISTS wallets_delete ON wallets;
CREATE POLICY wallets_select ON wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY wallets_insert ON wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wallets_update ON wallets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY wallets_delete ON wallets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4.2 transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transactions_select ON transactions;
DROP POLICY IF EXISTS transactions_insert ON transactions;
DROP POLICY IF EXISTS transactions_update ON transactions;
DROP POLICY IF EXISTS transactions_delete ON transactions;
CREATE POLICY transactions_select ON transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY transactions_insert ON transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY transactions_update ON transactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY transactions_delete ON transactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4.3 budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budgets_select ON budgets;
DROP POLICY IF EXISTS budgets_insert ON budgets;
DROP POLICY IF EXISTS budgets_update ON budgets;
DROP POLICY IF EXISTS budgets_delete ON budgets;
CREATE POLICY budgets_select ON budgets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY budgets_insert ON budgets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_update ON budgets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY budgets_delete ON budgets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4.4 bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bills_select ON bills;
DROP POLICY IF EXISTS bills_insert ON bills;
DROP POLICY IF EXISTS bills_update ON bills;
DROP POLICY IF EXISTS bills_delete ON bills;
CREATE POLICY bills_select ON bills
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY bills_insert ON bills
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY bills_update ON bills
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY bills_delete ON bills
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4.5 savings_goals
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS savings_goals_select ON savings_goals;
DROP POLICY IF EXISTS savings_goals_insert ON savings_goals;
DROP POLICY IF EXISTS savings_goals_update ON savings_goals;
DROP POLICY IF EXISTS savings_goals_delete ON savings_goals;
CREATE POLICY savings_goals_select ON savings_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY savings_goals_insert ON savings_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY savings_goals_update ON savings_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY savings_goals_delete ON savings_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4.6 categories — tabel global: hanya boleh dibaca user login,
--     perubahan hanya lewat SQL (service role / admin).
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_select ON categories;
CREATE POLICY categories_select ON categories
  FOR SELECT TO authenticated USING (true);

-- 4.7 TRIGGER SINKRONISASI SALDO WALLET
-- balance wallet = starting_balance + (total income) - (total expense)
-- untuk semua transaksi milik wallet tsb. Dijalankan tiap insert/update/delete.
CREATE OR REPLACE FUNCTION public.sync_wallet_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    w := OLD.wallet_id;
    IF w IS NOT NULL THEN
      UPDATE wallets
      SET balance = starting_balance
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w AND type = 'expense'), 0)
      WHERE id = w;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.wallet_id IS DISTINCT FROM NEW.wallet_id THEN
      IF OLD.wallet_id IS NOT NULL THEN
        UPDATE wallets
        SET balance = starting_balance
          + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = OLD.wallet_id AND type = 'income'), 0)
          - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = OLD.wallet_id AND type = 'expense'), 0)
        WHERE id = OLD.wallet_id;
      END IF;
    END IF;
    w := NEW.wallet_id;
    IF w IS NOT NULL THEN
      UPDATE wallets
      SET balance = starting_balance
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w AND type = 'expense'), 0)
      WHERE id = w;
    END IF;
  ELSE -- INSERT
    w := NEW.wallet_id;
    IF w IS NOT NULL THEN
      UPDATE wallets
      SET balance = starting_balance
        + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w AND type = 'income'), 0)
        - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w AND type = 'expense'), 0)
      WHERE id = w;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wallet_balance ON transactions;
CREATE TRIGGER trg_sync_wallet_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_balance();

-- RPC hitung ulang saldo satu wallet (dipakai setelah edit "saldo awal").
CREATE OR REPLACE FUNCTION public.recalc_wallet_balance(p_wallet uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE wallets
  SET balance = starting_balance
    + COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = p_wallet AND type = 'income'), 0)
    - COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = p_wallet AND type = 'expense'), 0)
  WHERE id = p_wallet;
$$;

GRANT EXECUTE ON FUNCTION public.recalc_wallet_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_wallet_balance() TO authenticated;

-- ============================================================================
-- BAGIAN 5 — STORAGE 'receipts' (foto struk)
-- Bucket dibuat jika belum ada; policy: user hanya akses folder miliknya.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'receipts') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('receipts', 'receipts', false);
  END IF;
END
$$;

DROP POLICY IF EXISTS receipts_select ON storage.objects;
DROP POLICY IF EXISTS receipts_insert ON storage.objects;
DROP POLICY IF EXISTS receipts_update ON storage.objects;
DROP POLICY IF EXISTS receipts_delete ON storage.objects;

CREATE POLICY receipts_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY receipts_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY receipts_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY receipts_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SELESAI. App baru siap terhubung ke tabel yang sama.
-- ============================================================================
