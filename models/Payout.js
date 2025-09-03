const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Payout amount must be at least $0.01']
    },
    coinsDeducted: {
        type: Number,
        required: true,
        min: 1
    },
    paypalEmail: {
        type: String,
        required: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid PayPal email']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    paypalTransactionId: {
        type: String,
        sparse: true
    },
    paypalBatchId: {
        type: String,
        sparse: true
    },
    paypalPayoutItemId: {
        type: String,
        sparse: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    failureReason: {
        type: String,
        maxlength: 500
    },
    adminNotes: {
        type: String,
        maxlength: 1000
    },
    conversionRate: {
        type: Number,
        required: true
    },
    fees: {
        paypalFee: {
            type: Number,
            default: 0
        },
        platformFee: {
            type: Number,
            default: 0
        }
    },
    netAmount: {
        type: Number,
        required: true
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceInfo: {
            deviceId: String,
            platform: String
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
payoutSchema.index({ userId: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ paypalTransactionId: 1 }, { sparse: true });
payoutSchema.index({ requestedAt: -1 });

// Pre-save middleware to calculate net amount
payoutSchema.pre('save', function(next) {
    if (this.isModified('amount') || this.isModified('fees.paypalFee') || this.isModified('fees.platformFee')) {
        this.netAmount = this.amount - (this.fees.paypalFee || 0) - (this.fees.platformFee || 0);
    }
    next();
});

// Method to mark as processing
payoutSchema.methods.markAsProcessing = function() {
    this.status = 'processing';
    this.processedAt = new Date();
    return this.save();
};

// Method to mark as completed
payoutSchema.methods.markAsCompleted = function(transactionId, batchId, payoutItemId) {
    this.status = 'completed';
    this.completedAt = new Date();
    if (transactionId) this.paypalTransactionId = transactionId;
    if (batchId) this.paypalBatchId = batchId;
    if (payoutItemId) this.paypalPayoutItemId = payoutItemId;
    return this.save();
};

// Method to mark as failed
payoutSchema.methods.markAsFailed = function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    return this.save();
};

// Static method to get payout statistics
payoutSchema.statics.getPayoutStats = async function(timeframe = 'all') {
    const matchCondition = {};
    
    // Add time filter based on timeframe
    const now = new Date();
    switch (timeframe) {
        case 'daily':
            matchCondition.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
            break;
        case 'weekly':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            matchCondition.createdAt = { $gte: weekStart };
            break;
        case 'monthly':
            matchCondition.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
            break;
    }
    
    const stats = await this.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                totalCoins: { $sum: '$coinsDeducted' }
            }
        }
    ]);
    
    return stats;
};

module.exports = mongoose.model('Payout', payoutSchema);
