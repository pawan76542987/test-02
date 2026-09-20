const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { ensureAuthenticated } = require('../middleware/auth');
const { isLabStaff } = require('../middleware/role');
const { validateObjectId } = require('../middleware/validation');

// List Maintenance Records
router.get('/', ensureAuthenticated, isLabStaff, maintenanceController.getIndex);

// Schedule Maintenance
router.get('/create', ensureAuthenticated, isLabStaff, maintenanceController.getCreate);
router.post('/create', ensureAuthenticated, isLabStaff, maintenanceController.postCreate);

// Update Maintenance Status (e.g. mark completed)
router.post('/:id/status', ensureAuthenticated, isLabStaff, validateObjectId('id'), maintenanceController.postUpdateStatus);

module.exports = router;
