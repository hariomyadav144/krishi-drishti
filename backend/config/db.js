const mongoose = require('mongoose');

let isListenersAttached = false;

/**
 * Configure Mongoose connection event listeners once
 */
function setupConnectionEvents() {
  if (isListenersAttached) return;
  isListenersAttached = true;

  mongoose.connection.on('connecting', () => {
    console.log('[MongoDB] MongoDB connecting...');
  });

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] MongoDB connected successfully to database.');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] MongoDB connection error:', err.message);
  });
}

/**
 * Reliable database connection module using mongoose
 * Ensures single connection reuse and safe bufferCommands lifecycle
 */
const connectDB = async () => {
  setupConnectionEvents();

  // Reuse existing active connection
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it to complete
  if (mongoose.connection && mongoose.connection.readyState === 2) {
    console.log('[MongoDB] Connection already in progress, awaiting...');
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
    return mongoose.connection;
  }

  // Ensure bufferCommands is never globally disabled to prevent "Cannot call users.findOne before initial connection"
  mongoose.set('bufferCommands', true);

  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('[MongoDB] Connecting to provided MongoDB URI...');
      await mongoose.connect(uri.trim(), {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: true,
      });
      console.log('[MongoDB] MongoDB connected successfully.');
      return mongoose.connection;
    } catch (error) {
      console.error('[MongoDB] External MongoDB connection error:', error.message);
      // In development, attempt local fallback if available
      try {
        console.log('[MongoDB] Attempting fallback to local MongoDB instance (mongodb://127.0.0.1:27017/fasal_drishti)...');
        await mongoose.connect('mongodb://127.0.0.1:27017/fasal_drishti', {
          serverSelectionTimeoutMS: 2000,
          bufferCommands: true,
        });
        console.log('[MongoDB] Connected to local MongoDB instance.');
        return mongoose.connection;
      } catch (localErr) {
        console.warn('[MongoDB] Local MongoDB also unavailable:', localErr.message);
        throw error;
      }
    }
  } else {
    // When no MONGODB_URI is provided in environment
    console.log('[MongoDB] No external MONGODB_URI specified. Checking local instance...');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/fasal_drishti', {
        serverSelectionTimeoutMS: 2000,
        bufferCommands: true,
      });
      console.log('[MongoDB] Connected to local MongoDB instance.');
      return mongoose.connection;
    } catch (localErr) {
      console.warn('[MongoDB] Local MongoDB not running on 127.0.0.1:27017 (' + localErr.message + ').');
      console.log('[MongoDB] Operating in resilient persistence mode.');
      return null;
    }
  }
};

const disconnectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] MongoDB disconnected.');
  }
};

module.exports = { connectDB, disconnectDB };
