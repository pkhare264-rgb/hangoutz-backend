import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    photoURL: {
      type: String,
      required: true
    }
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  groupName: {
    type: String,
    default: null
  },
  groupPhoto: {
    type: String,
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ 'participants._id': 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ updatedAt: -1 });

// Ensure participants array has at least 2 members
conversationSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    next(new Error('A conversation must have at least 2 participants'));
  } else {
    next();
  }
});

export default mongoose.model('Conversation', conversationSchema);
