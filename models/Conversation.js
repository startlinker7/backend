const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participant_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: String,
  name: String,
  last_message_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Conversation', ConversationSchema);