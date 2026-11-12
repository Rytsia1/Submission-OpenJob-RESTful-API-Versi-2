// [Dikerjakan oleh: Distania_9]

// Response GET dari cache bila ada (X-Data-Source: cache),
// selain itu dari database lalu response 200 disimpan ke cache.
const cacheMiddleware = (cacheService, getKey) => async (req, res, next) => {
  const key = getKey(req);
  const cached = await cacheService.get(key);

  if (cached) {
    res.set('X-Data-Source', 'cache');
    return res.status(200).json(cached);
  }

  res.set('X-Data-Source', 'database');
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200) {
      cacheService.set(key, body);
    }
    return sendJson(body);
  };

  return next();
};

module.exports = cacheMiddleware;
