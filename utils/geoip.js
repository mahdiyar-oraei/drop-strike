const geoip = require('geoip-lite');
const logger = require('./logger');

/**
 * Get country code from IP address
 * @param {string} ip - IP address
 * @returns {string} - Country code (2 letters)
 */
const getCountryFromIP = (ip) => {
    try {
        // Handle localhost and private IPs
        if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return 'US'; // Default to US for local development
        }

        const geo = geoip.lookup(ip);
        return geo ? geo.country : 'US'; // Default to US if lookup fails
    } catch (error) {
        logger.error('GeoIP lookup error:', error);
        return 'US'; // Default fallback
    }
};

/**
 * Get full location info from IP address
 * @param {string} ip - IP address
 * @returns {object} - Location object with country, region, city, etc.
 */
const getLocationFromIP = (ip) => {
    try {
        if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return {
                country: 'US',
                region: 'CA',
                city: 'San Francisco',
                timezone: 'America/Los_Angeles'
            };
        }

        const geo = geoip.lookup(ip);
        return geo || {
            country: 'US',
            region: 'CA',
            city: 'Unknown',
            timezone: 'America/Los_Angeles'
        };
    } catch (error) {
        logger.error('GeoIP location lookup error:', error);
        return {
            country: 'US',
            region: 'CA',
            city: 'Unknown',
            timezone: 'America/Los_Angeles'
        };
    }
};

/**
 * Extract IP address from request
 * @param {object} req - Express request object
 * @returns {string} - IP address
 */
const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           '127.0.0.1';
};

module.exports = {
    getCountryFromIP,
    getLocationFromIP,
    getClientIP
};
