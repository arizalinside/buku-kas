/* ============================================================
   PENGATURAN BUKU UANG
   ------------------------------------------------------------
   Hanya dua nilai publik dari Supabase:
   Project Settings -> API -> Project URL & anon public key.

   Kunci "anon" memang boleh terlihat publik; yang melindungi
   data adalah Row Level Security di database.

   Kata sandi login TIDAK ada di berkas ini. Supabase yang
   memeriksanya di server, jadi tidak ada kata sandi yang bisa
   dibaca dari kode halaman.

   Cara mengubah kata sandi: Supabase Dashboard ->
   Authentication -> Users -> pilih akun -> Reset password.
   ============================================================ */

window.KASBUKU_CONFIG = {
  SUPABASE_URL: 'https://ihhnhwpucvvjgazprkmf.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_xiuH-QPF4YuWk7jrlF-vFQ_hZGV7oyu'
};
