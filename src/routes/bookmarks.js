// [Dikerjakan oleh: Distania_9]

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');

const createBookmarksRouter = (bookmarksController, cacheService) => {
  const router = express.Router();

  router.get('/', authMiddleware, cacheMiddleware(cacheService, (req) => `bookmarks:${req.user.id}`), bookmarksController.getBookmarksHandler);

  return router;
};

module.exports = createBookmarksRouter;
