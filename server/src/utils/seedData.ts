import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Media } from '../models/Media.js';
import { FALLBACK_CATALOGUE } from '../controllers/mediaController.js';

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🧹 Cleaning existing collections...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Media.deleteMany({});

    console.log('👤 Seeding default users...');
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@streamly.com',
      password: 'Password123',
      role: 'user',
    });

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@streamly.com',
      password: 'AdminPassword123',
      role: 'admin',
    });

    console.log('🎭 Seeding profiles for demo user...');
    await Profile.create([
      {
        user: demoUser._id,
        name: 'Alex',
        avatar: 'linear-gradient(135deg,#0072d2,#62d5ff)',
        face: 'A',
        isKids: false,
        myList: [
          {
            mediaId: 1,
            mediaType: 'movie',
            title: 'Dune: Part Two',
            backdropPath: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
            posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
            voteAverage: 8.2,
            addedAt: new Date(),
          },
        ],
      },
      {
        user: demoUser._id,
        name: 'Morgan',
        avatar: 'linear-gradient(135deg,#6d28d9,#d946ef)',
        face: 'M',
        isKids: false,
      },
      {
        user: demoUser._id,
        name: 'Kids',
        avatar: 'linear-gradient(135deg,#f59e0b,#ef4444)',
        face: '★',
        isKids: true,
      },
      {
        user: demoUser._id,
        name: 'Guest',
        avatar: 'linear-gradient(135deg,#059669,#84cc16)',
        face: 'G',
        isKids: false,
      },
    ]);

    console.log('🎬 Seeding media catalogue...');
    await Media.insertMany(FALLBACK_CATALOGUE);

    console.log('✅ Database seeding complete!');
    console.log('-----------------------------------');
    console.log('Demo Credentials:');
    console.log('Email: demo@streamly.com');
    console.log('Password: Password123');
    console.log('-----------------------------------');

    mongoose.connection.removeAllListeners('disconnected');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
