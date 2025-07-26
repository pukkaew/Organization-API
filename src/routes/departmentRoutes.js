// Path: /src/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Display all departments
router.get('/', departmentController.showDepartmentsPage);

// Display create form (ต้องอยู่ก่อน /:code)
router.get('/new', departmentController.showCreateDepartmentForm);
router.get('/create', departmentController.showCreateDepartmentForm); // เพิ่ม route มาตรฐาน

// Create department
router.post('/', departmentController.handleCreateDepartment);

// Display edit form
router.get('/:code/edit', departmentController.showEditDepartmentForm);

// Update department
router.put('/:code', departmentController.handleUpdateDepartment);
router.post('/:code', departmentController.handleUpdateDepartment); // Backup for method-override

// Toggle status
router.post('/:code/toggle-status', departmentController.handleToggleStatus);

// Delete department
router.delete('/:code', departmentController.handleDeleteDepartment);
router.post('/:code/delete', departmentController.handleDeleteDepartment); // Backup for method-override

module.exports = router;