// [Dikerjakan oleh: Distania_9]

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const { UserPayloadSchema, PutUserPayloadSchema } = require('../validator/users/schema');

const createUsersRouter = (usersController, cacheService) => {
  const router = express.Router();

  router.post('/', validateMiddleware(UserPayloadSchema), usersController.postUserHandler);
  router.get('/:id', cacheMiddleware(cacheService, (req) => `users:${req.params.id}`), usersController.getUserByIdHandler);
  router.put('/:id', authMiddleware, validateMiddleware(PutUserPayloadSchema), usersController.putUserByIdHandler);

  return router;
};

module.exports = createUsersRouter;
