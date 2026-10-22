// [Dikerjakan oleh: Distania_9]

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const {
  PostApplicationPayloadSchema,
  PutApplicationPayloadSchema,
} = require('../validator/applications/schema');

const createApplicationsRouter = (applicationsController, cacheService) => {
  const router = express.Router();

  router.post('/', authMiddleware, validateMiddleware(PostApplicationPayloadSchema), applicationsController.postApplicationHandler);
  router.get('/', authMiddleware, applicationsController.getApplicationsHandler);
  router.get('/user/:userId', authMiddleware, cacheMiddleware(cacheService, (req) => `applications:user:${req.params.userId}`), applicationsController.getApplicationsByUserIdHandler);
  router.get('/job/:jobId', authMiddleware, cacheMiddleware(cacheService, (req) => `applications:job:${req.params.jobId}`), applicationsController.getApplicationsByJobIdHandler);
  router.get('/:id', authMiddleware, cacheMiddleware(cacheService, (req) => `applications:${req.params.id}`), applicationsController.getApplicationByIdHandler);
  router.put('/:id', authMiddleware, validateMiddleware(PutApplicationPayloadSchema), applicationsController.putApplicationStatusHandler);
  router.delete('/:id', authMiddleware, applicationsController.deleteApplicationHandler);

  return router;
};

module.exports = createApplicationsRouter;
