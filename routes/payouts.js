const express = require('express');
const { body, validationResult } = require('express-validator');
const Payout = require('../models/Payout');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
    createPayout, 
    calculatePayPalFee, 
    validatePayPalEmail,
    getMinimumPayoutAmount,
    getMaximumPayoutAmount 
} = require('../utils/paypal');
const { getClientIP } = require('../utils/geoip');
const logger = require('../utils/logger');

const router = express.Router();

// Request a payout
router.post('/request', authenticateToken, [
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be at least $0.01'),
    body('paypalEmail')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid PayPal email is required')
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

        const { amount, paypalEmail } = req.body;
        const user = await User.findById(req.user._id);

        // Validate amount limits
        const minAmount = getMinimumPayoutAmount();
        const maxAmount = getMaximumPayoutAmount();

        if (amount < minAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum payout amount is $${minAmount}`
            });
        }

        if (amount > maxAmount) {
            return res.status(400).json({
                success: false,
                message: `Maximum payout amount is $${maxAmount}`
            });
        }

        // Validate PayPal email
        if (!validatePayPalEmail(paypalEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid PayPal email format'
            });
        }

        // Calculate required coins
        const conversionRate = parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001;
        const requiredCoins = Math.ceil(amount / conversionRate);

        // Check if user has enough coins
        if (user.coins < requiredCoins) {
            return res.status(400).json({
                success: false,
                message: `Insufficient coins. You need ${requiredCoins} coins for $${amount} payout`,
                data: {
                    requiredCoins,
                    currentCoins: user.coins,
                    shortfall: requiredCoins - user.coins
                }
            });
        }

        // Check for pending payouts
        const pendingPayout = await Payout.findOne({
            userId: req.user._id,
            status: { $in: ['pending', 'processing'] }
        });

        if (pendingPayout) {
            return res.status(400).json({
                success: false,
                message: 'You have a pending payout request. Please wait for it to be processed.'
            });
        }

        // Calculate fees
        const paypalFee = calculatePayPalFee(amount);
        const platformFee = amount * 0.05; // 5% platform fee
        const netAmount = amount - paypalFee - platformFee;

        if (netAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Payout amount too small after fees'
            });
        }

        // Create payout request
        const payout = new Payout({
            userId: req.user._id,
            amount,
            coinsDeducted: requiredCoins,
            paypalEmail,
            conversionRate,
            fees: {
                paypalFee,
                platformFee
            },
            netAmount,
            metadata: {
                ipAddress: getClientIP(req),
                userAgent: req.headers['user-agent'],
                deviceInfo: req.body.deviceInfo || {}
            }
        });

        // Deduct coins from user account
        await user.deductCoins(requiredCoins, 'payout');

        await payout.save();

        logger.info(`Payout requested: $${amount} by user ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Payout request submitted successfully',
            data: {
                payoutId: payout._id,
                amount: payout.amount,
                netAmount: payout.netAmount,
                fees: payout.fees,
                coinsDeducted: payout.coinsDeducted,
                estimatedProcessingTime: '2-3 business days'
            }
        });

    } catch (error) {
        logger.error('Payout request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing payout request'
        });
    }
});

// Get user's payout history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        const filter = { userId: req.user._id };
        if (status) {
            filter.status = status;
        }

        const payouts = await Payout.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-metadata -adminNotes');

        const totalPayouts = await Payout.countDocuments(filter);

        // Calculate summary statistics
        const summary = await Payout.aggregate([
            { $match: { userId: req.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                payouts,
                summary,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalPayouts / limit),
                    totalPayouts,
                    hasNextPage: skip + payouts.length < totalPayouts,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Get payout history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payout history'
        });
    }
});

// Get payout details
router.get('/:payoutId', authenticateToken, async (req, res) => {
    try {
        const { payoutId } = req.params;

        const payout = await Payout.findOne({
            _id: payoutId,
            userId: req.user._id
        }).select('-metadata -adminNotes');

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: 'Payout not found'
            });
        }

        res.json({
            success: true,
            data: {
                payout
            }
        });

    } catch (error) {
        logger.error('Get payout details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payout details'
        });
    }
});

// Cancel pending payout
router.post('/:payoutId/cancel', authenticateToken, async (req, res) => {
    try {
        const { payoutId } = req.params;

        const payout = await Payout.findOne({
            _id: payoutId,
            userId: req.user._id,
            status: 'pending'
        });

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: 'Pending payout not found'
            });
        }

        // Return coins to user
        const user = await User.findById(req.user._id);
        await user.addCoins(payout.coinsDeducted, 'payout_cancelled');

        // Update payout status
        payout.status = 'cancelled';
        await payout.save();

        logger.info(`Payout cancelled: ${payoutId} by user ${user.email}`);

        res.json({
            success: true,
            message: 'Payout cancelled successfully',
            data: {
                coinsReturned: payout.coinsDeducted
            }
        });

    } catch (error) {
        logger.error('Cancel payout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling payout'
        });
    }
});

