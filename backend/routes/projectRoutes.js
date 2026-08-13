const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const logger = require('../utils/logger');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Create a project
router.post('/', protect, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const { name, description, startDate, endDate, status, priority, members } = req.body;
    const project = new Project({
      name,
      description,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: status || 'In Progress',
      priority: priority || 'Medium',
      members: members || []
    });
    await project.save();
    logger.info(`Project created: ${project.name} (${project._id})`);
    res.status(201).json(project);
  } catch (error) {
    logger.error('Failed to create project:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
});

// Get all projects
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find().populate('members', 'firstName email');
    res.status(200).json(projects);
  } catch (error) {
    logger.error('Failed to get projects:', error);
    res.status(500).json({ message: 'Failed to get projects', error: error.message });
  }
});

// Update a project
router.put('/:id', protect, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    logger.info(`Project updated: ${project.name} (${project._id})`);
    res.status(200).json(project);
  } catch (error) {
    logger.error('Failed to update project:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
});

// Delete a project
router.delete('/:id', protect, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    logger.info(`Project deleted: ${req.params.id}`);
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    logger.error('Failed to delete project:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
});

module.exports = router;
