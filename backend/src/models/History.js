const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    default: ''
  },
  models: {
    type: String,
    default: ''
  },
  routes: {
    type: String,
    default: ''
  },
  validators: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  sourceType: {
    type: String,
    enum: ['schema', 'openapi', 'graphql', 'ai', 'local', 'ai-image'],
    default: 'schema'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('History', historySchema);