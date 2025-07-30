const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Application = require('../models/Applications');
const Project = require('../models/Project');

// POST: Apply to position
router.post('/project/:ideaId/positions/:positionId/apply', authMiddleware, async (req, res) => {
  const { ideaId, positionId } = req.params;
  const { applicantName, applicantEmail, coverLetter, resumeUrl, founder_id } = req.body;

  if (!applicantName || !applicantEmail || !coverLetter) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const existing = await Application.findOne({
      userId: req.user.id,
      ideaId,
      positionId,
    });

    if (existing) {
      return res.status(409).json({ message: 'You have already applied to this position.' });
    }

    const newApplication = new Application({
      userId: req.user.id,
      ideaId,
      positionId,
      applicantName,
      applicantEmail,
      coverLetter,
      resumeUrl,
      founder_id,
    });

    const saved = await newApplication.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving application:', err);
    res.status(500).send('Internal Server Error');
  }
});

// GET: Get applications by user
router.get('/user/:userId', async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.params.userId });
    res.json(applications);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// DELETE: Delete an application by ID
router.delete('/:applicationId', async (req, res) => {
  const { applicationId } = req.params;

  try {
    const deleted = await Application.findByIdAndDelete(applicationId);

    if (!deleted) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/received', authMiddleware, async (req, res) => {
  try {
    const founderId = req.user.id;
    const applications = await Application.find({ founder_id: founderId })
      .populate('userId', 'name email profilePictureUrl')
      .populate('ideaId', 'title positions founder_id')
      .populate('positionId', 'title')
      .sort({ submittedDate: -1 });
    res.json(applications);
  } catch (err) {
    console.error('Error fetching received applications:', err);
    res.status(500).send('Server error');
  }
});

// PATCH: Update application status
router.patch('/:applicationId/status', authMiddleware, async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  try {
    const app = await Application.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    // Only founder can update status
    if (app.founder_id !== req.user.id.toString()) return res.status(403).json({ message: 'Not authorized' });
    app.status = status;
    await app.save();
    res.json(app);
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ message: 'Failed to update application status' });
  }
});

module.exports = router;
