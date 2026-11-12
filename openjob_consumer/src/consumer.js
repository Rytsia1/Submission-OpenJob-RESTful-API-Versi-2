// [Dikerjakan oleh: Distania_9]

// Program consumer terpisah: menerima message lamaran baru dari RabbitMQ
// lalu mengirim email notifikasi ke pemilik lowongan (job owner).
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const pool = require('./config/database');
const { AMQP_URL, APPLICATION_QUEUE } = require('./config/rabbitmq');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const getApplicationNotification = async (applicationId) => {
  const query = {
    text: `
      SELECT applications.created_at,
             applicant.name AS applicant_name, applicant.email AS applicant_email,
             jobs.title AS job_title, companies.name AS company_name,
             owner.name AS owner_name, owner.email AS owner_email
      FROM applications
      JOIN users applicant ON applicant.id = applications.user_id
      JOIN jobs ON jobs.id = applications.job_id
      JOIN companies ON companies.id = jobs.company_id
      JOIN users owner ON owner.id = companies.user_id
      WHERE applications.id = $1
    `,
    values: [applicationId],
  };

  const result = await pool.query(query);
  return result.rows[0];
};

const sendNotificationEmail = (data) => {
  const appliedAt = new Date(data.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  return transporter.sendMail({
    from: `"OpenJob" <${process.env.MAIL_USER}>`,
    to: data.owner_email,
    subject: `Lamaran baru untuk lowongan ${data.job_title}`,
    text: [
      `Halo ${data.owner_name},`,
      '',
      `Ada kandidat baru yang melamar lowongan "${data.job_title}" di ${data.company_name}.`,
      '',
      `Nama pelamar   : ${data.applicant_name}`,
      `Email pelamar  : ${data.applicant_email}`,
      `Tanggal lamaran: ${appliedAt}`,
      '',
      'Salam,',
      'Tim OpenJob',
    ].join('\n'),
  });
};

const init = async () => {
  const connection = await amqp.connect(AMQP_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(APPLICATION_QUEUE, { durable: true });
  await channel.prefetch(1);

  console.log(`Consumer menunggu message pada queue "${APPLICATION_QUEUE}"`);

  channel.consume(APPLICATION_QUEUE, async (message) => {
    try {
      const { application_id: applicationId } = JSON.parse(message.content.toString());
      const data = await getApplicationNotification(applicationId);

      if (!data) {
        console.log(`Lamaran ${applicationId} atau pemilik lowongannya tidak ditemukan, message dilewati`);
      } else {
        await sendNotificationEmail(data);
        console.log(`Email notifikasi lamaran ${applicationId} terkirim ke ${data.owner_email}`);
      }

      channel.ack(message);
    } catch (error) {
      console.error('Gagal memproses message:', error.message);
      channel.nack(message, false, false);
    }
  });
};

init().catch((error) => {
  console.error('Consumer gagal dijalankan:', error.message);
  process.exit(1);
});
