require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { seedDatabase } = require('./utils/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const cropRoutes = require('./routes/cropRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const alertRoutes = require('./routes/alertRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const expertRoutes = require('./routes/expertRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mandiRoutes = require('./routes/mandiRoutes');
const toolsRoutes = require('./routes/toolsRoutes');
const aiAdviceRoutes = require('./routes/aiAdviceRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ai-advice', aiAdviceRoutes);
app.use('/api/action-plans', actionPlanRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/tools', toolsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'KRISHI DRISHTI API',
    tagline: 'From Space to Soil',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize Database and Start Server
async function startServer() {
  await connectDB();

  // Auto-seed if database is empty for seamless out-of-the-box experience
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('Empty database detected. Auto-populating realistic agricultural demo dataset...');
      await seedDatabase();
    }
  } catch (seedErr) {
    console.warn('Initial seeding check warning:', seedErr.message);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🌾 KRISHI DRISHTI – AI for Smarter Farming API`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    console.error('HTTP Server Error:', err.message);
  });

  // Keep-alive timer
  setInterval(() => {}, 1000 * 60 * 60);
}

startServer();

