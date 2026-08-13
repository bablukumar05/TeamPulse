const express = require('express');
const router  = express.Router();
const wc = require('../controllers/workspaceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ── Workspace ──────────────────────────────────────────────────────────────
router.post('/',              protect, authorizeRoles('Admin'), wc.createWorkspace);
router.get('/:id',            protect, wc.getWorkspace);
router.put('/:id',            protect, authorizeRoles('Admin'), wc.updateWorkspace);
router.get('/:id/members',    protect, wc.getWorkspaceMembers);

// ── Departments ────────────────────────────────────────────────────────────
router.post('/departments',             protect, authorizeRoles('Admin', 'Manager'), wc.createDepartment);
router.get('/departments/all',          protect, wc.getDepartments);
router.put('/departments/:id',          protect, authorizeRoles('Admin', 'Manager'), wc.updateDepartment);
router.delete('/departments/:id',       protect, authorizeRoles('Admin'), wc.deleteDepartment);
router.post('/departments/:id/members', protect, authorizeRoles('Admin', 'Manager'), wc.addMemberToDepartment);

// ── Teams ──────────────────────────────────────────────────────────────────
router.post('/teams',             protect, authorizeRoles('Admin', 'Manager'), wc.createTeam);
router.get('/teams/all',          protect, wc.getTeams);
router.put('/teams/:id',          protect, authorizeRoles('Admin', 'Manager'), wc.updateTeam);
router.delete('/teams/:id',       protect, authorizeRoles('Admin'), wc.deleteTeam);
router.post('/teams/:id/members', protect, authorizeRoles('Admin', 'Manager'), wc.addMemberToTeam);

// ── User Directory ─────────────────────────────────────────────────────────
router.get('/users/directory',  protect, wc.getUserDirectory);
router.get('/users/:id',        protect, wc.getUserProfile);
router.put('/users/:id',        protect, wc.updateUserProfile);

module.exports = router;
