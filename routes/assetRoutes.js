const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { ensureAuthenticated } = require('../middleware/auth');
const { isLabStaff, isAdmin } = require('../middleware/role');
const { validateObjectId, validateAssetInput } = require('../middleware/validation');

// Catalog / Browse (All Authenticated Users)
router.get('/', ensureAuthenticated, assetController.getIndex);

// Create Asset Form & POST (Admin & Lab In-charge)
router.get('/create', ensureAuthenticated, isLabStaff, assetController.getCreate);
router.post('/create', ensureAuthenticated, isLabStaff, validateAssetInput, assetController.postCreate);

// Asset Details
router.get('/:id', ensureAuthenticated, validateObjectId('id'), assetController.getShow);

// Edit Asset Form & POST (Admin & Lab In-charge)
router.get('/:id/edit', ensureAuthenticated, isLabStaff, validateObjectId('id'), assetController.getEdit);
router.post('/:id/edit', ensureAuthenticated, isLabStaff, validateObjectId('id'), validateAssetInput, assetController.postEdit);

// Delete Asset (Admin Only)
router.post('/:id/delete', ensureAuthenticated, isAdmin, validateObjectId('id'), assetController.postDelete);

module.exports = router;
