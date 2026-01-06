import mongoose from 'mongoose';

const downloadSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: 'Untitled'
    },
    type: {
        type: String,
        enum: ['video', 'audio'],
        default: 'video'
    },
    quality: {
        type: String,
        enum: ['4k', '1080p', '720p', '480p', 'audio'],
        default: '1080p'
    },
    status: {
        type: String,
        enum: ['pending', 'downloading', 'paused', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    size: {
        type: Number,
        default: 0
    },
    downloadedSize: {
        type: Number,
        default: 0
    },
    filePath: {
        type: String,
        default: null
    },
    error: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

const Download = mongoose.model('Download', downloadSchema);

export default Download;
