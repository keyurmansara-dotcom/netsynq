import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const seedNetwork = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Find the user named 'keyur'
        const keyur = await User.findOne({ name: { $regex: /keyur/i } });
        if (!keyur) {
            console.log('User keyur not found!');
            process.exit(1);
        }

        console.log(`Found user: ${keyur.name} (${keyur.email})`);

        // Create some dummy users
        const dummyUsers = [];
        for (let i = 1; i <= 5; i++) {
            const email = `dummy${i}@test.com`;
            let dummy = await User.findOne({ email });
            if (!dummy) {
                dummy = new User({
                    name: `Dummy User ${i}`,
                    email: email,
                    password: 'password123',
                    role: 'seeker',
                    profile: {
                        headline: `Software Engineer ${i}`,
                        location: 'San Francisco, CA'
                    }
                });
                await dummy.save();
                console.log(`Created dummy user: ${dummy.name}`);
            }
            dummyUsers.push(dummy);
        }

        // Add connections to keyur
        for (const dummy of dummyUsers) {
            if (!keyur.connections.includes(dummy._id)) {
                keyur.connections.push(dummy._id);
            }
            if (!dummy.connections.includes(keyur._id)) {
                dummy.connections.push(keyur._id);
                await dummy.save();
            }
        }
        
        // Add Followers and Following
        for (let i = 0; i < dummyUsers.length; i++) {
            const dummy = dummyUsers[i];
            
            // Dummy 1, 2, 3 follow keyur
            if (i < 3) {
                if (!keyur.followers.includes(dummy._id)) keyur.followers.push(dummy._id);
            }
            
            // Keyur follows Dummy 3, 4, 5
            if (i >= 2) {
                if (!keyur.following.includes(dummy._id)) keyur.following.push(dummy._id);
            }
        }
        
        await keyur.save();

        console.log('Successfully seeded connections, followers and following for', keyur.name);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding network:', err);
        process.exit(1);
    }
};

seedNetwork();