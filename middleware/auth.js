const User = require('../models/User');

// Middleware to ensure user is logged in
const ensureAuthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).populate('assignedLabs');
      if (!user || !user.isActive) {
        req.session.destroy(() => {
          res.redirect('/auth/login?error=' + encodeURIComponent('Account is inactive or does not exist.'));
        });
        return;
      }
      req.user = user;
      res.locals.currentUser = user;
      return next();
    } catch (err) {
      console.error('[Auth Middleware Error]:', err);
      return res.redirect('/auth/login');
    }
  }

  // Handle AJAX / JSON requests
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  req.flash('error_msg', 'Please log in to access this page.');
  return res.redirect(`/auth/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
};

// Middleware to prevent logged-in users from visiting login/register
const ensureGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return next();
};

// Middleware to populate global view variables
const setLocals = (req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.info_msg = req.flash('info_msg');
  res.locals.warning_msg = req.flash('warning_msg');
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  res.locals.isAuthenticated = !!(req.session && req.session.userId);
  next();
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  setLocals
};
