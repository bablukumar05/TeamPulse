const express = require('express');
const router  = express.Router();
const mc = require('../controllers/milestoneController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/',             protect, authorizeRoles('Admin','Manager'), mc.createMilestone);
router.get('/',              protect, mc.getMilestones);
router.put('/:id',           protect, authorizeRoles('Admin','Manager'), mc.updateMilestone);
router.delete('/:id',        protect, authorizeRoles('Admin','Manager'), mc.deleteMilestone);
router.get('/:id/tasks',     protect, mc.getMilestoneTasks);

module.exports = router;
