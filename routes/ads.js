const express = require('express');
const { body, validationResult } = require('express-validator');
const AdReward = require('../models/AdReward');
const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all available ad rewards (public endpoint for game client)
router.get('/rewards', async (req, res) => {
    try {
        const adRewards = await AdReward.find({ isActive: true })
            .select('adType adUnitId adUnitName coinReward description minimumWatchTime dailyLimit requirements')
            .sort({ coinReward: -1 });

        res.json({
            success: true,
            data: {
                adRewards
            }
        });

    } catch (error) {
        logger.error('Get ad rewards error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ad rewards'
        });
    }
});

// Get ad rewards by type
router.get('/rewards/:adType', async (req, res) => {
    try {
        const { adType } = req.params;

        if (!['rewarded_video', 'interstitial', 'banner'].includes(adType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ad type'
            });
        }

        const adRewards = await AdReward.find({ 
            adType, 
            isActive: true 
        }).select('adUnitId adUnitName coinReward description minimumWatchTime dailyLimit requirements');

        res.json({
            success: true,
            data: {
                adRewards
            }
        });

    } catch (error) {
        logger.error('Get ad rewards by type error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ad rewards'
        });
    }
});

// Check if user can watch an ad (rate limiting)
router.get('/can-watch/:adUnitId', authenticateToken, async (req, res) => {
    try {
        const { adUnitId } = req.params;

        const adReward = await AdReward.findOne({ 
            adUnitId, 
            isActive: true 
        });

        if (!adReward) {
            return res.status(404).json({
                success: false,
                message: 'Ad unit not found'
            });
        }

        let canWatch = true;
        let reason = '';
        let nextAvailableTime = null;

        // Check daily limit
        if (adReward.dailyLimit > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayWatches = await CoinTransaction.countDocuments({
                userId: req.user._id,
                source: adReward.adType,
                'metadata.adUnitId': adUnitId,
                createdAt: { $gte: today }
            });

            if (todayWatches >= adReward.dailyLimit) {
                canWatch = false;
                reason = 'Daily limit reached';
                nextAvailableTime = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Check cooldown
        if (canWatch && adReward.requirements.cooldownMinutes > 0) {
            const cooldownTime = new Date(Date.now() - adReward.requirements.cooldownMinutes * 60 * 1000);
            
            const recentWatch = await CoinTransaction.findOne({
                userId: req.user._id,
                source: adReward.adType,
                'metadata.adUnitId': adUnitId,
                createdAt: { $gte: cooldownTime }
            }).sort({ createdAt: -1 });

            if (recentWatch) {
                canWatch = false;
                reason = 'Cooldown period active';
                nextAvailableTime = new Date(recentWatch.createdAt.getTime() + adReward.requirements.cooldownMinutes * 60 * 1000);
            }
        }

        res.json({
            success: true,
            data: {
                canWatch,
                reason,
                nextAvailableTime,
                adReward: {
                    adUnitId: adReward.adUnitId,
                    adType: adReward.adType,
                    coinReward: adReward.coinReward,
                    minimumWatchTime: adReward.minimumWatchTime
                }
            }
        });

    } catch (error) {
        logger.error('Check ad watch eligibility error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error checking ad watch eligibility'
        });
    }
});

// Get ad analytics and statistics
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        const { timeframe = 'all' } = req.query;

        // Calculate date range
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
        }

        // Get user's ad watching statistics
        const userAdStats = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    source: { $in: ['rewarded_video', 'interstitial_ad', 'banner_ad'] },
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalWatches: { $sum: 1 },
                    totalCoinsEarned: { $sum: '$amount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    adType: '$_id',
                    totalWatches: 1,
                    totalCoinsEarned: 1
                }
            }
        ]);

        // Get breakdown by ad unit
        const adUnitStats = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    source: { $in: ['rewarded_video', 'interstitial_ad', 'banner_ad'] },
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: {
                        adUnitId: '$metadata.adUnitId',
                        source: '$source'
                    },
                    totalWatches: { $sum: 1 },
                    totalCoinsEarned: { $sum: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'adrewards',
                    localField: '_id.adUnitId',
                    foreignField: 'adUnitId',
                    as: 'adReward'
                }
            },
            {
                $unwind: {
                    path: '$adReward',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    adUnitId: '$_id.adUnitId',
                    adType: '$_id.source',
                    adUnitName: '$adReward.adUnitName',
                    totalWatches: 1,
                    totalCoinsEarned: 1,
                    coinRewardPerWatch: '$adReward.coinReward'
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                summary: userAdStats,
                byAdUnit: adUnitStats,
                timeframe
            }
        });

    } catch (error) {
        logger.error('Get ad analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ad analytics'
        });
    }
});

