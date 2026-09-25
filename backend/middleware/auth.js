const jwt = require('jsonwebtoken');
const User = require('../models/User');
const persistentStore = require('../utils/persistentStore');
const { isDbConnected, getStatelessUserById, getStatelessUserByRole } = require('../utils/statelessStore');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. No token provided.' });
  }

  // Support instant demo tokens
  if (token.startsWith('krishi_demo_jwt_token_')) {
    let role = 'farmer';
    if (token.includes('expert')) role = 'expert';
    if (token.includes('admin')) role = 'admin';
    req.user = getStatelessUserByRole(role);
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'krishi_drishti_secret_key_2026_smart_farming');

    if (isDbConnected()) {
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (dbErr) {
        console.warn('MongoDB query warning in auth middleware:', dbErr.message);
      }
    }

    // Persistent store lookup by ID from decoded token
    const storeUser = persistentStore.getUserById(decoded.id) || getStatelessUserById(decoded.id);
    if (!storeUser) {
      return res.status(401).json({ success: false, message: 'User account not found or session expired.' });
    }
    req.user = storeUser;
    next();
  } catch (err) {
    // If token verification fails, check if it's an explicit demo token
    if (token && token.startsWith('krishi_demo_jwt_token_')) {
      let role = 'farmer';
      if (token.includes('expert')) role = 'expert';
      if (token.includes('admin')) role = 'admin';
      req.user = getStatelessUserByRole(role);
      return next();
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route.`
      });
    }
    next();
  };
};

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  if (token.startsWith('krishi_demo_jwt_token_')) {
    let role = 'farmer';
    if (token.includes('expert')) role = 'expert';
    if (token.includes('admin')) role = 'admin';
    req.user = getStatelessUserByRole(role);
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'krishi_drishti_secret_key_2026_smart_farming');
    if (isDbConnected()) {
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (_) {}
    }
    req.user = persistentStore.getUserById(decoded.id) || getStatelessUserById(decoded.id);
  } catch (err) {
    // Gracefully continue for demo tokens or unverified guests
    if (token && token.includes('demo')) {
      req.user = getStatelessUserByRole('farmer');
    }
  }
  next();
};

module.exports = { protect, optionalProtect, authorize };

