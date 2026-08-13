const express = require('express');
const router  = express.Router();
const sc = require('../controllers/sprintController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/',                       protect, authorizeRoles('Admin','Manager'), sc.createSprint);
router.get('/',                        protect, sc.getSprints);
router.put('/:id',                     protect, authorizeRoles('Admin','Manager'), sc.updateSprint);
router.put('/:id/start',               protect, authorizeRoles('Admin','Manager'), sc.startSprint);
router.put('/:id/complete',            protect, authorizeRoles('Admin','Manager'), sc.completeSprint);
router.delete('/:id',                  protect, authorizeRoles('Admin','Manager'), sc.deleteSprint);
router.get('/:id/tasks',               protect, sc.getSprintTasks);
router.put('/task/:taskId/move',       protect, sc.moveTaskToSprint);

module.exports = router;
