# Menyiapkan penyimpanan akun (Supabase) — sekali saja

Aplikasi **tidak butuh Supabase untuk berjalan**. Tanpa ini, catatan tersimpan
di perangkat yang sedang dipakai, dan bisa dicadangkan lewat Pengaturan →
Cadangan data (unduh/impor JSON).

Supabase hanya dipakai supaya catatan **muncul juga di ponsel atau komputer
lain**.

**Login aplikasi memakai akun Supabase ini.** Kata sandi diperiksa Supabase di
server, jadi tidak ada kata sandi yang tersimpan di kode atau bisa dibaca dari
halaman web. Tidak ada OTP, tidak ada email verifikasi, tidak perlu SMTP.

Perkiraan waktu: 10 menit. Gratis.

---

## 1. Buat project Supabase

1. Buka **https://supabase.com**, daftar/masuk.
2. Klik **New project**.
   - **Name**: `buku-uang`
   - **Database Password**: klik Generate, simpan di tempat aman (aplikasi
     tidak memakainya).
   - **Region**: **Southeast Asia (Singapore)**.
4. Klik **Create new project**, tunggu ±2 menit.

---

## 2. Buat tabel penyimpanan

1. Menu kiri → **SQL Editor** → **New query**.
2. Buka berkas `supabase/schema.sql`, salin seluruh isinya, tempel.
3. Klik **Run**.

Harus muncul **"Success. No rows returned"**.

Cek: **Table Editor** → tabel `user_data` ada, dengan ikon gembok (RLS).

---

## 3. Buat satu akun penyimpanan

Akun ini bukan untuk login ke aplikasi. Ini akun teknis yang dipakai aplikasi
untuk menulis ke database.

1. Menu kiri → **Authentication** → **Users**.
2. Klik **Add user** → **Create new user**.
3. Isi:
   - **Email**: `admin@bukukas.com`
   - **Password**: buat kata sandi sendiri, misalnya 12 huruf yang mudah Anda ingat
   - Centang **Auto Confirm User** (supaya tidak perlu konfirmasi email).
4. Klik **Create user**.

**Akun ini adalah akun login aplikasi.** Email dan kata sandinya yang nanti
diketik di halaman Masuk. Kata sandi disimpan di Supabase, bukan di kode, jadi
tidak bisa dibaca orang yang membuka halaman web.

### Mengubah kata sandi

**Dari aplikasi (disarankan):** masuk → **Pengaturan → Kata sandi → Ubah**.
Tidak perlu email sama sekali, karena Anda sedang login dan Supabase
mengizinkan penggantian kata sandi langsung dari sesi yang aktif.

**Dari dashboard:** Authentication → Users → tombol ⋯ → **Reset password**.
Cara ini mengirim tautan ke email akun, jadi hanya berguna kalau emailnya nyata.

Kalau email akunnya dummy (tidak bisa menerima surat), pemulihan lewat email
tidak akan pernah berhasil. Supaya aman, ganti email akun ke alamat yang benar
di **Authentication → Users**, lalu ubah kata sandinya dari aplikasi.

---

## 4. Isi dua nilai di config

1. Menu kiri → **Project Settings** → **API** (di UI baru: **API Keys**).
2. Salin **Project URL** dan **anon public** (di UI baru: **publishable key**).
3. Buka `js/config.js` dan isi:

```js
window.KASBUKU_CONFIG = {
  SUPABASE_URL: 'https://abcdefgh.supabase.co',
  SUPABASE_ANON_KEY: 'anon-atau-publishable-key-di-sini'
};
```

Tidak ada kata sandi di berkas ini. Login diperiksa Supabase di server.

Simpan. Reload aplikasi.

Kunci `anon`/`publishable` **boleh terlihat publik**; yang melindungi data adalah
aturan RLS dari langkah 2. Jangan pernah memakai kunci `service_role`.

---

## 5. Cek hasilnya

1. Buka aplikasi, masuk dengan akun login.
4. Buka **Pengaturan** → kartu **Cadangan otomatis**.
3. Harus bertuliskan **Tersambung** dan **Tersimpan ke akun**.
4. Tambah satu catatan, tunggu ±2 detik, lalu buka aplikasi di perangkat lain.
   Catatan itu harus muncul setelah masuk.

Tombol yang tersedia di kartu itu:

- **Simpan sekarang** — kirim paksa ke akun.
- **Ambil** — tarik data dari akun dan ganti isi perangkat ini.
- **Keluar** — keluar dari aplikasi.

---

## Kalau bermasalah

**Kartu menulis "Bermasalah"**
Klik **Coba lagi**. Kalau sesi sudah habis, aplikasi akan menampilkan halaman
Masuk. Periksa juga `js/config.js` dan akun di langkah 3.

**"Akun penyimpanan menolak login"**
Akun Supabase-nya belum dibuat, atau kata sandinya berbeda. Buat ulang di
**Authentication → Users**.

**"Akun penyimpanan belum aktif"**
Saat membuat user, **Auto Confirm User** belum dicentang. Hapus akun itu, buat
ulang dengan centang.

**"Tabel penyimpanan belum ada"**
Langkah 2 belum dijalankan, atau dijalankan di project yang berbeda.

**Perubahan tidak muncul di perangkat lain**
Tunggu beberapa detik lalu tekan **Simpan sekarang** di perangkat asal, dan
**Ambil** di perangkat tujuan. Pastikan keduanya memakai config yang sama.

---

## Catatan

- Paket gratis Supabase mengistirahatkan project setelah 7 hari tanpa pemakaian.
  Data tidak hilang; buka dashboard Supabase dan klik Restore.
- Data tersimpan sebagai satu baris per akun. Aturan **tulisan terakhir menang**:
  kalau dua perangkat mencatat bersamaan saat sama-sama luring, salah satunya
  bisa tertimpa. Buka satu perangkat dulu sebelum mencatat di perangkat lain.
- **Keamanan:** kata sandi login ada di `js/config.js`, dan berkas itu ikut
  terkirim ke browser. Siapa pun yang bisa membuka situs dan melihat kode
  halamannya bisa menemukannya. Ini memang rancangan untuk pemakaian internal,
  bukan untuk dibagikan ke publik. Kalau nanti perlu lebih aman, login harus
  dipindah ke server.
