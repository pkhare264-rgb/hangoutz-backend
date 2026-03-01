import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },

  // Firebase UID for Firebase Phone Authentication
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  // Profile fields
  name: { type: String, default: '' },
  dob: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  bio: { type: String, default: '', maxlength: 500 },
  photoURL: { type: String, default: '' },
  photos: [{ type: String }],
  interests: [{ type: String }],
  completedProfile: { type: Boolean, default: false },

  // Verification
  verified: { type: Boolean, default: false },
  verificationPhotoURL: { type: String, default: '' },
  trustScore: { type: Number, default: 50, min: 0, max: 100 },

  // Events tracking
  hostedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  joinedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],

  // Social
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Privacy
  privacySettings: {
    showAge: { type: Boolean, default: true },
    showGender: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
    showInterests: { type: Boolean, default: true }
  },

  // Push notifications
  fcmToken: { type: String, default: '' },

  // Subscription
  subscription: {
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'none'], default: 'none' },
    expiresAt: { type: Date, default: null },
    subscribedAt: { type: Date, default: null }
  },

  // Timestamps
  lastLogin: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
UserSchema.index({ trustScore: -1 });
UserSchema.index({ 'subscription.plan': 1 });

export default mongoose.model('User', UserSchema);
