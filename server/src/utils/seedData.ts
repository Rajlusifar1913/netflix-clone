import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Media } from '../models/Media.js';
import { Plan } from '../models/Plan.js';
import { FALLBACK_CATALOGUE } from '../controllers/mediaController.js';

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🧹 Cleaning existing collections...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Media.deleteMany({});
    await Plan.deleteMany({});

    console.log('💳 Seeding default subscription plans...');
    await Plan.create([
      {
        planId: 'mobile',
        name: 'Mobile',
        price: '₹149 / mo',
        monthlyAmount: 149,
        durationDays: 30,
        durationLabel: '1 Month (30 Days)',
        specs: '720p HD (1 Screen on Mobile/Tablet)',
        quality: 'Fair',
        resolution: '480p/720p SD',
        screens: '1 Screen at once',
        features: ['Phone & Tablet only', 'Standard Definition 480p/720p', '1 Download Device', 'Ad-Free Streaming'],
        isActive: true,
      },
      {
        planId: 'standard',
        name: 'Standard',
        price: '₹499 / mo',
        monthlyAmount: 499,
        durationDays: 30,
        durationLabel: '1 Month (30 Days)',
        specs: 'Full HD 1080p (2 Screens at once)',
        quality: 'Great',
        resolution: '1080p Full HD',
        screens: '2 Screens at once',
        features: ['TV, Computer, Phone, Tablet', '1080p Full HD Video Quality', '2 Download Devices', 'Unlimited Movies & TV Shows'],
        isActive: true,
      },
      {
        planId: 'premium',
        name: 'Premium Ultra',
        price: '₹649 / mo',
        monthlyAmount: 649,
        durationDays: 30,
        durationLabel: '1 Month (30 Days)',
        specs: 'Ultra HD 4K + HDR (4 Screens at once)',
        quality: 'Best',
        resolution: '4K + HDR Ultra HD',
        screens: '4 Screens at once',
        features: ['TV, Computer, Phone, Tablet', '4K Ultra HD + Dolby Vision & HDR10', 'Spatial Audio Sound Stage', '6 Download Devices'],
        isPopular: true,
        isActive: true,
      },
    ]);

    console.log('👤 Seeding default Admin & Managed users...');
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@streamly.com',
      password: 'Password123',
      role: 'user',
      subscription: {
        status: 'active',
        planId: 'premium',
        planName: 'Premium Ultra',
        planSpecs: 'Ultra HD 4K + HDR (4 Screens at once)',
        cardLast4: '4242',
        cardBrand: 'visa',
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        cancelAtPeriodEnd: false,
      },
    });

    await User.create({
      name: 'Admin User',
      email: 'admin@streamly.com',
      password: 'AdminPassword123',
      role: 'admin',
      subscription: {
        status: 'active',
        planId: 'premium',
        planName: 'Premium Ultra VIP',
        planSpecs: 'Ultra HD 4K + HDR (4 Screens at once)',
        cardLast4: 'VIP',
        cardBrand: 'visa',
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
        cancelAtPeriodEnd: false,
      },
    });

    // Sample users for Admin Dashboard tables & analytics
    const sampleUsers = [
      { name: 'Jane Doe', email: 'jane.doe@streamly.io', planId: 'premium', planName: 'Premium Ultra', status: 'active', amount: 649 },
      { name: 'Alex Rivera', email: 'alex.rivera@example.com', planId: 'premium', planName: 'Premium Ultra', status: 'active', amount: 649 },
      { name: 'Sarah Connor', email: 'sarah.c@gmail.com', planId: 'standard', planName: 'Standard 1080p', status: 'active', amount: 499 },
      { name: 'Michael Scott', email: 'michael.s@dundermifflin.com', planId: 'mobile', planName: 'Mobile 720p', status: 'past_due', amount: 149 },
      { name: 'Elena Gilbert', email: 'elena.g@mysticfalls.org', planId: 'standard', planName: 'Standard 1080p', status: 'active', amount: 499 },
    ];

    for (const su of sampleUsers) {
      await User.create({
        name: su.name,
        email: su.email,
        password: 'Password123',
        role: 'user',
        subscription: {
          status: su.status,
          planId: su.planId,
          planName: su.planName,
          planSpecs: su.planId === 'premium' ? 'Ultra HD 4K + HDR' : su.planId === 'standard' ? 'Full HD 1080p' : '720p HD Mobile',
          cardLast4: '4242',
          cardBrand: 'visa',
          currentPeriodEnd: new Date(Date.now() + 20 * 86400000),
          cancelAtPeriodEnd: false,
        },
      });
    }

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
    const catalogData = FALLBACK_CATALOGUE.map((item) => ({
      ...item,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationMinutes: 120,
      quality: '4K UHD',
      year: 2024,
      viewsCount: Math.floor(15000 + Math.random() * 25000),
    }));

    await Media.insertMany(catalogData);

    console.log('✅ Database seeding complete!');
    console.log('-----------------------------------');
    console.log('🔑 Credentials:');
    console.log('Admin: email: admin@streamly.com | password: AdminPassword123');
    console.log('User:  email: demo@streamly.com  | password: Password123');
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
