const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Project = require('../models/Project');

router.get('/', async (req, res) => {
  try {
    const { q, stage, page = 1, limit = 20 } = req.query;

    const query = {};

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { tagline: regex },
        { founderName: regex },
        { stage: regex },
        { tags: regex },
      ];
    }

    if (stage && stage !== 'All') {
      query.stage = stage;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(query).sort({ postedDate: -1 }).skip(skip).limit(parseInt(limit)),
      Project.countDocuments(query),
    ]);

    // Inject summaries
    const enrichedProjects = projects.map((project) => {
      const lookingForSummary = project.positions?.map(p => p.title) || [];

      const requirementsSummary = [
        ...new Set(
          project.positions?.flatMap(p => p.skills || []) || []
        ),
      ];

      return {
        ...project.toObject(),
        lookingForSummary,
        requirementsSummary,
      };
    });

    res.json({
      projects: enrichedProjects,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error('Error fetching filtered projects:', err);
    res.status(500).json({ error: 'Server error while fetching projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const idea = await Project.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    res.json(idea);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ message: 'Server error fetching project' });
  }
});

// POST /api/projects/create
router.post('/create', authMiddleware, async (req, res) => {

  const { title, description, positions } = req.body;

  if (!title || !description || !positions || positions.length === 0) {
    return res.status(400).json({ message: 'Title, description, and at least one position are required.' });
  }

  try {
    const projectData = {
      ...req.body,
      founder_id: req.user.id,
      founder_name: req.user.name,
    };

    const project = new Project(projectData);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating project.' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id/edit', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.founder_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this project' });
    }

    // Only update fields that are present in req.body
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined) {
        project[key] = value;
      }
    }

    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ message: err.message || 'Server error while updating project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.founder_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this project' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
});


module.exports = router;
