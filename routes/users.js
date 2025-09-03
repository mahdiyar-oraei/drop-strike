const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const GameSession = require('../models/GameSession');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Get recent coin transactions
        const recentTransactions = await CoinTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('amount type source description createdAt');

        // Get today's earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayEarnings = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    type: 'earned',
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCoins: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            }
        ]);

        // Get weekly stats
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weeklyStats = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    type: 'earned',
                    createdAt: { $gte: weekStart }
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalCoins: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    source: '$_id',
                    totalCoins: 1,
                    count: 1
                }
            }
        ]);

        // Get engagement stats for the week
        const engagementStats = await GameSession.getUserEngagementStats(req.user._id, 'weekly');

        const conversionRate = parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001;

        res.json({
            success: true,
            data: {
                user: {
                    name: user.name,
                    email: user.email,
                    coins: user.coins,
                    moneyEquivalent: user.coins * conversionRate,
                    totalCoinsEarned: user.totalCoinsEarned,
                    totalEngagementTime: user.totalEngagementTime,
                    registrationDate: user.registrationDate,
                    country: user.country
                },
                todayEarnings: todayEarnings[0] || { totalCoins: 0, transactionCount: 0 },
                weeklyStats,
                engagementStats,
                recentTransactions,
                conversionRate
            }
        });

    } catch (error) {
        logger.error('Get user dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching dashboard data'
        });
    }
});

// Get coin transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            type, 
            source, 
            startDate, 
            endDate 
        } = req.query;
        const skip = (page - 1) * limit;

        const filter = { userId: req.user._id };
        if (type) filter.type = type;
        if (source) filter.source = source;
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        const transactions = await CoinTransaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('amount type source description balanceAfter createdAt metadata');

        const totalTransactions = await CoinTransaction.countDocuments(filter);

        // Get summary by type
        const summary = await CoinTransaction.aggregate([
            { $match: { userId: req.user._id } },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: '$_id',
                    totalAmount: 1,
                    count: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                transactions,
                summary,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalTransactions / limit),
                    totalTransactions,
                    hasNextPage: skip + transactions.length < totalTransactions,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Get coin transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching transaction history'
        });
    }
});

// Get earnings analytics
router.get('/analytics/earnings', authenticateToken, async (req, res) => {
    try {
        const { timeframe = 'monthly' } = req.query;

        let dateFilter = {};
        const now = new Date();
        
        switch (timeframe) {
            case 'daily':
                // Last 30 days, grouped by day
                dateFilter.createdAt = {
                    $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                };
                break;
            case 'weekly':
                // Last 12 weeks, grouped by week
                dateFilter.createdAt = {
                    $gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
                };
                break;
            case 'monthly':
                // Last 12 months, grouped by month
                dateFilter.createdAt = {
                    $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1)
                };
                break;
        }

        const groupBy = timeframe === 'daily' ? 
            { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } :
            timeframe === 'weekly' ?
            { $dateToString: { format: "%Y-W%U", date: "$createdAt" } } :
            { $dateToString: { format: "%Y-%m", date: "$createdAt" } };

        const earningsData = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    type: 'earned',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        period: groupBy,
                        source: '$source'
                    },
                    totalCoins: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.period',
                    sources: {
                        $push: {
                            source: '$_id.source',
                            totalCoins: '$totalCoins',
                            count: '$count'
                        }
                    },
                    totalCoins: { $sum: '$totalCoins' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get top earning sources
        const topSources = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    type: 'earned',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalCoins: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgCoinsPerTransaction: { $avg: '$amount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    source: '$_id',
                    totalCoins: 1,
                    count: 1,
                    avgCoinsPerTransaction: { $round: ['$avgCoinsPerTransaction', 2] }
                }
            },
            { $sort: { totalCoins: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                earningsData,
                topSources,
                timeframe
            }
        });

    } catch (error) {
        logger.error('Get earnings analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching earnings analytics'
        });
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Calculate various statistics
        const stats = await Promise.all([
            // Total sessions
            GameSession.countDocuments({ userId: req.user._id }),
            
            // Average session duration
            GameSession.aggregate([
                { $match: { userId: req.user._id, duration: { $gt: 0 } } },
                { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
            ]),
            
            // Best game performance
            GameSession.aggregate([
                { $match: { userId: req.user._id } },
                {
                    $group: {
                        _id: null,
                        maxCoinsInSession: { $max: '$coinsEarned' },
                        maxBallsDropped: { $max: '$gameStats.ballsDropped' },
                        maxSuccessfulHits: { $max: '$gameStats.successfulHits' },
                        maxScore: { $max: '$gameStats.highestScore' }
                    }
                }
            ]),
            
            // Coins earned by source
            CoinTransaction.aggregate([
                { $match: { userId: req.user._id, type: 'earned' } },
                {
                    $group: {
                        _id: '$source',
                        totalCoins: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalCoins: -1 } }
            ]),
            
            // Activity streak (days with transactions)
            CoinTransaction.aggregate([
                { $match: { userId: req.user._id } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 30 } // Last 30 days
            ])
        ]);

        const conversionRate = parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001;

        res.json({
            success: true,
            data: {
                user: {
                    coins: user.coins,
                    moneyEquivalent: user.coins * conversionRate,
                    totalCoinsEarned: user.totalCoinsEarned,
                    totalEngagementTime: user.totalEngagementTime
                },
                gaming: {
                    totalSessions: stats[0],
                    averageSessionDuration: Math.round(stats[1][0]?.avgDuration || 0),
                    bestPerformance: stats[2][0] || {}
                },
                earnings: {
                    bySource: stats[3],
                    totalSources: stats[3].length
                },
                activity: {
                    activeDaysLast30: stats[4].length,
                    activeDays: stats[4].map(day => day._id)
                },
                conversionRate
            }
        });

    } catch (error) {
        logger.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user statistics'
        });
    }
});

