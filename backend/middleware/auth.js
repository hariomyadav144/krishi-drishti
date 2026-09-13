const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

    // Stateless fallback: synthesize authenticated user from decoded token
    req.user = getStatelessUserById(decoded.id);
    next();
  } catch (err) {
    // If token verification fails, check if it's a demo or fallback user
    if (token && token.includes('demo')) {
      req.user = getStatelessUserByRole('farmer');
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
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } else {
      req.user = getStatelessUserById(decoded.id);
    }
  } catch (err) {
    // Gracefully continue for demo tokens or unverified guests
    if (token && token.includes('demo')) {
      req.user = getStatelessUserByRole('farmer');
    }
  }
  next();
};

module.exports = { protect, optionalProtect, authorize };
