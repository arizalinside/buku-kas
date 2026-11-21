# Buku Hutang

Pencatatan **belanja toko dan hutang ke uang pribadi**. Dibuat supaya orang
yang bukan akuntan bisa mencatat belanja harian dengan cepat — misalnya
"beli minyak goreng 2 liter Rp72.000" — lalu langsung tahu masih berapa
hutangnya ke uang pribadi.

Nama folder proyek: `KasBuku`.

## Kenapa tanpa uang masuk

Aplikasi ini sengaja **tidak** mencatat uang masuk. Penjualan toko — baik
Shopee maupun offline — belum pernah dicatat lengkap, sehingga kas dan untung
yang dihitung dari catatan setengah jadi akan menyesatkan. Yang dicatat hanya
angka yang bisa dipercaya: berapa yang sudah dibelanjakan, dan berapa yang
sudah dibayarkan.

Uang penjualan yang dipakai mengganti uang pribadi dicatat sebagai **Bayar
hutang**, bukan sebagai uang masuk.

## Empat halaman

- **Beranda** — sisa hutang sebagai angka utama, dengan total hutang dan
  sudah dibayar sebagai pendukung serta bilah kemajuan. Di bawahnya belanja
  hari ini, grafik belanja per tanggal dengan filter tanggal (paling jauh 90
  hari terakhir, supaya garisnya tetap terbaca), dan catatan
  terakhir. Animasi memakai GSAP dan otomatis dimatikan bila perangkat
  meminta kurangi gerak.
- **Catatan** — daftar semua catatan dengan:
  - pencarian kata (mis. "minyak")
  - filter tanggal: hari ini, kemarin, 7 hari, 30 hari, bulan ini, semua, atau
    rentang pilihan sendiri
  - filter jenis: semua, belanja, bayar hutang
  - paginasi dengan pilihan 10 / 25 / 50 / 100 per halaman
- **Rekap** — ringkasan per rentang tanggal: total belanja, bagian yang
  dibayar dari uang pribadi, pembayaran hutang, belanja terbesar, rincian per
  hari, dan per kategori.
- **Pengaturan** — cadangan otomatis, unduh/impor data, isi contoh, kata sandi,
  dan tema **terang / gelap / ikuti perangkat**.

Tombol tambah berupa tombol bulat di kanan bawah. Setelah ditekan, pilih
**Belanja** atau **Bayar hutang**.

## Hutang ke uang pribadi

Uang toko berasal dari uang pribadi pemilik, jadi belanja yang dibayar dari uang
pribadi dicatat sebagai hutang toko:

- **Belanja** punya pilihan sumber dana: **uang pribadi** (menambah hutang)
  atau **uang toko** (tidak menambah hutang, misalnya dibayar dari saldo
  Shopee).
- **Bayar hutang** mengurangi sisa hutang. Ini bukan belanja baru, jadi tidak
  dihitung sebagai pengeluaran.
- **Sisa hutang** = belanja dari uang pribadi − bayar hutang.

## Data awal

- `data/belanja-2026.csv` — data belanja yang Anda kirim, apa adanya.
- `data/transactions.json` — hasil konversi ke format aplikasi (100 catatan:
  88 belanja dan 12 pembayaran hutang, siap diimpor lewat Pengaturan → Impor).

## Menjalankan

Web statis, tanpa build step:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Login dan penyimpanan

**Login:** email + kata sandi, diperiksa oleh Supabase di server. Kata sandi
bisa diganti dari **Pengaturan → Kata sandi**, tanpa perlu email. Kata sandi
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
js/theme.js                 tema terang, gelap, atau ikuti perangkat
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
- Sisa hutang **dihitung ulang** dari catatan, bukan angka tersimpan.
- Belanja dari uang pribadi menambah hutang; belanja dari uang toko tidak.
- Bayar hutang tidak dihitung sebagai belanja.
- Tidak ada tombol hapus semua data; catatan hanya bisa dihapus satu per satu.
- Data versi lama dimigrasikan otomatis: catatan uang masuk dibuang, transfer,
  pindah dana, prive, dan modal diabaikan, dan belanja lama dianggap dibayar
  dari uang pribadi.

## Batasan

- Belum ada pencatatan uang masuk, jadi aplikasi ini tidak bisa menghitung
  untung atau rugi. Ia menjawab satu pertanyaan: berapa hutang toko ke uang
  pribadi.
- Sinkronisasi memakai aturan **tulisan terakhir menang**: perangkat yang paling
  akhir diubah yang dipakai, dan catatan di perangkat yang belum sempat terkirim
  ikut dikirim ke akun, bukan dihapus.
- Paket gratis Supabase mengistirahatkan project setelah 7 hari tanpa pemakaian.
  Data tidak hilang, project tinggal dibangunkan.
- Kata sandi tidak ada di kode. Yang ada di `js/config.js` hanya kunci anon
  Supabase yang memang publik, dilindungi Row Level Security.

## Berikutnya

- Cetak/ekspor laporan bulanan ke PDF
