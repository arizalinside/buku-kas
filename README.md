# Buku Uang

Pencatatan **kas toko**: uang masuk, uang keluar, dan hutang ke uang pribadi.
Dibuat supaya orang yang bukan akuntan bisa mencatat belanja harian dengan
cepat — misalnya "beli minyak goreng 2 liter Rp72.000" — lalu langsung tahu
sudah keluar berapa.

Nama folder proyek: `KasBuku`.

## Empat halaman

- **Beranda** — uang masuk dan keluar hari ini, uang di toko, kartu hutang
  (total pengeluaran, total hutang, sudah dibayar, sisa hutang), dan catatan
  terakhir.
- **Catatan** — daftar semua catatan dengan:
  - pencarian kata (mis. "minyak")
  - filter tanggal: hari ini, kemarin, 7 hari, 30 hari, bulan ini, semua, atau
    rentang pilihan sendiri
  - filter jenis: semua, uang masuk, uang keluar, bayar hutang
  - paginasi dengan pilihan 10 / 25 / 50 / 100 per halaman
- **Rekap** — ringkasan per rentang tanggal, pengeluaran terbesar, dan rincian
  per hari.
- **Pengaturan** — cadangan otomatis, unduh/impor data, isi contoh, hapus data.

Tombol tambah berupa tombol bulat di kanan bawah. Setelah ditekan, pilih
**Uang masuk**, **Uang keluar**, atau **Bayar hutang**.

## Hutang ke uang pribadi

Uang toko berasal dari uang pribadi pemilik, jadi belanja yang dibayar dari uang
pribadi dicatat sebagai hutang toko:

- **Uang keluar** punya pilihan sumber dana: **uang pribadi** (menambah hutang)
  atau **uang toko** (tidak menambah hutang).
- **Bayar hutang** mengurangi sisa hutang. Ini bukan belanja baru, jadi tidak
  dihitung sebagai pengeluaran.
- **Uang di toko** = uang masuk − belanja dari uang toko − bayar hutang.

Tidak ada menu pindah dana. Menyetor uang pribadi ke rekening toko cukup
dicatat sebagai **uang masuk**.

## Data awal

- `data/belanja-2026.csv` — data belanja yang Anda kirim, apa adanya.
- `data/transactions.json` — hasil konversi ke format aplikasi (100 catatan,
  siap diimpor lewat Pengaturan → Impor).

## Menjalankan

Web statis, tanpa build step:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Login dan penyimpanan

**Login:** email + kata sandi, diperiksa oleh Supabase di server. Kata sandi
**tidak disimpan di kode** maupun di perangkat, jadi tidak bisa dibaca orang
yang membuka halaman. Tidak ada pendaftaran dan tidak ada kode email; akun
dibuat sekali di dashboard Supabase (lihat panduan). Sesi tersimpan di
perangkat, jadi tidak perlu mengetik ulang setiap membuka aplikasi.

**Data:**

- Dengan Supabase (wajib): catatan disimpan ke akun, sehingga bisa dibuka dari
  ponsel atau komputer lain. Setup sekali:
  **[docs/SETUP-SUPABASE.md](docs/SETUP-SUPABASE.md)**.
- Cadangan tambahan bisa diunduh lewat Pengaturan → Unduh.

Deploy ke Vercel: **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)**.

## Struktur berkas

```
index.html
css/styles.css
js/config.js                login + nilai Supabase
js/store.js                 catatan, hitungan hutang, filter, paginasi, migrasi
js/ui.js                    format rupiah, tanggal, jam WIB, modal
js/cloud.js                 penyimpanan akun Supabase
js/views.auth.js            layar masuk
js/views.dashboard.js       beranda + kartu hutang
js/views.transactions.js    catatan (filter, paginasi) + form tambah
js/views.reports.js         rekap
js/views.settings.js        cadangan dan data
js/app.js                   router, jam berjalan, tombol tambah
supabase/schema.sql         tabel + aturan Row Level Security
docs/                       panduan Supabase dan Vercel
```

## Aturan yang dijaga

- Uang selalu **integer rupiah**, tidak pernah float.
- Saldo dan hutang **dihitung ulang** dari catatan, bukan angka tersimpan.
- Belanja dari uang pribadi menambah hutang; bayar hutang tidak dihitung
  sebagai belanja.
- Data versi lama (buku/akun/pindah dana) dimigrasikan otomatis: pindah dana
  dibuang, saldo awal dijadikan uang masuk pertama, belanja lama dianggap
  dibayar dari uang pribadi.

## Batasan

- Sinkronisasi memakai aturan **tulisan terakhir menang**.
- Paket gratis Supabase mengistirahatkan project setelah 7 hari tanpa pemakaian.
  Data tidak hilang, project tinggal dibangunkan.
- Kata sandi tidak ada di kode. Yang ada di `js/config.js` hanya kunci anon
  Supabase yang memang publik, dilindungi Row Level Security.

## Berikutnya

- Impor mutasi rekening / laporan Shopee (CSV)
- Cetak/ekspor laporan bulanan ke PDF
