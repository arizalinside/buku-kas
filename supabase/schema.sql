-- ============================================================
-- KasBuku — skema database Supabase
-- Tempel seluruh isi berkas ini ke:  SQL Editor  ->  New query
-- lalu klik Run. Aman dijalankan berulang kali.
-- ============================================================

-- Satu baris per pengguna: seluruh isi buku keuangannya.
-- Disimpan sebagai JSON supaya bentuk datanya bisa berkembang
-- tanpa perlu migrasi tabel setiap kali.
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Row Level Security: setiap orang hanya bisa menyentuh
-- barisnya sendiri. Tanpa ini, kunci anon yang publik bisa
-- dipakai membaca data orang lain.
-- ------------------------------------------------------------
alter table public.user_data enable row level security;

drop policy if exists "baca data sendiri"   on public.user_data;
drop policy if exists "buat data sendiri"   on public.user_data;
drop policy if exists "ubah data sendiri"   on public.user_data;
drop policy if exists "hapus data sendiri"  on public.user_data;

create policy "baca data sendiri"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "buat data sendiri"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "ubah data sendiri"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "hapus data sendiri"
  on public.user_data for delete
  using (auth.uid() = user_id);
