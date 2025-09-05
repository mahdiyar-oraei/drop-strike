const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const GameSession = require('../models/GameSession');
const Payout = require('../models/Payout');
const AdReward = require('../models/AdReward');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get admin dashboard overview
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get comprehensive statistics
        const [
            totalUsers,
            activeUsers,
            newUsersToday,
            newUsersYesterday,
            totalCoinsDistributed,
            coinsDistributedToday,
            coinsDistributedThisMonth,
            totalPayouts,
            pendingPayouts,
            completedPayouts,
            totalPayoutAmount,
            activeSessions,
            totalSessions,
            topCountries,
            recentTransactions,
            systemStats
        ] = await Promise.all([
            // User statistics
            User.countDocuments({}),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }),

            // Coin statistics
            CoinTransaction.aggregate([
                { $match: { type: 'earned' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            CoinTransaction.aggregate([
                { $match: { type: 'earned', createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            CoinTransaction.aggregate([
                { $match: { type: 'earned', createdAt: { $gte: thisMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),

            // Payout statistics
            Payout.countDocuments({}),
            Payout.countDocuments({ status: 'pending' }),
            Payout.countDocuments({ status: 'completed' }),
            Payout.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),

            // Game session statistics
            GameSession.countDocuments({ isCompleted: false }),
            GameSession.countDocuments({}),

            // Top countries
            User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$country', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Recent high-value transactions
            CoinTransaction.find({ amount: { $gte: 100 } })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .limit(10),

            // System statistics
            Promise.all([
                AdReward.countDocuments({ isActive: true }),
                CoinTransaction.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: today },
                            source: { $in: ['rewarded_video', 'interstitial_ad', 'banner_ad'] }
                        }
                    },
                    { $group: { _id: '$source', count: { $sum: 1 } } }
                ])
            ])
        ]);

        // Calculate growth rates
        const userGrowthRate = newUsersYesterday > 0 ? 
            ((newUsersToday - newUsersYesterday) / newUsersYesterday * 100).toFixed(1) : 
            newUsersToday > 0 ? 100 : 0;

        // Format response
        const dashboard = {
            users: {
                total: totalUsers,
                active: activeUsers,
                newToday: newUsersToday,
                newYesterday: newUsersYesterday,
                growthRate: parseFloat(userGrowthRate)
            },
            coins: {
                totalDistributed: totalCoinsDistributed[0]?.total || 0,
                distributedToday: coinsDistributedToday[0]?.total || 0,
                distributedThisMonth: coinsDistributedThisMonth[0]?.total || 0,
                conversionRate: parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001
            },
            payouts: {
                total: totalPayouts,
                pending: pendingPayouts,
                completed: completedPayouts,
                totalAmount: totalPayoutAmount[0]?.total || 0
            },
            gaming: {
                activeSessions,
                totalSessions
            },
            topCountries: topCountries.map(country => ({
                country: country._id,
                users: country.count
            })),
            recentHighValueTransactions: recentTransactions,
            system: {
                activeAdRewards: systemStats[0],
                todayAdViews: systemStats[1].reduce((total, item) => total + item.count, 0),
                adViewsByType: systemStats[1]
            }
        };

        res.json({
            success: true,
            data: dashboard
        });

    } catch (error) {
        logger.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching admin dashboard'
        });
    }
});

