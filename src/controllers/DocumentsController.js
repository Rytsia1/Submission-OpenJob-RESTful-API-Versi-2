// [Dikerjakan oleh: Distania_9]

const fs = require('fs');
const path = require('path');
const InvariantError = require('../exceptions/InvariantError');
const { UPLOAD_DIR, FILE_REQUIRED_MESSAGE } = require('../middlewares/uploadMiddleware');

class DocumentsController {
  constructor(documentsService) {
    this._documentsService = documentsService;

    this.postDocumentHandler = this.postDocumentHandler.bind(this);
    this.getDocumentsHandler = this.getDocumentsHandler.bind(this);
    this.getDocumentByIdHandler = this.getDocumentByIdHandler.bind(this);
    this.deleteDocumentByIdHandler = this.deleteDocumentByIdHandler.bind(this);
  }

  async postDocumentHandler(req, res, next) {
    try {
      if (!req.file) {
        throw new InvariantError(FILE_REQUIRED_MESSAGE);
      }

      const { filename, originalname, size } = req.file;
      const documentId = await this._documentsService.addDocument({
        userId: req.user.id,
        filename,
        originalName: originalname,
        size,
      });

      return res.status(201).json({
        status: 'success',
        data: {
          documentId,
          filename,
          originalName: originalname,
          size,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentsHandler(req, res, next) {
    try {
      const documents = await this._documentsService.getDocuments();

      return res.status(200).json({
        status: 'success',
        data: {
          documents,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocumentByIdHandler(req, res, next) {
    try {
      const document = await this._documentsService.getDocumentById(req.params.id);

      return res.sendFile(path.join(UPLOAD_DIR, document.filename), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.original_name)}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocumentByIdHandler(req, res, next) {
    try {
      const { id } = req.params;
      await this._documentsService.verifyDocumentOwner(id, req.user.id);
      const filename = await this._documentsService.deleteDocumentById(id);
      await fs.promises.rm(path.join(UPLOAD_DIR, filename), { force: true });

      return res.status(200).json({
        status: 'success',
        message: 'Dokumen berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentsController;
