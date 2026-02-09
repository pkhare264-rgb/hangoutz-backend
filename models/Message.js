import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationFlag: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ 'sender._id': 1 });
messageSchema.index({ createdAt: -1 });

export default mongoose.model('Message', messageSchema);
