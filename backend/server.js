const path = require('path');
// Load environment variables from backend/.env first, then root .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const { seedDatabase } = require('./utils/seedData');
const { testGeminiDiagnostic, getActiveModel, getApiKey } = require('./services/geminiService');

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
const aiRoutes = require('./routes/aiRoutes');
const aiAdviceRoutes = require('./routes/aiAdviceRoutes');

const app = express();

// Transparent URL rewrite middleware: prevents any duplicate /api/api/ issues
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace('/api/api/', '/api/');
  }
  next();
});

// Robust CORS configuration supporting production GitHub Pages and localhost
const allowedOrigins = [
  'https://ariomyadav144.github.io',
  'https://hariomyadav144.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile apps, and tools with no origin header
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.github.io') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    // Permissive callback for cloud deployments
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
}));

app.options('*', cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes (support both /api/* and root /* to prevent 404 route mismatches)
app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);
app.use('/api/ai-advice', aiAdviceRoutes);
app.use('/ai-advice', aiAdviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/api/action-plans', actionPlanRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/tools', toolsRoutes);

// Health check endpoints (supports both /health and /api/health)
const healthHandler = (req, res) => {
  const isGeminiConfigured = Boolean(getApiKey());
  res.status(200).json({
    status: 'ok',
    success: true,
    geminiConfigured: isGeminiConfigured,
    model: getActiveModel(),
    app: 'KRISHI DRISHTI API',
    tagline: 'From Space to Soil',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Safe diagnostic endpoint for Gemini connectivity
const geminiDiagnosticHandler = async (req, res) => {
  try {
    const result = await testGeminiDiagnostic();
    const statusCode = result.status === 'ok' ? 200 : (result.geminiConfigured ? 502 : 503);
    res.status(statusCode).json(result);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      geminiConfigured: false,
      message: err.message || 'Diagnostic ping error'
    });
  }
};

app.get('/health/gemini', geminiDiagnosticHandler);
app.get('/api/health/gemini', geminiDiagnosticHandler);

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

// Initialize HTTP Server immediately for instant Render health checks
function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🌾 KRISHI DRISHTI – AI for Smarter Farming API`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://0.0.0.0:${PORT}/health`);
    console.log(`📡 API Health:   http://0.0.0.0:${PORT}/api/health`);
    console.log(`📡 Gemini Ping:  http://0.0.0.0:${PORT}/api/health/gemini`);
    console.log(`🤖 Gemini Status: ${Boolean(getApiKey()) ? 'Configured ✓' : 'Not Set ✕ (Add GEMINI_API_KEY in Render Environment)'}`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    console.error('HTTP Server Error:', err.message);
  });

  // Connect to Database asynchronously so port binding is never blocked
  connectDB()
    .then(async () => {
      try {
        const count = await User.countDocuments();
        if (count === 0) {
          console.log('Empty database detected. Auto-populating realistic agricultural demo dataset...');
          await seedDatabase();
        }
      } catch (seedErr) {
        console.warn('Initial seeding check warning:', seedErr.message);
      }
    })
    .catch((err) => {
      console.warn('Database initialization warning (API active and responsive):', err.message);
    });

  // Keep-alive timer
  setInterval(() => {}, 1000 * 60 * 60);
}

startServer();
