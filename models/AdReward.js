const mongoose = require('mongoose');

const adRewardSchema = new mongoose.Schema({
    adType: {
        type: String,
        enum: ['rewarded_video', 'interstitial', 'banner'],
        required: true
    },
    adUnitId: {
        type: String,
        required: true
    },
    adUnitName: {
        type: String,
        required: true
    },
    coinReward: {
        type: Number,
        required: true,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        maxlength: 200
    },
    minimumWatchTime: {
        type: Number, // in seconds
        default: 0
    },
    dailyLimit: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    requirements: {
        minLevel: {
            type: Number,
            default: 0
        },
        cooldownMinutes: {
            type: Number,
            default: 0
        }
    },
    analytics: {
        totalViews: {
            type: Number,
            default: 0
        },
        totalRewardsGiven: {
            type: Number,
            default: 0
        },
        totalCoinsDistributed: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
adRewardSchema.index({ adType: 1, isActive: 1 });
adRewardSchema.index({ adUnitId: 1 }, { unique: true });

// Static method to get reward for ad type
adRewardSchema.statics.getRewardForAd = async function(adType, adUnitId) {
    return await this.findOne({ 
        adType, 
        adUnitId, 
        isActive: true 
    });
};

// Method to increment analytics
adRewardSchema.methods.incrementAnalytics = async function(coinsRewarded) {
    this.analytics.totalViews += 1;
    this.analytics.totalRewardsGiven += 1;
    this.analytics.totalCoinsDistributed += coinsRewarded;
    return await this.save();
};

module.exports = mongoose.model('AdReward', adRewardSchema);
