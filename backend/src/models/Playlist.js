import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    items: [{
        mediaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    thumbnail: {
        type: String,
        default: null
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
playlistSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
