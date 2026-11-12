// [Dikerjakan oleh: Distania_9]

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const newman = require('newman');
const { createClient } = require('redis');
const pool = require('../src/config/database');
const createApp = require('../src/app');

async function verifyDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Koneksi ke basis data PostgreSQL lokal terverifikasi.');
  } catch (err) {
    console.error('\n[DATABASE CONNECTION ERROR]');
    console.error('Tidak dapat terhubung ke server PostgreSQL lokal.');
    console.error(`Host: ${process.env.PGHOST || 'localhost'}, Port: ${process.env.PGPORT || 5432}, User: ${process.env.PGUSER || 'postgres'}, Database: ${process.env.PGDATABASE || 'openjob_db'}`);
    console.error('Pastikan PostgreSQL telah berjalan secara lokal dan kredensial pada berkas .env sudah sesuai.');
    console.error(`Detail error: ${err.message}\n`);
    throw err;
  }
}

async function cleanDatabase() {
  console.log('Membersihkan tabel basis data untuk pengujian...');
  await pool.query(
    'TRUNCATE TABLE authentications, documents, bookmarks, applications, jobs, categories, companies, users CASCADE'
  );
  console.log('Tabel basis data berhasil dibersihkan.');
}

async function flushCache() {
  const client = createClient({ socket: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379 } });
  await client.connect();
  await client.flushDb();
  await client.destroy();
  console.log('Cache Redis berhasil dibersihkan.');
}

async function runTests() {
  try {
    await verifyDatabaseConnection();
  } catch (err) {
    process.exit(1);
  }

  const app = createApp();
  const port = process.env.PORT || 3000;
  const server = app.listen(port, async () => {
    console.log(`Server pengujian berjalan pada port ${port}`);

    try {
      await cleanDatabase();
      await flushCache();

      const collectionPath = path.resolve(__dirname, '../Postman/[271] OpenJob API Test V2.postman_collection.json');
      const environmentPath = path.resolve(__dirname, '../Postman/OpenJob API.postman_environment.json');

      // Folder Documents butuh upload file manual, jadi tidak ikut dijalankan otomatis
      const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
      const folders = collection.item.map((item) => item.name).filter((name) => !name.includes('Documents'));

      console.log('Memulai runner Newman...');
      newman.run(
        {
          collection: collectionPath,
          environment: environmentPath,
          folder: folders,
          reporters: ['cli'],
          bail: false,
        },
        async (err, summary) => {
          server.close();
          await pool.end();

          if (err) {
            console.error('Newman mengalami error eksekusi:', err);
            process.exit(1);
          }

          const stats = summary.run.stats;
          console.log('\n=============================================');
          console.log('            RINGKASAN HASIL PENGUJIAN');
          console.log('=============================================');
          console.log(`Requests:   Total: ${stats.requests.total}, Gagal: ${stats.requests.failed}`);
          console.log(`Assertions: Total: ${stats.assertions.total}, Gagal: ${stats.assertions.failed}`);

          if (summary.run.failures.length > 0) {
            console.log('\n--- DAFTAR KEGAGALAN ---');
            summary.run.failures.forEach((f, idx) => {
              console.log(`${idx + 1}. [${f.source.name}] ${f.error.test}: ${f.error.message}`);
            });
            process.exit(1);
          } else {
            console.log('\nSELURUH PENGUJIAN BERHASIL LULUS! (100% PASS RATE)');
            process.exit(0);
          }
        }
      );
    } catch (dbErr) {
      console.error('Pengaturan basis data gagal:', dbErr);
      server.close();
      await pool.end();
      process.exit(1);
    }
  });
}

runTests();
