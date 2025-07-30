const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  ideaId: { type: mongoose.Schema.Types.ObjectId },
  founder_id: { type: String, required: true },
  positionId: { type: String, required: true },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  coverLetter: { type: String },
  resumeUrl: { type: String },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Rejected', 'Accepted'],
    default: 'Pending',
  },
  submittedDate: { type: String, default: () => new Date().toISOString() },
});


module.exports = mongoose.model('Application', ApplicationSchema);