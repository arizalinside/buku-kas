# Deploy ke Vercel — langkah demi langkah

Kondisi sekarang: repo `buku-kas` sudah ada di
`github.com/arizalinside/buku-kas` (branch `master`), dan seluruh berkas
aplikasi ada di `/Users/arizalinside/Work/buku-kas`.

Total waktu ±15 menit, gratis. Tidak ada email, tidak ada OTP, tidak ada SMTP.

---

## 0. Persiapan

1. Bisa login ke **github.com** dengan akun `arizalinside`.
2. Bisa login ke **vercel.com** dengan akun GitHub yang sama.
3. Terminal dibuka di folder proyek:

```bash
cd /Users/arizalinside/Work/buku-kas
```

---

## 1. Login aplikasi

Login memakai akun Supabase (email + kata sandi). Kata sandi **tidak ada di
kode**: Supabase yang memeriksanya di server, jadi tidak bisa dibaca orang yang
membuka kode halaman.

Akunnya dibuat sekali di dashboard Supabase — lihat
`docs/SETUP-SUPABASE.md` langkah 3. Mengubah kata sandi:
**Authentication → Users → Reset password**.

---

## 2. Sambungkan akun Supabase

Ikuti **`docs/SETUP-SUPABASE.md`** (±10 menit, gratis), lalu isi dua nilai di
`js/config.js`:

```js
SUPABASE_URL: 'https://abcdefgh.supabase.co',
SUPABASE_ANON_KEY: 'anon-atau-publishable-key'
```

Keduanya publik dan aman. Tanpa dua nilai ini aplikasi akan menampilkan pesan
"Penyimpanan akun belum disiapkan" dan tidak bisa dipakai.

---

## 3. Uji dulu di komputer sendiri (±3 menit)

```bash
python3 -m http.server 8080
```

Buka **http://localhost:8080**:

1. Muncul halaman **Masuk**. Coba kata sandi salah dulu — harus muncul
   "Email atau kata sandi salah".
2. Masuk dengan email dan kata sandi akun Supabase Anda.
3. Tambah satu catatan di halaman **Catatan**.
4. Reload halaman: catatan harus tetap ada, dan Anda tetap dalam keadaan masuk.
5. Kalau Supabase sudah diisi: buka **Pengaturan** → **Cadangan otomatis**
   harus **Tersambung**.

Hentikan server dengan **Ctrl+C**.

---

## 4. Commit dan push (±2 menit)

```bash
git add -A
git commit -m "Login internal dan penyimpanan akun"
git push
```

Branch `master` sudah terhubung ke `origin/master`, jadi push langsung masuk.

---

## 5. Deploy di Vercel (±5 menit)

1. Buka **https://vercel.com** → **Log In** → **Continue with GitHub**.
2. Klik **Add New…** → **Project**.
3. Cari `buku-kas` → **Import**.
   - Kalau tidak muncul: **Adjust GitHub App Permissions**, beri akses ke repo
     itu, lalu kembali.
4. Di **Configure Project**:
   - **Project Name**: `buku-kas`
   - **Framework Preset**: **Other**
   - **Root Directory**: `./`
   - **Build Command**: kosong
   - **Output Directory**: kosong
   - **Install Command**: kosong
   - **Environment Variables**: tidak ada
5. Klik **Deploy**, tunggu ±30 detik, salin alamat produksinya
   (mis. `https://buku-kas.vercel.app`).

Setelah ini, setiap `git push` ke `master` otomatis membangun ulang situsnya.

---

## 6. Uji di internet (±3 menit)

1. Buka alamat Vercel di jendela **incognito**.
2. Harus muncul halaman Masuk — bukan langsung Beranda.
3. Masuk dengan akun di `js/config.js`.
4. Tambah satu catatan, reload, catatan harus ada.
5. Kalau Supabase aktif: buka di ponsel, masuk, catatan yang sama harus muncul.

---

## 7. Opsional

- **Domain sendiri**: Vercel → project → **Settings** → **Domains**.
- **Pasang di HP**: buka di Safari/Chrome → Share → **Add to Home Screen**.

---

## Kalau ada masalah

**Halaman Vercel 404**
Setelan Output Directory terisi. Kosongkan, lalu **Redeploy**.

**Langsung masuk Beranda tanpa halaman Masuk**
`js/config.js` gagal dimuat (salah kutip atau salah koma). Buka DevTools →
Console dan cari pesan merah.

**"Email atau kata sandi salah" padahal benar**
Nilai di `js/config.js` berbeda dengan yang diketik. Perhatikan huruf besar/kecil
dan spasi. Ingat juga: perubahan `config.js` baru berlaku setelah push dan
Vercel selesai membangun ulang.

**Kartu Cadangan otomatis "Bermasalah"**
Sesi habis atau tabel belum dibuat. Klik **Coba lagi**; kalau kembali ke halaman
Masuk, masuk lagi dengan akun Supabase Anda.

**Catatan tidak muncul di perangkat lain**
Tekan **Simpan sekarang** di perangkat asal, lalu **Ambil** di perangkat tujuan.
Pastikan keduanya memakai `config.js` yang sama.

**Repo tidak muncul saat import di Vercel**
**Adjust GitHub App Permissions** → beri akses ke repo `buku-kas`.

---

## Catatan penting

- `js/config.js` hanya berisi kunci anon Supabase yang memang publik. Kata sandi
  login tidak ada di kode; Supabase yang memeriksanya di server.
- Jangan pernah menaruh kunci Supabase `service_role` di aplikasi. Yang dipakai
  hanya `anon`/`publishable`.
- Paket gratis Supabase mengistirahatkan project setelah 7 hari tanpa pemakaian.
  Data tidak hilang, project tinggal dibangunkan.
