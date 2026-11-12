// [Dikerjakan oleh: Distania_9]

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadDocument } = require('../middlewares/uploadMiddleware');

const createDocumentsRouter = (documentsController) => {
  const router = express.Router();

  router.post('/', authMiddleware, uploadDocument, documentsController.postDocumentHandler);
  router.get('/', documentsController.getDocumentsHandler);
  router.get('/:id', documentsController.getDocumentByIdHandler);
  router.delete('/:id', authMiddleware, documentsController.deleteDocumentByIdHandler);

  return router;
};

module.exports = createDocumentsRouter;
