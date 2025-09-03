const paypal = require('paypal-rest-sdk');
const logger = require('./logger');

// Configure PayPal
paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

/**
 * Create a payout to a single recipient
 * @param {string} recipientEmail - PayPal email of recipient
 * @param {number} amount - Amount in USD
 * @param {string} note - Note for the payout
 * @returns {Promise} PayPal payout response
 */
const createPayout = async (recipientEmail, amount, note = 'Drop Strike Game Payout') => {
    return new Promise((resolve, reject) => {
        const payoutData = {
            sender_batch_header: {
                sender_batch_id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email_subject: 'You have a payout!',
                email_message: 'You have received a payout from Drop Strike! Thanks for playing!'
            },
            items: [
                {
                    recipient_type: 'EMAIL',
                    amount: {
                        value: amount.toFixed(2),
                        currency: 'USD'
                    },
                    receiver: recipientEmail,
                    note: note,
                    sender_item_id: `item_${Date.now()}`
                }
            ]
        };

        paypal.payout.create(payoutData, (error, payout) => {
            if (error) {
                logger.error('PayPal payout error:', error);
                reject(error);
            } else {
                logger.info('PayPal payout created:', payout.batch_header.payout_batch_id);
                resolve(payout);
            }
        });
    });
};

/**
 * Create batch payout to multiple recipients
 * @param {Array} recipients - Array of {email, amount, note} objects
 * @returns {Promise} PayPal batch payout response
 */
const createBatchPayout = async (recipients) => {
    return new Promise((resolve, reject) => {
        const items = recipients.map((recipient, index) => ({
            recipient_type: 'EMAIL',
            amount: {
                value: recipient.amount.toFixed(2),
                currency: 'USD'
            },
            receiver: recipient.email,
            note: recipient.note || 'Drop Strike Game Payout',
            sender_item_id: `batch_item_${Date.now()}_${index}`
        }));

        const payoutData = {
            sender_batch_header: {
                sender_batch_id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email_subject: 'You have a payout!',
                email_message: 'You have received a payout from Drop Strike! Thanks for playing!'
            },
            items: items
        };

        paypal.payout.create(payoutData, (error, payout) => {
            if (error) {
                logger.error('PayPal batch payout error:', error);
                reject(error);
            } else {
                logger.info('PayPal batch payout created:', payout.batch_header.payout_batch_id);
                resolve(payout);
            }
        });
    });
};

/**
 * Get payout details by batch ID
 * @param {string} batchId - PayPal batch ID
 * @returns {Promise} PayPal payout details
 */
const getPayoutDetails = async (batchId) => {
    return new Promise((resolve, reject) => {
        paypal.payout.get(batchId, (error, payout) => {
            if (error) {
                logger.error('PayPal get payout error:', error);
                reject(error);
            } else {
                resolve(payout);
            }
        });
    });
};

/**
 * Get payout item details
 * @param {string} payoutItemId - PayPal payout item ID
 * @returns {Promise} PayPal payout item details
 */
const getPayoutItemDetails = async (payoutItemId) => {
    return new Promise((resolve, reject) => {
        paypal.payoutItem.get(payoutItemId, (error, payoutItem) => {
            if (error) {
                logger.error('PayPal get payout item error:', error);
                reject(error);
            } else {
                resolve(payoutItem);
            }
        });
    });
};

/**
 * Calculate PayPal fees for a payout amount
 * @param {number} amount - Payout amount in USD
 * @returns {number} Estimated PayPal fee
 */
const calculatePayPalFee = (amount) => {
    // PayPal Payouts fees (as of 2024):
    // - Domestic (US): $0.25 per transaction
    // - International: 2% of the transaction amount (up to $20.00 USD maximum)
    // For simplicity, we'll use a flat rate calculation
    
    if (amount <= 0) return 0;
    
    // Assume international rate for safety
    const feeRate = 0.02; // 2%
    const maxFee = 20.00;
    const minFee = 0.25;
    
    let fee = amount * feeRate;
    fee = Math.min(fee, maxFee);
    fee = Math.max(fee, minFee);
    
    return parseFloat(fee.toFixed(2));
};

/**
 * Validate PayPal email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid PayPal email format
 */
const validatePayPalEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Get minimum payout amount
 * @returns {number} Minimum payout amount in USD
 */
const getMinimumPayoutAmount = () => {
    return parseFloat(process.env.MIN_PAYOUT_AMOUNT) || 1.00;
};

/**
 * Get maximum payout amount
 * @returns {number} Maximum payout amount in USD
 */
const getMaximumPayoutAmount = () => {
    return parseFloat(process.env.MAX_PAYOUT_AMOUNT) || 10000.00;
};

module.exports = {
    createPayout,
    createBatchPayout,
    getPayoutDetails,
    getPayoutItemDetails,
    calculatePayPalFee,
    validatePayPalEmail,
    getMinimumPayoutAmount,
    getMaximumPayoutAmount
};
