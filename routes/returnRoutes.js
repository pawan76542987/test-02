const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { ensureAuthenticated } = require('../middleware/auth');
const { isLabStaff } = require('../middleware/role');
const { validateObjectId } = require('../middleware/validation');

// Issue equipment for an approved request
router.post('/:id/issue', ensureAuthenticated, isLabStaff, validateObjectId('id'), returnController.postIssue);

// Process Return Page
router.get('/:id/process', ensureAuthenticated, isLabStaff, validateObjectId('id'), returnController.getReturnPage);

// Record Return POST
router.post('/:id/return', ensureAuthenticated, isLabStaff, validateObjectId('id'), returnController.postReturn);

module.exports = router;
