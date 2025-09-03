const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // in seconds
        min: 0
    },
    coinsEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    gameStats: {
        ballsDropped: {
            type: Number,
            default: 0,
            min: 0
        },
        successfulHits: {
            type: Number,
            default: 0,
            min: 0
        },
        highestScore: {
            type: Number,
            default: 0,
            min: 0
        },
        levelsCompleted: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    adsWatched: [{
        adType: {
            type: String,
            enum: ['rewarded_video', 'interstitial', 'banner'],
            required: true
        },
        adUnitId: String,
        watchedAt: {
            type: Date,
            default: Date.now
        },
        coinsRewarded: {
            type: Number,
            default: 0,
            min: 0
        },
        completed: {
            type: Boolean,
            default: false
        }
    }],
    deviceInfo: {
        deviceId: String,
        platform: {
            type: String,
            enum: ['iOS', 'Android', 'WebGL']
        },
        version: String,
        screenResolution: String
    },
    ipAddress: String,
    country: String,
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for performance
gameSessionSchema.index({ userId: 1, startTime: -1 });
gameSessionSchema.index({ startTime: -1 });
gameSessionSchema.index({ isCompleted: 1, startTime: -1 });
gameSessionSchema.index({ sessionId: 1 }, { unique: true });

// Pre-save middleware to calculate duration
gameSessionSchema.pre('save', function(next) {
    if (this.endTime && this.startTime) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
    next();
});

// Method to end session
gameSessionSchema.methods.endSession = function() {
    if (!this.endTime) {
        this.endTime = new Date();
        this.isCompleted = true;
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
    return this.save();
};

// Static method to get user engagement stats
gameSessionSchema.statics.getUserEngagementStats = async function(userId, timeframe = 'all') {
    const matchCondition = { userId: new mongoose.Types.ObjectId(userId) };
    
    // Add time filter based on timeframe
    const now = new Date();
    switch (timeframe) {
        case 'daily':
            matchCondition.startTime = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
            break;
        case 'weekly':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            matchCondition.startTime = { $gte: weekStart };
            break;
        case 'monthly':
            matchCondition.startTime = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
            break;
    }
    
    const stats = await this.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                totalDuration: { $sum: '$duration' },
                totalCoinsEarned: { $sum: '$coinsEarned' },
                totalAdsWatched: { $sum: { $size: '$adsWatched' } },
                avgSessionDuration: { $avg: '$duration' }
            }
        }
    ]);
    
    return stats[0] || {
        totalSessions: 0,
        totalDuration: 0,
        totalCoinsEarned: 0,
        totalAdsWatched: 0,
        avgSessionDuration: 0
    };
};

module.exports = mongoose.model('GameSession', gameSessionSchema);