// Get system analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { timeframe = 'monthly', metric = 'users' } = req.query;

        let dateRange;
        let groupBy;
        const now = new Date();

        switch (timeframe) {
            case 'daily':
                dateRange = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            case 'weekly':
                dateRange = { $gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) };
                groupBy = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
                break;
            case 'monthly':
                dateRange = { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) };
                groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                break;
            default:
                dateRange = { $gte: new Date(now.getFullYear() - 1, 0, 1) };
                groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        }

        let analyticsData;

        switch (metric) {
            case 'users':
                analyticsData = await User.aggregate([
                    { $match: { createdAt: dateRange } },
                    {
                        $group: {
                            _id: groupBy,
                            newUsers: { $sum: 1 },
                            countries: { $addToSet: '$country' }
                        }
                    },
                    {
                        $addFields: {
                            uniqueCountries: { $size: '$countries' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
                break;

            case 'coins':
                analyticsData = await CoinTransaction.aggregate([
                    { $match: { createdAt: dateRange, type: 'earned' } },
                    {
                        $group: {
                            _id: {
                                period: groupBy,
                                source: '$source'
                            },
                            totalCoins: { $sum: '$amount' },
                            transactions: { $sum: 1 }
                        }
                    },
                    {
                        $group: {
                            _id: '$_id.period',
                            sources: {
                                $push: {
                                    source: '$_id.source',
                                    totalCoins: '$totalCoins',
                                    transactions: '$transactions'
                                }
                            },
                            totalCoins: { $sum: '$totalCoins' },
                            totalTransactions: { $sum: '$transactions' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
                break;

            case 'sessions':
                analyticsData = await GameSession.aggregate([
                    { $match: { startTime: dateRange } },
                    {
                        $group: {
                            _id: groupBy,
                            totalSessions: { $sum: 1 },
                            totalDuration: { $sum: '$duration' },
                            totalCoinsEarned: { $sum: '$coinsEarned' },
                            avgDuration: { $avg: '$duration' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
                break;

            case 'payouts':
                analyticsData = await Payout.aggregate([
                    { $match: { createdAt: dateRange } },
                    {
                        $group: {
                            _id: {
                                period: groupBy,
                                status: '$status'
                            },
                            count: { $sum: 1 },
                            totalAmount: { $sum: '$amount' }
                        }
                    },
                    {
                        $group: {
                            _id: '$_id.period',
                            statuses: {
                                $push: {
                                    status: '$_id.status',
                                    count: '$count',
                                    totalAmount: '$totalAmount'
                                }
                            },
                            totalPayouts: { $sum: '$count' },
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid metric. Use: users, coins, sessions, or payouts'
                });
        }

        res.json({
            success: true,
            data: {
                analyticsData,
                timeframe,
                metric
            }
        });

    } catch (error) {
        logger.error('Admin analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching analytics'
        });
    }
});

// Get system configuration
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const config = {
            coinSystem: {
                baseConversionRate: parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001,
                minPayoutAmount: parseFloat(process.env.MIN_PAYOUT_AMOUNT) || 1.00,
                maxPayoutAmount: parseFloat(process.env.MAX_PAYOUT_AMOUNT) || 10000.00,
                platformFeeRate: 0.05 // 5%
            },
            paypal: {
                mode: process.env.PAYPAL_MODE || 'sandbox',
                configured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
            },
            rateLimiting: {
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
                maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
            },
            admob: {
                appId: process.env.ADMOB_APP_ID || 'Not configured',
                publisherId: process.env.ADMOB_PUBLISHER_ID || 'Not configured'
            }
        };

        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        logger.error('Get admin config error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching configuration'
        });
    }
});

// Bulk operations for users
router.post('/users/bulk-action', authenticateToken, requireAdmin, [
    body('action')
        .isIn(['activate', 'deactivate', 'adjust-coins'])
        .withMessage('Invalid action'),
    body('userIds')
        .isArray({ min: 1 })
        .withMessage('User IDs array is required'),
    body('coinAdjustment')
        .optional()
        .isInt({ min: -100000, max: 100000 }),
    body('reason')
        .optional()
        .isLength({ max: 500 })
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

        const { action, userIds, coinAdjustment, reason } = req.body;
        const results = [];

        for (const userId of userIds) {
            try {
                const user = await User.findById(userId);
                if (!user) {
                    results.push({ userId, status: 'error', message: 'User not found' });
                    continue;
                }

                switch (action) {
                    case 'activate':
                        user.isActive = true;
                        await user.save();
                        results.push({ userId, status: 'success', message: 'User activated' });
                        break;

                    case 'deactivate':
                        user.isActive = false;
                        await user.save();
                        results.push({ userId, status: 'success', message: 'User deactivated' });
                        break;

                    case 'adjust-coins':
                        if (coinAdjustment === undefined) {
                            results.push({ userId, status: 'error', message: 'Coin adjustment required' });
                            continue;
                        }

                        const newBalance = user.coins + coinAdjustment;
                        if (newBalance < 0) {
                            results.push({ userId, status: 'error', message: 'Insufficient coins' });
                            continue;
                        }

                        // Create transaction record
                        await CoinTransaction.create({
                            userId: user._id,
                            amount: coinAdjustment,
                            type: coinAdjustment > 0 ? 'bonus' : 'penalty',
                            source: 'admin_adjustment',
                            description: reason || `Bulk adjustment by ${req.user.email}`,
                            balanceAfter: newBalance
                        });

                        user.coins = newBalance;
                        if (coinAdjustment > 0) {
                            user.totalCoinsEarned += coinAdjustment;
                        }
                        await user.save();

                        results.push({ 
                            userId, 
                            status: 'success', 
                            message: `Coins adjusted by ${coinAdjustment}`,
                            newBalance
                        });
                        break;
                }
            } catch (error) {
                results.push({ userId, status: 'error', message: error.message });
            }
        }

        logger.info(`Bulk action ${action} performed by admin ${req.user.email} on ${userIds.length} users`);

        res.json({
            success: true,
            message: 'Bulk action completed',
            data: { results }
        });

    } catch (error) {
        logger.error('Bulk user action error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error performing bulk action'
        });
    }
});

// Export data for analysis
router.get('/export/:dataType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { dataType } = req.params;
        const { startDate, endDate, format = 'json' } = req.query;

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        let data;
        let filename;

        switch (dataType) {
            case 'users':
                data = await User.find({
                    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
                }).select('-password').lean();
                filename = `users_export_${Date.now()}`;
                break;

            case 'transactions':
                data = await CoinTransaction.find({
                    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
                }).populate('userId', 'name email').lean();
                filename = `transactions_export_${Date.now()}`;
                break;

            case 'sessions':
                data = await GameSession.find({
                    ...(Object.keys(dateFilter).length && { startTime: dateFilter })
                }).populate('userId', 'name email').lean();
                filename = `sessions_export_${Date.now()}`;
                break;

            case 'payouts':
                data = await Payout.find({
                    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
                }).populate('userId', 'name email').lean();
                filename = `payouts_export_${Date.now()}`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type. Use: users, transactions, sessions, or payouts'
                });
        }

        if (format === 'csv') {
            // For CSV format, you would need to implement CSV conversion
            return res.status(501).json({
                success: false,
                message: 'CSV export not implemented yet'
            });
        }

        res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
        res.setHeader('Content-Type', 'application/json');
        
        res.json({
            success: true,
            exportedAt: new Date().toISOString(),
            dataType,
            recordCount: data.length,
            data
        });

        logger.info(`Data export: ${dataType} by admin ${req.user.email}`);

    } catch (error) {
        logger.error('Data export error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error exporting data'
        });
    }
});

// Get system logs (recent errors and important events)
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { level = 'error', limit = 100 } = req.query;
        
        // This would require implementing a log storage system
        // For now, return a placeholder response
        res.json({
            success: true,
            message: 'Log viewing not implemented yet',
            data: {
                logs: [],
                level,
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        logger.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching logs'
        });
    }
});

