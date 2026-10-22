<!-- [Dikerjakan oleh: Distania_9] -->
# OpenJob RESTful API Versi 2

Lanjutan OpenJob RESTful API Versi 1 untuk submission akhir kelas **Belajar Back-End Fundamental dengan JavaScript** (Dicoding). Versi 2 menambahkan:

1. **Unggah berkas CV/Resume (PDF)** dengan `multer` — validasi MIME type `application/pdf` dan ukuran maksimal 5 MB, nama berkas disimpan di tabel `documents`, berkas dapat ditampilkan kembali (`GET /documents/:id`).
2. **Caching Redis** selama 1 jam untuk detail company, user, lamaran, daftar lamaran per user/job, dan daftar bookmark. Response dari cache memiliki header `X-Data-Source: cache` (dari database: `X-Data-Source: database`). Cache dihapus setiap ada perubahan data terkait.
3. **Message queue RabbitMQ** — setiap lamaran baru mengirim message `{ "application_id": "..." }`. Program consumer terpisah (`src/consumer.js`) mengambil data dari database lalu mengirim email (Nodemailer) ke **pemilik lowongan** berisi email pelamar, nama pelamar, dan tanggal lamaran.

Pengujian Postman V2: **164 requests, 398 assertions, 0 gagal** (seluruh folder kecuali Documents) dan folder **[Mandatory] Documents** lulus seluruhnya saat diuji dengan berkas manual.

---

## 🛠️ Teknologi

Node.js, Express 4, PostgreSQL (`pg`, `node-pg-migrate`), Joi, JWT, bcrypt, **multer**, **redis**, **amqplib** (RabbitMQ), **nodemailer**, Newman.

## 🗄️ Perubahan Basis Data Versi 2

- `companies.user_id` — pemilik perusahaan (diisi dari user yang login saat membuat company). Pemilik lowongan = pemilik company dari job tersebut.
- Tabel baru `documents` (`id`, `user_id`, `filename`, `original_name`, `size`, `created_at`).

---

## 📋 Prasyarat

1. Node.js 18+ dan PostgreSQL (database `openjob_db`).
2. **Redis** pada port `6379` (di Windows dapat memakai build portable [redis-windows](https://github.com/redis-windows/redis-windows) atau Memurai).
3. **RabbitMQ** pada port `5672` (membutuhkan Erlang/OTP).
4. Akun SMTP untuk pengujian email, misalnya [Mailtrap](https://mailtrap.io) (Email Testing → SMTP credentials).

## ⚙️ Environment (`.env`)

Salin `.env.example` menjadi `.env`, lalu sesuaikan:

```env
# PostgreSQL & JWT (sama seperti versi 1)
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=openjob_db
PGHOST=localhost
PGPORT=5432
ACCESS_TOKEN_KEY=...
REFRESH_TOKEN_KEY=...
ACCESS_TOKEN_AGE=10800

# Redis
REDIS_HOST=localhost

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# SMTP (Nodemailer)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<username SMTP>
MAIL_PASSWORD=<password SMTP>
```

---

## 📦 Menjalankan Aplikasi

```bash
npm install
npm run migrate:up
npm start                # RESTful API (port 3000)
npm run start:consumer   # program consumer RabbitMQ -> email (terminal terpisah)
```

Contoh menjalankan Redis & RabbitMQ portable di Windows:

```bash
# Redis
redis-server.exe redis.conf

# RabbitMQ (PowerShell)
$env:ERLANG_HOME = "C:\Program Files\Erlang OTP"; .\sbin\rabbitmq-server.bat
```

---

## 🧪 Pengujian

```bash
npm test
```

[`tests/run-postman.js`](tests/run-postman.js) membersihkan tabel PostgreSQL dan cache Redis, menjalankan server, lalu menjalankan koleksi `Postman/[271] OpenJob API Test V2.postman_collection.json` dengan Newman **tanpa folder [Mandatory] Documents** (folder tersebut membutuhkan upload berkas manual).

Pengujian folder **[Mandatory] Documents** dilakukan manual di Postman: pilih berkas `.txt`/`.jpg` pada request *Upload Document with Non-PDF File* dan berkas PDF (≤ 5 MB) pada *Upload Document with Valid PDF*. Folder ini login sebagai `john@example.com`, jadi jalankan setelah folder Authentications (atau setelah `npm test`).

---

## 📋 Endpoint Baru / Berubah di Versi 2

| Method | Endpoint | Keterangan | Autentikasi |
|---|---|---|---|
| `POST` | `/documents` | Unggah PDF (form-data field `document`, maks 5 MB) | Ya |
| `GET` | `/documents` | Daftar dokumen | Tidak |
| `GET` | `/documents/:id` | Menampilkan berkas PDF (`application/pdf`) | Tidak |
| `DELETE` | `/documents/:id` | Menghapus dokumen milik sendiri | Ya |
| `PUT` | `/users/:id` | Memperbarui `name` & `email` user sendiri (hapus cache user) | Ya |
| `POST` | `/applications` | Kini mengembalikan `id, user_id, job_id, status`, menolak lamaran ganda (400), dan mengirim message RabbitMQ | Ya |

### Cache Redis (TTL 1 jam)

| Endpoint | Key | Dihapus saat |
|---|---|---|
| `GET /companies/:id` | `companies:{id}` | create / update / delete company |
| `GET /users/:id` | `users:{id}` | update user |
| `GET /applications/:id` | `applications:{id}` | update / delete lamaran |
| `GET /applications/user/:userId` | `applications:user:{userId}` | create / update / delete lamaran |
| `GET /applications/job/:jobId` | `applications:job:{jobId}` | create / update / delete lamaran |
| `GET /bookmarks` | `bookmarks:{userId}` | create / delete bookmark |

Endpoint lain sama seperti versi 1 (users, authentications, companies, categories, jobs, applications, bookmarks, profile).
