const mongoose = require('mongoose');
const AdReward = require('../models/AdReward');
require('dotenv').config();

const seedAdRewards = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drop_strike');
        console.log('Connected to MongoDB');

        // Clear existing ad rewards
        await AdReward.deleteMany({});
        console.log('Cleared existing ad rewards');

        // Seed data for different ad types
        const adRewards = [
            // Rewarded Video Ads
            {
                adType: 'rewarded_video',
                adUnitId: 'ca-app-pub-3940256099942544/5224354917', // Test unit ID
                adUnitName: 'Rewarded Video - High Value',
                coinReward: 50,
                description: 'Watch a full video ad to earn 50 coins',
                minimumWatchTime: 30,
                dailyLimit: 10,
                requirements: {
                    minLevel: 0,
                    cooldownMinutes: 5
                }
            },
            {
                adType: 'rewarded_video',
                adUnitId: 'ca-app-pub-3940256099942544/5224354918',
                adUnitName: 'Rewarded Video - Standard',
                coinReward: 25,
                description: 'Watch a video ad to earn 25 coins',
                minimumWatchTime: 15,
                dailyLimit: 20,
                requirements: {
                    minLevel: 0,
                    cooldownMinutes: 3
                }
            },
            
            // Interstitial Ads
            {
                adType: 'interstitial',
                adUnitId: 'ca-app-pub-3940256099942544/1033173712',
                adUnitName: 'Interstitial - Game Over',
                coinReward: 15,
                description: 'View interstitial ad after game session',
                minimumWatchTime: 5,
                dailyLimit: 15,
                requirements: {
                    minLevel: 0,
                    cooldownMinutes: 2
                }
            },
            {
                adType: 'interstitial',
                adUnitId: 'ca-app-pub-3940256099942544/1033173713',
                adUnitName: 'Interstitial - Level Complete',
                coinReward: 10,
                description: 'View ad after completing a level',
                minimumWatchTime: 3,
                dailyLimit: 25,
                requirements: {
                    minLevel: 1,
                    cooldownMinutes: 1
                }
            },
            
            // Banner Ads
            {
                adType: 'banner',
                adUnitId: 'ca-app-pub-3940256099942544/6300978111',
                adUnitName: 'Banner - Main Menu',
                coinReward: 2,
                description: 'Passive earnings from banner ad display',
                minimumWatchTime: 10,
                dailyLimit: 100,
                requirements: {
                    minLevel: 0,
                    cooldownMinutes: 0
                }
            },
            {
                adType: 'banner',
                adUnitId: 'ca-app-pub-3940256099942544/6300978112',
                adUnitName: 'Banner - Game Play',
                coinReward: 1,
                description: 'Small reward for viewing banner during gameplay',
                minimumWatchTime: 5,
                dailyLimit: 200,
                requirements: {
                    minLevel: 0,
                    cooldownMinutes: 0
                }
            }
        ];

        // Insert ad rewards
        const createdRewards = await AdReward.insertMany(adRewards);
        console.log(`Created ${createdRewards.length} ad reward configurations`);

        // Display created rewards
        console.log('\nCreated Ad Rewards:');
        createdRewards.forEach(reward => {
            console.log(`- ${reward.adUnitName}: ${reward.coinReward} coins (${reward.adType})`);
        });

        console.log('\nAd rewards seeding completed successfully!');

    } catch (error) {
        console.error('Error seeding ad rewards:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run if called directly
if (require.main === module) {
    seedAdRewards();
}

module.exports = seedAdRewards;
