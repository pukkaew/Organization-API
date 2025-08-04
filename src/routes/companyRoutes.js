// Path: /src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Display all companies
router.get('/', companyController.showCompaniesPage);

// Display create form (ต้องอยู่ก่อน /:code)
router.get('/new', companyController.showCreateCompanyForm);
router.get('/create', companyController.showCreateCompanyForm); // เพิ่ม route มาตรฐาน

// Create company
router.post('/', companyController.handleCreateCompany);

// Display edit form (ต้องอยู่ก่อน /:code ที่เป็น GET)
router.get('/:code/edit', companyController.showEditCompanyForm);

// Update company (ต้องอยู่ก่อน GET /:company_code)
router.put('/:code', companyController.handleUpdateCompany);
router.post('/:code', companyController.handleUpdateCompany); // Backup for method-override

// Toggle status
router.post('/:code/toggle-status', companyController.handleToggleStatus);

// Delete company
router.delete('/:code', companyController.handleDeleteCompany);
router.post('/:code/delete', companyController.handleDeleteCompany); // Backup for method-override

// Show company details (ต้องอยู่หลังสุดเพื่อไม่ให้ทับ routes อื่น)
router.get('/:company_code', companyController.show);

module.exports = router;