// Admin: Create new ad reward configuration
router.post('/admin/rewards', authenticateToken, requireAdmin, [
    body('adType')
        .isIn(['rewarded_video', 'interstitial', 'banner'])
        .withMessage('Invalid ad type'),
    body('adUnitId')
        .notEmpty()
        .withMessage('Ad unit ID is required'),
    body('adUnitName')
        .notEmpty()
        .isLength({ max: 100 })
        .withMessage('Ad unit name is required and must be less than 100 characters'),
    body('coinReward')
        .isInt({ min: 1, max: 10000 })
        .withMessage('Coin reward must be between 1 and 10000'),
    body('description')
        .optional()
        .isLength({ max: 200 }),
    body('minimumWatchTime')
        .optional()
        .isInt({ min: 0 }),
    body('dailyLimit')
        .optional()
        .isInt({ min: 0 }),
    body('requirements.minLevel')
        .optional()
        .isInt({ min: 0 }),
    body('requirements.cooldownMinutes')
        .optional()
        .isInt({ min: 0 })
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const adReward = new AdReward(req.body);
        await adReward.save();

        logger.info(`New ad reward created: ${adReward.adUnitName} by admin ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: 'Ad reward configuration created',
            data: {
                adReward
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ad unit ID already exists'
            });
        }

        logger.error('Create ad reward error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating ad reward'
        });
    }
});

// Admin: Update ad reward configuration
router.put('/admin/rewards/:id', authenticateToken, requireAdmin, [
    body('adUnitName')
        .optional()
        .isLength({ max: 100 }),
    body('coinReward')
        .optional()
        .isInt({ min: 1, max: 10000 }),
    body('description')
        .optional()
        .isLength({ max: 200 }),
    body('minimumWatchTime')
        .optional()
        .isInt({ min: 0 }),
    body('dailyLimit')
        .optional()
        .isInt({ min: 0 }),
    body('isActive')
        .optional()
        .isBoolean()
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const adReward = await AdReward.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!adReward) {
            return res.status(404).json({
                success: false,
                message: 'Ad reward configuration not found'
            });
        }

        logger.info(`Ad reward updated: ${adReward.adUnitName} by admin ${req.user.email}`);

        res.json({
            success: true,
            message: 'Ad reward configuration updated',
            data: {
                adReward
            }
        });

    } catch (error) {
        logger.error('Update ad reward error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating ad reward'
        });
    }
});

// Admin: Get all ad reward configurations
router.get('/admin/rewards', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, adType, isActive } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (adType) filter.adType = adType;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const adRewards = await AdReward.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalRewards = await AdReward.countDocuments(filter);

        res.json({
            success: true,
            data: {
                adRewards,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRewards / limit),
                    totalRewards,
                    hasNextPage: skip + adRewards.length < totalRewards,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Get admin ad rewards error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ad rewards'
        });
    }
});

// Admin: Get ad analytics overview
router.get('/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { timeframe = 'monthly' } = req.query;

        // Calculate date range
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
        }

        // Get overall ad statistics
        const overallStats = await CoinTransaction.aggregate([
            {
                $match: {
                    source: { $in: ['rewarded_video', 'interstitial_ad', 'banner_ad'] },
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$source',
                    totalViews: { $sum: 1 },
                    totalCoinsDistributed: { $sum: '$amount' },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $addFields: {
                    uniqueUserCount: { $size: '$uniqueUsers' }
                }
            },
            {
                $project: {
                    _id: 0,
                    adType: '$_id',
                    totalViews: 1,
                    totalCoinsDistributed: 1,
                    uniqueUserCount: 1
                }
            }
        ]);

        // Get top performing ad units
        const topAdUnits = await CoinTransaction.aggregate([
            {
                $match: {
                    source: { $in: ['rewarded_video', 'interstitial_ad', 'banner_ad'] },
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$metadata.adUnitId',
                    totalViews: { $sum: 1 },
                    totalCoinsDistributed: { $sum: '$amount' },
                    uniqueUsers: { $addToSet: '$userId' }
                }
            },
            {
                $lookup: {
                    from: 'adrewards',
                    localField: '_id',
                    foreignField: 'adUnitId',
                    as: 'adReward'
                }
            },
            {
                $unwind: {
                    path: '$adReward',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    adUnitId: '$_id',
                    adUnitName: '$adReward.adUnitName',
                    adType: '$adReward.adType',
                    totalViews: 1,
                    totalCoinsDistributed: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    avgCoinsPerView: { $divide: ['$totalCoinsDistributed', '$totalViews'] }
                }
            },
            { $sort: { totalViews: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                overallStats,
                topAdUnits,
                timeframe
            }
        });

    } catch (error) {
        logger.error('Get admin ad analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ad analytics'
        });
    }
});

module.exports = router;