// Admin: Get all users
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search, 
            country, 
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (country) filter.country = country;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const users = await User.find(filter)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalUsers = await User.countDocuments(filter);

        // Get summary statistics
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                    totalCoins: { $sum: '$coins' },
                    totalCoinsEarned: { $sum: '$totalCoinsEarned' },
                    avgEngagementTime: { $avg: '$totalEngagementTime' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                users,
                stats: stats[0] || {},
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers,
                    hasNextPage: skip + users.length < totalUsers,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Admin get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
});

// Admin: Get user details
router.get('/admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get recent transactions
        const recentTransactions = await CoinTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        // Get recent game sessions
        const recentSessions = await GameSession.find({ userId })
            .sort({ startTime: -1 })
            .limit(10);

        // Get user statistics
        const userStats = await Promise.all([
            CoinTransaction.countDocuments({ userId }),
            GameSession.countDocuments({ userId }),
            CoinTransaction.aggregate([
                { $match: { userId: user._id, type: 'earned' } },
                {
                    $group: {
                        _id: '$source',
                        totalCoins: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                user,
                statistics: {
                    totalTransactions: userStats[0],
                    totalSessions: userStats[1],
                    earningsBySource: userStats[2]
                },
                recentTransactions,
                recentSessions
            }
        });

    } catch (error) {
        logger.error('Admin get user details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user details'
        });
    }
});

// Admin: Update user
router.put('/admin/:userId', authenticateToken, requireAdmin, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }),
    body('isActive')
        .optional()
        .isBoolean(),
    body('coins')
        .optional()
        .isInt({ min: 0 }),
    body('adminNotes')
        .optional()
        .isLength({ max: 1000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { coins, adminNotes, ...updateData } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Handle coin adjustment
        if (coins !== undefined && coins !== user.coins) {
            const coinDifference = coins - user.coins;
            
            if (coinDifference !== 0) {
                // Create admin adjustment transaction
                await CoinTransaction.create({
                    userId: user._id,
                    amount: coinDifference,
                    type: coinDifference > 0 ? 'bonus' : 'penalty',
                    source: 'admin_adjustment',
                    description: adminNotes || `Admin adjustment by ${req.user.email}`,
                    balanceAfter: coins
                });

                user.coins = coins;
                if (coinDifference > 0) {
                    user.totalCoinsEarned += coinDifference;
                }
            }
        }

        // Update other fields
        Object.assign(user, updateData);
        await user.save();

        logger.info(`User ${userId} updated by admin ${req.user.email}`);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                user: user.toObject()
            }
        });

    } catch (error) {
        logger.error('Admin update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating user'
        });
    }
});

module.exports = router;
