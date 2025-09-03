const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['earned', 'spent', 'bonus', 'penalty'],
        required: true
    },
    source: {
        type: String,
        required: true,
        enum: [
            'rewarded_video',
            'interstitial_ad',
            'banner_ad',
            'game_completion',
            'daily_bonus',
            'achievement',
            'referral',
            'payout',
            'admin_adjustment',
            'unknown'
        ]
    },
    description: {
        type: String,
        maxlength: 200
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0
    },
    metadata: {
        adUnitId: String,
        gameSessionId: String,
        achievementId: String,
        referralUserId: mongoose.Schema.Types.ObjectId
    },
    ipAddress: String,
    deviceInfo: {
        deviceId: String,
        platform: String
    }
}, {
    timestamps: true
});

// Indexes for performance
coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ source: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1, createdAt: -1 });
coinTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);
