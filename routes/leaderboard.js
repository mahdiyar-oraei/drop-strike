const express = require('express');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get leaderboard for different timeframes
router.get('/:timeframe', optionalAuth, async (req, res) => {
    try {
        const { timeframe } = req.params;
        const { page = 1, limit = 50, country } = req.query;
        const skip = (page - 1) * limit;

        if (!['daily', 'weekly', 'monthly', 'all-time'].includes(timeframe)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid timeframe. Use: daily, weekly, monthly, or all-time'
            });
        }

        // Calculate date range based on timeframe
        let dateFilter = {};
        const now = new Date();
        
        switch (timeframe) {
            case 'daily':
                dateFilter.createdAt = {
                    $gte: new Date(now.setHours(0, 0, 0, 0))
                };
                break;
            case 'weekly':
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                weekStart.setHours(0, 0, 0, 0);
                dateFilter.createdAt = {
                    $gte: weekStart
                };
                break;
            case 'monthly':
                dateFilter.createdAt = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1)
                };
                break;
            case 'all-time':
                // No date filter for all-time
                break;
        }

        let leaderboard;
        let totalCount;

        if (timeframe === 'all-time') {
            // For all-time, use totalCoinsEarned from User model
            const matchCondition = { isActive: true };
            if (country) {
                matchCondition.country = country.toUpperCase();
            }

            leaderboard = await User.aggregate([
                { $match: matchCondition },
                {
                    $project: {
                        name: 1,
                        country: 1,
                        totalCoinsEarned: 1,
                        registrationDate: 1,
                        _id: 0,
                        userId: '$_id'
                    }
                },
                { $sort: { totalCoinsEarned: -1 } },
                { $skip: skip },
                { $limit: parseInt(limit) },
                {
                    $addFields: {
                        rank: { $add: [skip, { $indexOfArray: [{ $range: [0, parseInt(limit)] }, '$$ROOT'] }] }
                    }
                }
            ]);

            totalCount = await User.countDocuments(matchCondition);

        } else {
            // For time-based leaderboards, aggregate from CoinTransaction
            const matchCondition = {
                type: 'earned',
                ...dateFilter
            };

            const pipeline = [
                { $match: matchCondition },
                {
                    $group: {
                        _id: '$userId',
                        totalCoins: { $sum: '$amount' },
                        transactionCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                { $match: { 'user.isActive': true } }
            ];

            // Add country filter if specified
            if (country) {
                pipeline.push({ $match: { 'user.country': country.toUpperCase() } });
            }

            pipeline.push(
                {
                    $project: {
                        userId: '$_id',
                        name: '$user.name',
                        country: '$user.country',
                        totalCoinsEarned: '$totalCoins',
                        transactionCount: 1,
                        registrationDate: '$user.registrationDate',
                        _id: 0
                    }
                },
                { $sort: { totalCoinsEarned: -1 } }
            );

            // Get total count
            const countPipeline = [...pipeline];
            countPipeline.push({ $count: 'total' });
            const countResult = await CoinTransaction.aggregate(countPipeline);
            totalCount = countResult[0]?.total || 0;

            // Add pagination
            pipeline.push(
                { $skip: skip },
                { $limit: parseInt(limit) }
            );

            leaderboard = await CoinTransaction.aggregate(pipeline);
        }

        // Add rank to results
        leaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: skip + index + 1
        }));

        // Get current user's position if authenticated
        let currentUserRank = null;
        if (req.user) {
            if (timeframe === 'all-time') {
                const userRankResult = await User.aggregate([
                    { $match: { isActive: true, ...(country && { country: country.toUpperCase() }) } },
                    { $sort: { totalCoinsEarned: -1 } },
                    { $group: { _id: null, users: { $push: { userId: '$_id', totalCoinsEarned: '$totalCoinsEarned' } } } },
                    { $unwind: { path: '$users', includeArrayIndex: 'rank' } },
                    { $match: { 'users.userId': req.user._id } },
                    { $project: { rank: { $add: ['$rank', 1] }, totalCoinsEarned: '$users.totalCoinsEarned' } }
                ]);
                
                if (userRankResult.length > 0) {
                    currentUserRank = {
                        rank: userRankResult[0].rank,
                        totalCoinsEarned: userRankResult[0].totalCoinsEarned
                    };
                }
            } else {
                // For time-based leaderboards, calculate user's rank from transactions
                const userCoins = await CoinTransaction.aggregate([
                    {
                        $match: {
                            userId: req.user._id,
                            type: 'earned',
                            ...dateFilter
                        }
                    },
                    {
                        $group: {
                            _id: '$userId',
                            totalCoins: { $sum: '$amount' }
                        }
                    }
                ]);

                if (userCoins.length > 0) {
                    const userTotalCoins = userCoins[0].totalCoins;
                    
                    // Count users with more coins
                    const betterUsersCount = await CoinTransaction.aggregate([
                        { $match: { type: 'earned', ...dateFilter } },
                        {
                            $group: {
                                _id: '$userId',
                                totalCoins: { $sum: '$amount' }
                            }
                        },
                        { $match: { totalCoins: { $gt: userTotalCoins } } },
                        { $count: 'count' }
                    ]);

                    currentUserRank = {
                        rank: (betterUsersCount[0]?.count || 0) + 1,
                        totalCoinsEarned: userTotalCoins
                    };
                }
            }
        }

        res.json({
            success: true,
            data: {
                leaderboard,
                currentUser: currentUserRank,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / limit),
                    totalUsers: totalCount,
                    hasNextPage: skip + leaderboard.length < totalCount,
                    hasPrevPage: page > 1
                },
                timeframe,
                country: country || 'global'
            }
        });

    } catch (error) {
        logger.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching leaderboard'
        });
    }
});

// Get available countries for filtering
router.get('/meta/countries', async (req, res) => {
    try {
        const countries = await User.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$country',
                    userCount: { $sum: 1 }
                }
            },
            { $sort: { userCount: -1 } },
            {
                $project: {
                    _id: 0,
                    country: '$_id',
                    userCount: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                countries
            }
        });

    } catch (error) {
        logger.error('Get countries error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching countries'
        });
    }
});

// Get leaderboard statistics
router.get('/meta/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            // Total active users
            User.countDocuments({ isActive: true }),
            
            // Total coins distributed
            CoinTransaction.aggregate([
                { $match: { type: 'earned' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            
            // Daily active users (users with transactions today)
            CoinTransaction.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                },
                {
                    $group: {
                        _id: '$userId'
                    }
                },
                { $count: 'dailyActiveUsers' }
            ]),
            
            // Top countries by user count
            User.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$country',
                        userCount: { $sum: 1 }
                    }
                },
                { $sort: { userCount: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        _id: 0,
                        country: '$_id',
                        userCount: 1
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalActiveUsers: stats[0],
                totalCoinsDistributed: stats[1][0]?.total || 0,
                dailyActiveUsers: stats[2][0]?.dailyActiveUsers || 0,
                topCountries: stats[3]
            }
        });

    } catch (error) {
        logger.error('Get leaderboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching leaderboard statistics'
        });
    }
});

module.exports = router;
