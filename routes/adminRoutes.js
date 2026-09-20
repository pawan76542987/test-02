const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const { validateObjectId } = require('../middleware/validation');

// Apply auth and admin check to all admin routes
router.use(ensureAuthenticated, isAdmin);

// ================= USER MANAGEMENT =================
router.get('/users', adminController.getUsers);
router.get('/users/create', adminController.getCreateUser);
router.post('/users/create', adminController.postCreateUser);
router.post('/users/:id/toggle', validateObjectId('id'), adminController.postToggleUserStatus);
router.get('/users/:id/history', validateObjectId('id'), adminController.getUserHistory);

// ================= CATEGORY MANAGEMENT =================
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.postCreateCategory);
router.post('/categories/:id/edit', validateObjectId('id'), adminController.postEditCategory);
router.post('/categories/:id/delete', validateObjectId('id'), adminController.postDeleteCategory);

// ================= LAB MANAGEMENT =================
router.get('/labs', adminController.getLabs);
router.post('/labs', adminController.postCreateLab);
router.post('/labs/:id/edit', validateObjectId('id'), adminController.postEditLab);
router.post('/labs/:id/delete', validateObjectId('id'), adminController.postDeleteLab);

module.exports = router;
