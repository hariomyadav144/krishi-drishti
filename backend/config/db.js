const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('MongoDB connected successfully to database.');
      return;
    } catch (error) {
      console.warn('External MongoDB connection failed:', error.message);
      console.warn('Krishi Drishti API continuing in resilient stateless cloud mode.');
    }
  } else {
    console.log('No external MONGODB_URI specified. Operating in high-performance cloud mode for AI Advisory & Tools.');
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDB, disconnectDB };
