const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { ensureAuthenticated } = require('../middleware/auth');
const { isLabStaff } = require('../middleware/role');
const { validateObjectId, validateIssueRequest } = require('../middleware/validation');

// Request List (Role Filtered)
router.get('/', ensureAuthenticated, requestController.getIndex);

// New Request Form & Submit
router.get('/new', ensureAuthenticated, requestController.getNew);
router.post('/', ensureAuthenticated, validateIssueRequest, requestController.postCreate);

// View Request Details
router.get('/:id', ensureAuthenticated, validateObjectId('id'), requestController.getShow);

// Approve Request (Lab In-charge & Admin)
router.post('/:id/approve', ensureAuthenticated, isLabStaff, validateObjectId('id'), requestController.postApprove);

// Reject Request (Lab In-charge & Admin)
router.post('/:id/reject', ensureAuthenticated, isLabStaff, validateObjectId('id'), requestController.postReject);

// Cancel Request (Requester or Admin)
router.post('/:id/cancel', ensureAuthenticated, validateObjectId('id'), requestController.postCancel);

module.exports = router;
