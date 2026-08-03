const EVENT = 'cashflow:refresh'

/** Panggil setelah data berubah (mis. quick-add dari layout) agar halaman aktif refresh. */
export function emitRefresh(): void {
  window.dispatchEvent(new CustomEvent(EVENT))
}

/** Subscribe perubahan data global. Kembalikan fungsi untuk unsubscribe. */
export function onRefresh(cb: () => void): () => void {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}
