// [Dikerjakan oleh: Distania_9]

const { nanoid } = require('nanoid');
const pool = require('../config/database');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');
const AuthorizationError = require('../exceptions/AuthorizationError');

// Kolom daftar lamaran (13 kolom)
const APPLICATION_COLUMNS = `applications.id, applications.user_id, applications.job_id, applications.status,
  applications.created_at, applications.updated_at,
  jobs.title AS job_title, jobs.job_type, jobs.location_type,
  jobs.company_id, companies.name AS company_name,
  users.name AS user_name, users.email AS user_email`;

const APPLICATION_JOINS = `FROM applications
  LEFT JOIN jobs ON jobs.id = applications.job_id
  LEFT JOIN companies ON companies.id = jobs.company_id
  LEFT JOIN users ON users.id = applications.user_id`;

class ApplicationsService {
  constructor() {
    this._pool = pool;
  }

  async verifyUserExists(userId) {
    const query = {
      text: 'SELECT id FROM users WHERE id = $1',
      values: [userId],
    };
    const result = await this._pool.query(query);
    if (result.rows.length === 0) {
      throw new NotFoundError('User tidak ditemukan');
    }
  }

  async verifyJobExists(jobId) {
    const query = {
      text: 'SELECT id FROM jobs WHERE id = $1',
      values: [jobId],
    };
    const result = await this._pool.query(query);
    if (result.rows.length === 0) {
      throw new NotFoundError('Job tidak ditemukan');
    }
  }

  async verifyApplicationOwner(id, userId) {
    const query = {
      text: 'SELECT user_id FROM applications WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (result.rows.length === 0) {
      throw new NotFoundError('Aplikasi tidak ditemukan');
    }
    if (result.rows[0].user_id !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses aplikasi ini');
    }
  }

  async addApplication({ user_id, job_id, status = 'pending' }) {
    await this.verifyUserExists(user_id);
    await this.verifyJobExists(job_id);

    const duplicate = await this._pool.query({
      text: 'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2',
      values: [user_id, job_id],
    });
    if (duplicate.rows.length > 0) {
      throw new InvariantError('Anda sudah melamar pekerjaan ini');
    }

    const id = `application-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO applications (id, user_id, job_id, status)
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id, job_id, status`,
      values: [id, user_id, job_id, status || 'pending'],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Aplikasi gagal ditambahkan');
    }

    return result.rows[0];
  }

  async getApplications() {
    const query = {
      text: `
        SELECT ${APPLICATION_COLUMNS}
        ${APPLICATION_JOINS}
        ORDER BY applications.created_at DESC
      `,
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getApplicationById(id) {
    const query = {
      text: `
        SELECT ${APPLICATION_COLUMNS}
        ${APPLICATION_JOINS}
        WHERE applications.id = $1
      `,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Aplikasi tidak ditemukan');
    }

    return result.rows[0];
  }

  async getApplicationsByUserId(userId) {
    const query = {
      text: `
        SELECT ${APPLICATION_COLUMNS}
        ${APPLICATION_JOINS}
        WHERE applications.user_id = $1
        ORDER BY applications.created_at DESC
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async getApplicationsByJobId(jobId) {
    const query = {
      text: `
        SELECT ${APPLICATION_COLUMNS}
        ${APPLICATION_JOINS}
        WHERE applications.job_id = $1
        ORDER BY applications.created_at DESC
      `,
      values: [jobId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async editApplicationStatusById(id, { status }) {
    const query = {
      text: 'UPDATE applications SET status = $1, updated_at = current_timestamp WHERE id = $2 RETURNING id, user_id, job_id',
      values: [status, id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Gagal memperbarui aplikasi. Id tidak ditemukan');
    }

    return result.rows[0];
  }

  async deleteApplicationById(id) {
    const query = {
      text: 'DELETE FROM applications WHERE id = $1 RETURNING id, user_id, job_id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Gagal menghapus aplikasi. Id tidak ditemukan');
    }

    return result.rows[0];
  }

  // Daftar lamaran untuk profile (13 kolom + kategori = 15 kolom)
  async getProfileApplications(userId) {
    const query = {
      text: `
        SELECT ${APPLICATION_COLUMNS},
               jobs.category_id, categories.name AS category_name
        ${APPLICATION_JOINS}
        LEFT JOIN categories ON categories.id = jobs.category_id
        WHERE applications.user_id = $1
        ORDER BY applications.created_at DESC
      `,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = ApplicationsService;
