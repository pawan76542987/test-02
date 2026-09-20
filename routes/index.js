const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const statsService = require('../services/statsService');

// Landing / Root redirect
router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/auth/login');
});

// Role-Based Dynamic Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const role = req.user.role;

    if (role === 'admin') {
      const stats = await statsService.getAdminStats();
      return res.render('dashboard/admin', {
        title: 'Institutional Administration Dashboard | LabTrack',
        stats
      });
    }

    if (role === 'lab_incharge') {
      const stats = await statsService.getLabInchargeStats(req.user);
      return res.render('dashboard/incharge', {
        title: 'Laboratory In-Charge Dashboard | LabTrack',
        stats
      });
    }

    // Default: Student / Staff Requester
    const stats = await statsService.getRequesterStats(req.user._id);
    return res.render('dashboard/requester', {
      title: 'Requester Dashboard | LabTrack',
      stats
    });
  } catch (err) {
    console.error('[Dashboard Error]:', err);
    req.flash('error_msg', 'Failed to load dashboard data: ' + err.message);
    return res.render('dashboard/requester', {
      title: 'Dashboard | LabTrack',
      stats: { activeRequests: [], recentHistory: [] }
    });
  }
});

module.exports = router;
