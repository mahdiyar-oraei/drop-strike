const express = require('express');
const { body, validationResult } = require('express-validator');
const GameSession = require('../models/GameSession');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const AdReward = require('../models/AdReward');
const { authenticateToken } = require('../middleware/auth');
const { getClientIP, getCountryFromIP } = require('../utils/geoip');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Start a new game session
router.post('/session/start', authenticateToken, [
    body('deviceInfo.deviceId')
        .optional()
        .isString(),
    body('deviceInfo.platform')
        .optional()
        .isIn(['iOS', 'Android', 'WebGL']),
    body('deviceInfo.version')
        .optional()
        .isString(),
    body('deviceInfo.screenResolution')
        .optional()
        .isString()
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

        const { deviceInfo } = req.body;
        const sessionId = uuidv4();
        const ipAddress = getClientIP(req);
        const country = getCountryFromIP(ipAddress);

        // Check if user has any active sessions and end them
        await GameSession.updateMany(
            { 
                userId: req.user._id, 
                isCompleted: false 
            },
            { 
                endTime: new Date(),
                isCompleted: true
            }
        );

        // Create new game session
        const gameSession = new GameSession({
            userId: req.user._id,
            sessionId,
            deviceInfo: deviceInfo || {},
            ipAddress,
            country
        });

        await gameSession.save();

        // Update user's last active time
        await User.findByIdAndUpdate(req.user._id, {
            lastActiveAt: new Date()
        });

        logger.info(`Game session started: ${sessionId} for user ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: 'Game session started',
            data: {
                sessionId: gameSession.sessionId,
                startTime: gameSession.startTime
            }
        });

    } catch (error) {
        logger.error('Start game session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error starting game session'
        });
    }
});

// Update game session with stats
router.put('/session/:sessionId', authenticateToken, [
    body('gameStats.ballsDropped')
        .optional()
        .isInt({ min: 0 }),
    body('gameStats.successfulHits')
        .optional()
        .isInt({ min: 0 }),
    body('gameStats.highestScore')
        .optional()
        .isInt({ min: 0 }),
    body('gameStats.levelsCompleted')
        .optional()
        .isInt({ min: 0 }),
    body('coinsEarned')
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

        const { sessionId } = req.params;
        const { gameStats, coinsEarned } = req.body;

        const gameSession = await GameSession.findOne({
            sessionId,
            userId: req.user._id,
            isCompleted: false
        });

        if (!gameSession) {
            return res.status(404).json({
                success: false,
                message: 'Game session not found or already completed'
            });
        }

        // Update game stats
        if (gameStats) {
            gameSession.gameStats = { ...gameSession.gameStats, ...gameStats };
        }

        // Update coins earned in this session
        if (coinsEarned !== undefined) {
            const coinsToAdd = coinsEarned - gameSession.coinsEarned;
            if (coinsToAdd > 0) {
                gameSession.coinsEarned = coinsEarned;
                
                // Add coins to user account
                const user = await User.findById(req.user._id);
                await user.addCoins(coinsToAdd, 'game_completion');
            }
        }

        await gameSession.save();

        res.json({
            success: true,
            message: 'Game session updated',
            data: {
                sessionId: gameSession.sessionId,
                gameStats: gameSession.gameStats,
                coinsEarned: gameSession.coinsEarned
            }
        });

    } catch (error) {
        logger.error('Update game session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating game session'
        });
    }
});

// End game session
router.post('/session/:sessionId/end', authenticateToken, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const gameSession = await GameSession.findOne({
            sessionId,
            userId: req.user._id,
            isCompleted: false
        });

        if (!gameSession) {
            return res.status(404).json({
                success: false,
                message: 'Game session not found or already completed'
            });
        }

        // End the session
        await gameSession.endSession();

        // Update user's total engagement time
        const user = await User.findById(req.user._id);
        user.totalEngagementTime += gameSession.duration;
        user.lastActiveAt = new Date();
        await user.save();

        logger.info(`Game session ended: ${sessionId}, duration: ${gameSession.duration}s`);

        res.json({
            success: true,
            message: 'Game session ended',
            data: {
                sessionId: gameSession.sessionId,
                duration: gameSession.duration,
                coinsEarned: gameSession.coinsEarned,
                gameStats: gameSession.gameStats
            }
        });

    } catch (error) {
        logger.error('End game session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error ending game session'
        });
    }
});

// Record ad watch and reward coins
router.post('/session/:sessionId/ad-reward', authenticateToken, [
    body('adType')
        .isIn(['rewarded_video', 'interstitial', 'banner'])
        .withMessage('Invalid ad type'),
    body('adUnitId')
        .notEmpty()
        .withMessage('Ad unit ID is required'),
    body('completed')
        .isBoolean()
        .withMessage('Completed status is required')
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

        const { sessionId } = req.params;
        const { adType, adUnitId, completed } = req.body;

        const gameSession = await GameSession.findOne({
            sessionId,
            userId: req.user._id,
            isCompleted: false
        });

        if (!gameSession) {
            return res.status(404).json({
                success: false,
                message: 'Game session not found or already completed'
            });
        }

        let coinsRewarded = 0;

        if (completed) {
            // Get reward configuration for this ad type
            const adReward = await AdReward.getRewardForAd(adType, adUnitId);
            
            if (adReward) {
                coinsRewarded = adReward.coinReward;
                
                // Add coins to user account
                const user = await User.findById(req.user._id);
                await user.addCoins(coinsRewarded, adType);
                
                // Update ad analytics
                await adReward.incrementAnalytics(coinsRewarded);
                
                // Update game session coins
                gameSession.coinsEarned += coinsRewarded;
            }
        }

        // Record the ad watch
        gameSession.adsWatched.push({
            adType,
            adUnitId,
            coinsRewarded,
            completed
        });

        await gameSession.save();

        logger.info(`Ad reward processed: ${adType} - ${coinsRewarded} coins for user ${req.user.email}`);

        res.json({
            success: true,
            message: 'Ad reward processed',
            data: {
                coinsRewarded,
                totalSessionCoins: gameSession.coinsEarned
            }
        });

    } catch (error) {
        logger.error('Ad reward error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing ad reward'
        });
    }
});

// Get user's game statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { timeframe = 'all' } = req.query;

        // Get engagement stats
        const engagementStats = await GameSession.getUserEngagementStats(req.user._id, timeframe);

        // Get current user data
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: {
                user: {
                    coins: user.coins,
                    moneyEquivalent: user.moneyEquivalent,
                    totalCoinsEarned: user.totalCoinsEarned,
                    totalEngagementTime: user.totalEngagementTime
                },
                engagement: engagementStats,
                timeframe
            }
        });

    } catch (error) {
        logger.error('Get game stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching game statistics'
        });
    }
});

// Get user's recent game sessions
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const sessions = await GameSession.find({ userId: req.user._id })
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('sessionId startTime endTime duration coinsEarned gameStats adsWatched isCompleted');

        const totalSessions = await GameSession.countDocuments({ userId: req.user._id });

        res.json({
            success: true,
            data: {
                sessions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalSessions / limit),
                    totalSessions,
                    hasNextPage: skip + sessions.length < totalSessions,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Get game sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching game sessions'
        });
    }
});

module.exports = router;
