// [Dikerjakan oleh: Distania_9]

const { nanoid } = require('nanoid');
const pool = require('../config/database');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');
const AuthorizationError = require('../exceptions/AuthorizationError');

class DocumentsService {
  constructor() {
    this._pool = pool;
  }

  async addDocument({ userId, filename, originalName, size }) {
    const id = `document-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO documents (id, user_id, filename, original_name, size)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
      values: [id, userId, filename, originalName, size],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Dokumen gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getDocuments() {
    const result = await this._pool.query(
      'SELECT id, user_id, filename, original_name, size, created_at FROM documents ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async getDocumentById(id) {
    const query = {
      text: 'SELECT id, user_id, filename, original_name, size, created_at FROM documents WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Dokumen tidak ditemukan');
    }

    return result.rows[0];
  }

  async verifyDocumentOwner(id, userId) {
    const document = await this.getDocumentById(id);
    if (document.user_id !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses dokumen ini');
    }
  }

  async deleteDocumentById(id) {
    const query = {
      text: 'DELETE FROM documents WHERE id = $1 RETURNING filename',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Gagal menghapus dokumen. Id tidak ditemukan');
    }

    return result.rows[0].filename;
  }
}

module.exports = DocumentsService;
