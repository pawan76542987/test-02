const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { ensureAuthenticated } = require('../middleware/auth');
const { isLabStaff } = require('../middleware/role');

router.use(ensureAuthenticated, isLabStaff);

// View Reports Dashboard
router.get('/', reportController.getReports);

// CSV Exports
router.get('/export/assets', reportController.exportAssetsCsv);
router.get('/export/requests', reportController.exportRequestsCsv);

module.exports = router;
