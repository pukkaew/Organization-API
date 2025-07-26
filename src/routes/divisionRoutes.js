// Path: /src/routes/divisionRoutes.js
const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');

// Display all divisions
router.get('/', divisionController.showDivisionsPage);

// Display create form (ต้องอยู่ก่อน /:code)
router.get('/new', (req, res) => {
    res.render('divisions/create', { 
        title: 'Create Division',
        csrfToken: req.csrfToken ? req.csrfToken() : null
    });
});
router.get('/create', divisionController.showCreateDivisionForm); // เพิ่ม route มาตรฐาน

// Create division
router.post('/', divisionController.handleCreateDivision);

// Display edit form
router.get('/:code/edit', divisionController.showEditDivisionForm);

// Update division
router.put('/:code', divisionController.handleUpdateDivision);
router.post('/:code', divisionController.handleUpdateDivision); // Backup for method-override

// Toggle status
router.post('/:code/toggle-status', divisionController.handleToggleStatus);

// Delete division
router.delete('/:code', divisionController.handleDeleteDivision);
router.post('/:code/delete', divisionController.handleDeleteDivision); // Backup for method-override

module.exports = router;