// System health check
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: 'connected', // You could add actual DB health check
            services: {
                paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
                admob: !!(process.env.ADMOB_APP_ID),
                email: false // Add email service check if implemented
            }
        };

        res.json({
            success: true,
            data: health
        });

    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking system health'
        });
    }
});

// Bulk user actions
router.post('/users/bulk-action', authenticateToken, requireAdmin, [
    body('action')
        .isIn(['activate', 'deactivate', 'adjust-coins'])
        .withMessage('Invalid action'),
    body('userIds')
        .isArray({ min: 1 })
        .withMessage('User IDs array is required'),
    body('reason')
        .optional()
        .isLength({ max: 500 }),
    body('coinAdjustment')
        .optional()
        .isInt({ min: -100000, max: 100000 })
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

        const { action, userIds, reason, coinAdjustment } = req.body;
        
        let updateResult;
        let transactionPromises = [];

        switch (action) {
            case 'activate':
                updateResult = await User.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { isActive: true } }
                );
                break;

            case 'deactivate':
                updateResult = await User.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { isActive: false } }
                );
                break;

            case 'adjust-coins':
                if (coinAdjustment === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'Coin adjustment amount is required'
                    });
                }

                const users = await User.find({ _id: { $in: userIds } });
                
                for (const user of users) {
                    const newBalance = Math.max(0, user.coins + coinAdjustment);
                    user.coins = newBalance;
                    
                    if (coinAdjustment > 0) {
                        user.totalCoinsEarned += coinAdjustment;
                    }
                    
                    await user.save();

                    // Create transaction record
                    transactionPromises.push(
                        CoinTransaction.create({
                            userId: user._id,
                            amount: coinAdjustment,
                            type: coinAdjustment > 0 ? 'bonus' : 'penalty',
                            source: 'admin_bulk_adjustment',
                            description: reason || `Bulk adjustment by admin ${req.user.email}`,
                            balanceAfter: newBalance
                        })
                    );
                }

                await Promise.all(transactionPromises);
                updateResult = { modifiedCount: users.length };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }

        logger.info(`Bulk action '${action}' performed on ${updateResult.modifiedCount} users by admin ${req.user.email}`);

        res.json({
            success: true,
            message: `Bulk action completed successfully`,
            data: {
                action,
                affectedUsers: updateResult.modifiedCount,
                reason
            }
        });

    } catch (error) {
        logger.error('Bulk user action error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error performing bulk action'
        });
    }
});

