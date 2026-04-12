const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Create a project
router.post('/', async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = new Project({ name, description, members });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate('members', 'firstName email');
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get projects', error: error.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
});

module.exports = router;
