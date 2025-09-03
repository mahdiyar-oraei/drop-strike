const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    country: {
        type: String,
        required: true,
        maxlength: [2, 'Country code must be 2 characters']
    },
    ipAddress: {
        type: String,
        required: true
    },
    paypalEmail: {
        type: String,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid PayPal email']
    },
    coins: {
        type: Number,
        default: 0,
        min: [0, 'Coins cannot be negative']
    },
    totalCoinsEarned: {
        type: Number,
        default: 0,
        min: [0, 'Total coins earned cannot be negative']
    },
    totalMoneyEarned: {
        type: Number,
        default: 0,
        min: [0, 'Total money earned cannot be negative']
    },
    totalEngagementTime: {
        type: Number,
        default: 0,
        min: [0, 'Engagement time cannot be negative']
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    deviceInfo: {
        deviceId: String,
        platform: String,
        version: String
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: 'en'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for money equivalent
userSchema.virtual('moneyEquivalent').get(function() {
    const conversionRate = parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001;
    return this.coins * conversionRate;
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ totalCoinsEarned: -1 });
userSchema.index({ country: 1 });
userSchema.index({ registrationDate: -1 });
userSchema.index({ lastActiveAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add coins
userSchema.methods.addCoins = async function(amount, source = 'unknown') {
    this.coins += amount;
    this.totalCoinsEarned += amount;
    
    // Create coin transaction record
    const CoinTransaction = require('./CoinTransaction');
    await CoinTransaction.create({
        userId: this._id,
        amount: amount,
        type: 'earned',
        source: source,
        balanceAfter: this.coins
    });
    
    return await this.save();
};

// Method to deduct coins (for payouts)
userSchema.methods.deductCoins = async function(amount, reason = 'payout') {
    if (this.coins < amount) {
        throw new Error('Insufficient coins');
    }
    
    this.coins -= amount;
    
    // Create coin transaction record
    const CoinTransaction = require('./CoinTransaction');
    await CoinTransaction.create({
        userId: this._id,
        amount: -amount,
        type: 'spent',
        source: reason,
        balanceAfter: this.coins
    });
    
    return await this.save();
};

module.exports = mongoose.model('User', userSchema);
