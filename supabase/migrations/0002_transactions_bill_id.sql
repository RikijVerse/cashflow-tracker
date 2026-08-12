-- ============================================================================
-- CASHFLOW TRACKER — TAMBAH bill_id KE transactions
-- Jalankan di Supabase Dashboard → SQL Editor (idempotent, aman diulang).
--
-- Tujuan: menyimpan relasi eksplisit antara transaksi pembayaran tagihan
-- dan tagihan sumbernya, sehingga riwayat pembayaran per tagihan bisa
-- di-query langsung (JOIN), tidak lagi bergantung pada teks di kolom note.
-- ============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS bill_id uuid REFERENCES bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_bill_id
  ON transactions (bill_id)
  WHERE bill_id IS NOT NULL;

COMMENT ON COLUMN transactions.bill_id IS
  'Diisi otomatis saat transaksi dibuat dari alur "Bayar Tagihan" (PayModal). NULL untuk transaksi biasa.';
