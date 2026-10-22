// [Dikerjakan oleh: Distania_9]

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/documents');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const FILE_REQUIRED_MESSAGE = 'File is required and must be a PDF document (max 5MB)';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `document-${nanoid(16)}.pdf`),
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new InvariantError(FILE_REQUIRED_MESSAGE));
    }
    return cb(null, true);
  },
}).single('document');

module.exports = { uploadDocument, UPLOAD_DIR, FILE_REQUIRED_MESSAGE };
