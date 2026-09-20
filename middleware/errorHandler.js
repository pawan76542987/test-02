// Global 404 Handler
const notFoundHandler = (req, res, next) => {
  res.status(404);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({ success: false, message: 'Resource not found (404)' });
  }
  res.render('errors/404', {
    title: '404 - Page Not Found',
    path: req.originalUrl,
    user: req.user || (req.session ? req.session.user : null)
  });
};

// Global Error Handler
const globalErrorHandler = (err, req, res, next) => {
  console.error('[Unhandled Error]:', err);

  // Mongoose Cast Error (bad ObjectId)
  if (err.name === 'CastError') {
    req.flash('error_msg', `Invalid resource identifier.`);
    return res.redirect('back');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `A record with this ${field} already exists. Please choose a different one.`;
    req.flash('error_msg', message);
    return res.redirect('back');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    req.flash('error_msg', messages.join(', '));
    return res.redirect('back');
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode);

  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }

  res.render('errors/500', {
    title: `${statusCode} - Server Error`,
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected server error occurred. Please try again.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
    user: req.user || (req.session ? req.session.user : null)
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