// Get system configuration
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Return current system configuration
        const config = {
            // Coin Configuration
            baseCoinToUsdRate: parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001,
            minimumPayoutAmount: parseFloat(process.env.MINIMUM_PAYOUT_AMOUNT) || 1.00,
            maximumPayoutAmount: parseFloat(process.env.MAXIMUM_PAYOUT_AMOUNT) || 10000.00,
            platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE) || 0.05,

            // System Configuration
            maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
            registrationEnabled: process.env.REGISTRATION_ENABLED !== 'false',
            payoutsEnabled: process.env.PAYOUTS_ENABLED !== 'false',
            debugMode: process.env.DEBUG_MODE === 'true',

            // Security Configuration
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
            sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 86400,
        };

        res.json({
            success: true,
            data: config
        });

    } catch (error) {
        logger.error('Get system config error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching system configuration'
        });
    }
});

// Update system configuration
router.put('/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Note: In a production environment, you would typically update environment variables
        // or a configuration database/file. This is a simplified example.
        
        logger.info(`System configuration update attempted by admin ${req.user.email}`, req.body);

        res.json({
            success: true,
            message: 'Configuration update logged. Manual deployment may be required for some changes.',
            data: req.body
        });

    } catch (error) {
        logger.error('Update system config error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating system configuration'
        });
    }
});

// Export data endpoint
router.get('/export/:dataType', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { dataType } = req.params;
        const { startDate, endDate, limit = 1000 } = req.query;

        let data = [];
        const dateFilter = {};
        
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }

        const filter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

        switch (dataType) {
            case 'users':
                data = await User.find(filter)
                    .select('-password')
                    .limit(parseInt(limit))
                    .sort({ createdAt: -1 });
                break;

            case 'payouts':
                data = await Payout.find(filter)
                    .populate('userId', 'name email country')
                    .limit(parseInt(limit))
                    .sort({ createdAt: -1 });
                break;

            case 'transactions':
                data = await CoinTransaction.find(filter)
                    .populate('userId', 'name email')
                    .limit(parseInt(limit))
                    .sort({ createdAt: -1 });
                break;

            case 'sessions':
                data = await GameSession.find(filter)
                    .populate('userId', 'name email')
                    .limit(parseInt(limit))
                    .sort({ startTime: -1 });
                break;

            case 'analytics':
                // Export analytics summary
                const [userCount, payoutCount, transactionCount] = await Promise.all([
                    User.countDocuments(filter),
                    Payout.countDocuments(filter),
                    CoinTransaction.countDocuments(filter)
                ]);

                data = {
                    summary: {
                        users: userCount,
                        payouts: payoutCount,
                        transactions: transactionCount,
                        exportDate: new Date().toISOString(),
                        dateRange: { startDate, endDate }
                    }
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data type for export'
                });
        }

        logger.info(`Data export: ${dataType} by admin ${req.user.email}`);

        res.json({
            success: true,
            data: data,
            metadata: {
                dataType,
                count: Array.isArray(data) ? data.length : 1,
                exportedAt: new Date().toISOString(),
                exportedBy: req.user.email
            }
        });

    } catch (error) {
        logger.error('Export data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error exporting data'
        });
    }
});

module.exports = router;
