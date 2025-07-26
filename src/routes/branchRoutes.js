// Path: /src/routes/branchRoutes.js
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');

// Display all branches
router.get('/', branchController.showBranchesPage);

// Display create form (ต้องอยู่ก่อน /:code)
router.get('/new', branchController.showCreateBranchForm);
router.get('/create', branchController.showCreateBranchForm); // เพิ่ม route มาตรฐาน

// Create branch
router.post('/', branchController.handleCreateBranch);

// Display edit form
router.get('/:code/edit', branchController.showEditBranchForm);

// Update branch
router.put('/:code', branchController.handleUpdateBranch);
router.post('/:code', branchController.handleUpdateBranch); // Backup for method-override

// Toggle status
router.post('/:code/toggle-status', branchController.handleToggleStatus);

// Delete branch
router.delete('/:code', branchController.handleDeleteBranch);
router.post('/:code/delete', branchController.handleDeleteBranch); // Backup for method-override

module.exports = router;