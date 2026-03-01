import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    targetType: {
        type: String,
        enum: ['user', 'event'],
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'spam',
            'harassment',
            'inappropriate_content',
            'fake_profile',
            'scam',
            'violence',
            'other'
        ]
    },
    details: {
        type: String,
        default: '',
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

reportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Report', reportSchema);
