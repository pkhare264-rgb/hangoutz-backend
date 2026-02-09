import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  bio: { type: String },
  photos: [{ type: String }],
  interests: [{ type: String }],
  completedProfile: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);