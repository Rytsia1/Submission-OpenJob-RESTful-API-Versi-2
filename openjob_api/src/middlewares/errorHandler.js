// [Dikerjakan oleh: Distania_9]

const multer = require('multer');
const ClientError = require('../exceptions/ClientError');

const errorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({
      status: 'failed',
      message: err.message,
    });
  }

  if (err instanceof multer.MulterError) {
    const isTooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(isTooLarge ? 413 : 400).json({
      status: 'failed',
      message: isTooLarge ? 'Ukuran file melebihi batas maksimal 5MB' : err.message,
    });
  }

  // Handle express JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid JSON payload format',
    });
  }

  console.error('Internal Server Error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kegagalan pada server kami',
  });
};

module.exports = errorHandler;
