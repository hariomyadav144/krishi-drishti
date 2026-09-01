const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (uri && uri.trim() !== '') {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully to external instance.');
    } else {
      console.log('No external MongoDB URI specified. Initializing embedded in-memory MongoDB Server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`Embedded MongoDB connected successfully at ${uri}`);
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    try {
      console.log('Attempting fallback to embedded MongoMemoryServer...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const fallbackUri = mongoMemoryServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`Fallback embedded MongoDB connected successfully at ${fallbackUri}`);
    } catch (fallbackError) {
      console.error('Fatal: Could not start in-memory MongoDB server:', fallbackError.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
