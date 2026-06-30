module.exports = function errorMiddleware(err, req, res, next) {
  try {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
  } catch (e) {
    // ignore logging errors
  }
  const status = err && err.statusCode ? err.statusCode : (err && err.status) ? err.status : 500;
  const message = err && err.message ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
};
