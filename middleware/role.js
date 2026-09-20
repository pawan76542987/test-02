// Middleware to check if user has one of the required roles
const ensureRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error_msg', 'Please login to continue.');
      return res.redirect('/auth/login');
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You do not have permission to perform this action.'
        });
      }
      return res.status(403).render('errors/403', {
        title: '403 Forbidden',
        message: 'You do not have permission to access this protected resource.',
        user: req.user
      });
    }

    next();
  };
};

// Role specific shorthands
const isAdmin = ensureRole(['admin']);
const isLabIncharge = ensureRole(['lab_incharge']);
const isLabStaff = ensureRole(['admin', 'lab_incharge']);
const isRequester = ensureRole(['student', 'staff']);

module.exports = {
  ensureRole,
  isAdmin,
  isLabIncharge,
  isLabStaff,
  isRequester
};
