import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    // Drop the old firebaseUid index if it exists
    try {
      await User.collection.dropIndex('firebaseUid_1');
      console.log('🔧 Dropped old firebaseUid index');
    } catch (error) {
      console.log('ℹ️  No old index to drop');
    }

    await User.deleteMany({});
    await Event.deleteMany({});
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    console.log('🗑️  Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    await connectDB();
    await clearDatabase();

    // Create users
    console.log('Creating users...');
    const user1 = await User.create({
      phone: '+919876543210',
      name: 'Rahul Verma',
      dob: '1995-03-15',
      gender: 'Male',
      bio: 'Music enthusiast & event organizer in Raipur. Always looking for new experiences!',
      photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'],
      // Fallback added to ensure this field exists
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      interests: ['🎵 Music', '💻 Tech', '🍔 Food'],
      verified: true,
      trustScore: 85
    });

    const user2 = await User.create({
      phone: '+919876543211',
      name: 'Priya Sharma',
      dob: '1998-07-22',
      gender: 'Female',
      bio: 'Yoga instructor & wellness advocate. Love connecting with like-minded people.',
      photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'],
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      interests: ['🧘 Wellness', '📸 Photography', '✈️ Travel'],
      verified: true,
      trustScore: 92
    });

    const user3 = await User.create({
      phone: '+919876543212',
      name: 'Amit Patel',
      dob: '1992-11-08',
      gender: 'Male',
      bio: 'Tech startup founder. Passionate about AI, chess, and building community.',
      photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'],
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      interests: ['💻 Tech', '🎮 Gaming', '♟️ Chess'],
      verified: true,
      trustScore: 78
    });

    console.log('✅ Created 3 users');

    // Create events
    console.log('Creating events...');
    
    // EVENT 1
    await Event.create({
      title: 'Raipur Music Festival 2025',
      description: 'Join us for an unforgettable evening of live music featuring local bands and artists from across Chhattisgarh.',
      location: 'Marine Drive, Telibandha, Raipur',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      category: '🎵 Music',
      imageURL: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      host: {
        _id: user1._id,
        name: user1.name,
        // FIX: Use photos[0] if photoURL is missing
        photoURL: user1.photoURL || user1.photos[0]
      },
      participants: [user1._id],
      coordinates: { lat: 21.2362, lng: 81.6350 }
    });

    // EVENT 2
    await Event.create({
      title: 'Morning Yoga at Telibandha Lake',
      description: 'Start your day with a peaceful yoga session by the lake. All levels welcome!',
      location: 'Telibandha Lake, Raipur',
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      category: '🧘 Wellness',
      imageURL: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      host: {
        _id: user2._id,
        name: user2.name,
        // FIX: Use photos[0] if photoURL is missing
        photoURL: user2.photoURL || user2.photos[0]
      },
      participants: [user2._id],
      coordinates: { lat: 21.2395, lng: 81.6355 }
    });

    // EVENT 3
    await Event.create({
      title: 'Tech Meetup: AI & Startups',
      description: 'Monthly tech meetup for developers, founders, and tech enthusiasts in Raipur.',
      location: '36TEN Coworking, Magneto Mall, Raipur',
      dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      category: '💻 Tech',
      imageURL: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      host: {
        _id: user3._id,
        name: user3.name,
        // FIX: Use photos[0] if photoURL is missing
        photoURL: user3.photoURL || user3.photos[0]
      },
      participants: [user3._id],
      coordinates: { lat: 21.2437, lng: 81.6570 }
    });

    // EVENT 4
    await Event.create({
      title: 'Street Food Walk — Purani Basti',
      description: 'Explore the hidden food gems of Purani Basti! A true food lover paradise.',
      location: 'Purani Basti, Raipur',
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      category: '🍔 Food',
      imageURL: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      host: {
        _id: user1._id,
        name: user1.name,
        // FIX: Use photos[0] if photoURL is missing
        photoURL: user1.photoURL || user1.photos[0]
      },
      participants: [user1._id],
      coordinates: { lat: 21.2510, lng: 81.6290 }
    });

    // EVENT 5
    await Event.create({
      title: 'Weekend Chess Tournament',
      description: 'Open chess tournament for all skill levels. Swiss-system format, 5 rounds.',
      location: 'City Center Mall, Raipur',
      dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      category: '♟️ Chess',
      imageURL: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
      host: {
        _id: user3._id,
        name: user3.name,
        // FIX: Use photos[0] if photoURL is missing
        photoURL: user3.photoURL || user3.photos[0]
      },
      participants: [user3._id],
      coordinates: { lat: 21.2488, lng: 81.6263 }
    });

    // EVENT 6
    await Event.create({
      title: 'Photography Walk at Nandan Van',
      description: 'Capture the beauty of Raipur famous Nandan Van Zoo & Safari.',
      location: 'Nandan Van Zoo, Raipur',
      dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      category: '📸 Photography',
      imageURL: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      host: {
        _id: user2._id,
        name: user2.name,
        // FIX: Use photos[0] if photoURL is missing
        photoURL: user2.photoURL || user2.photos[0]
      },
      participants: [user2._id],
      coordinates: { lat: 21.2190, lng: 81.6530 }
    });

    console.log('✅ Created 6 events');
    console.log('🎉 Database seeded successfully!');
    console.log('\n📝 Test Users:');
    console.log(`   Rahul Verma: +919876543210 (OTP in dev: any 6 digits)`);
    console.log(`   Priya Sharma: +919876543211 (OTP in dev: any 6 digits)`);
    console.log(`   Amit Patel: +919876543212 (OTP in dev: any 6 digits)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();