// Get payout configuration and limits
router.get('/config/info', authenticateToken, async (req, res) => {
    try {
        const conversionRate = parseFloat(process.env.BASE_COIN_TO_USD_RATE) || 0.001;
        const minAmount = getMinimumPayoutAmount();
        const maxAmount = getMaximumPayoutAmount();
        const user = await User.findById(req.user._id);

        // Calculate maximum payout based on user's coins
        const maxPayoutFromCoins = user.coins * conversionRate;

        res.json({
            success: true,
            data: {
                conversionRate,
                minPayoutAmount: minAmount,
                maxPayoutAmount: Math.min(maxAmount, maxPayoutFromCoins),
                userCoins: user.coins,
                estimatedValue: maxPayoutFromCoins,
                fees: {
                    platformFeeRate: 0.05, // 5%
                    paypalFeeInfo: 'PayPal fees vary by region (typically $0.25 - 2% of amount)'
                },
                processingTime: '2-3 business days'
            }
        });

    } catch (error) {
        logger.error('Get payout config error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payout configuration'
        });
    }
});

// Admin: Get all payouts
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            status, 
            startDate, 
            endDate,
            minAmount,
            maxAmount 
        } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
        if (minAmount) filter.amount = { $gte: parseFloat(minAmount) };
        if (maxAmount) filter.amount = { ...filter.amount, $lte: parseFloat(maxAmount) };

        const payouts = await Payout.find(filter)
            .populate('userId', 'name email country')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalPayouts = await Payout.countDocuments(filter);

        // Get summary statistics
        const stats = await Payout.getPayoutStats();

        res.json({
            success: true,
            data: {
                payouts,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalPayouts / limit),
                    totalPayouts,
                    hasNextPage: skip + payouts.length < totalPayouts,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        logger.error('Admin get payouts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching payouts'
        });
    }
});

// Admin: Process payout
router.post('/admin/:payoutId/process', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { adminNotes } = req.body;

        const payout = await Payout.findOne({
            _id: payoutId,
            status: 'pending'
        }).populate('userId', 'name email');

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: 'Pending payout not found'
            });
        }

        // Mark as processing
        await payout.markAsProcessing();
        if (adminNotes) {
            payout.adminNotes = adminNotes;
            await payout.save();
        }

        try {
            // Create PayPal payout
            const paypalResult = await createPayout(
                payout.paypalEmail,
                payout.netAmount,
                `Drop Strike Payout - ${payout._id}`
            );

            // Mark as completed
            await payout.markAsCompleted(
                paypalResult.batch_header.payout_batch_id,
                paypalResult.batch_header.payout_batch_id,
                paypalResult.items[0].payout_item_id
            );

            logger.info(`Payout processed: ${payoutId} by admin ${req.user.email}`);

            res.json({
                success: true,
                message: 'Payout processed successfully',
                data: {
                    payoutId: payout._id,
                    paypalBatchId: paypalResult.batch_header.payout_batch_id,
                    status: 'completed'
                }
            });

        } catch (paypalError) {
            // Mark as failed
            await payout.markAsFailed(paypalError.message);

            logger.error(`PayPal payout failed for ${payoutId}:`, paypalError);

            res.status(400).json({
                success: false,
                message: 'PayPal payout failed',
                error: paypalError.message
            });
        }

    } catch (error) {
        logger.error('Process payout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing payout'
        });
    }
});

// Admin: Reject payout
router.post('/admin/:payoutId/reject', authenticateToken, requireAdmin, [
    body('reason')
        .notEmpty()
        .withMessage('Rejection reason is required')
], async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { reason } = req.body;

        const payout = await Payout.findOne({
            _id: payoutId,
            status: { $in: ['pending', 'processing'] }
        });

        if (!payout) {
            return res.status(404).json({
                success: false,
                message: 'Payout not found or already processed'
            });
        }

        // Return coins to user
        const user = await User.findById(payout.userId);
        await user.addCoins(payout.coinsDeducted, 'payout_rejected');

        // Mark as failed
        await payout.markAsFailed(reason);
        payout.adminNotes = `Rejected by admin ${req.user.email}: ${reason}`;
        await payout.save();

        logger.info(`Payout rejected: ${payoutId} by admin ${req.user.email}`);

        res.json({
            success: true,
            message: 'Payout rejected successfully',
            data: {
                coinsReturned: payout.coinsDeducted,
                reason
            }
        });

    } catch (error) {
        logger.error('Reject payout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting payout'
        });
    }
});

module.exports = router;
