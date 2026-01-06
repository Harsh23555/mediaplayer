import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['video', 'audio'],
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    format: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        default: null
    },
    metadata: {
        artist: String,
        album: String,
        year: Number,
        genre: String,
        resolution: String,
        bitrate: String,
        codec: String
    },
    subtitles: [{
        language: String,
        path: String
    }],
    audioTracks: [{
        language: String,
        index: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastPlayed: {
        type: Date,
        default: null
    },
    playCount: {
        type: Number,
        default: 0
    }
});

// Indexes for better query performance
mediaSchema.index({ title: 'text' });
mediaSchema.index({ type: 1 });
mediaSchema.index({ createdAt: -1 });

const Media = mongoose.model('Media', mediaSchema);

export default Media;
