import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  dateTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      '🎵 Music',
      '🧘 Wellness',
      '💻 Tech',
      '🍔 Food',
      '♟️ Chess',
      '📸 Photography',
      '🎮 Gaming',
      '✈️ Travel',
      '🎨 Art',
      '📚 Books',
      '🏃 Sports',
      '🎬 Movies',
      'Other'
    ]
  },
  imageURL: {
    type: String,
    required: true
  },
  host: {
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
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  coordinates: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  maxParticipants: {
    type: Number,
    default: null // null means unlimited
  },
  tags: [{
    type: String,
    maxlength: 30
  }],
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ dateTime: 1, status: 1 });
eventSchema.index({ 'host._id': 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ coordinates: '2dsphere' });
eventSchema.index({ createdAt: -1 });

// Virtual for participant count
eventSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual to check if event is full
eventSchema.virtual('isFull').get(function() {
  if (!this.maxParticipants) return false;
  return this.participants.length >= this.maxParticipants;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Auto-update status based on dateTime
eventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.dateTime);
  const eventEnd = new Date(eventDate.getTime() + 4 * 60 * 60 * 1000); // Assume 4hr duration

  if (now > eventEnd) {
    this.status = 'completed';
  } else if (now >= eventDate && now <= eventEnd) {
    this.status = 'ongoing';
  } else {
    this.status = 'upcoming';
  }
  next();
});

export default mongoose.model('Event', eventSchema);
