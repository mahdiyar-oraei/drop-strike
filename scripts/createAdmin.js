const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drop_strike');
        console.log('Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@dropstrike.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists:', adminEmail);
            return;
        }

        // Create admin user
        const adminUser = new User({
            name: 'System Administrator',
            email: adminEmail,
            password: adminPassword,
            country: 'US',
            ipAddress: '127.0.0.1',
            role: 'admin',
            isActive: true,
            coins: 0,
            paypalEmail: adminEmail
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('\n⚠️  Please change the admin password after first login!');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run if called directly
if (require.main === module) {
    createAdmin();
}

module.exports = createAdmin;
