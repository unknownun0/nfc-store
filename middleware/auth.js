const jwt = require('jsonwebtoken');

function getSecret() {
  return process.env.JWT_SECRET || 'change-this-secret';
}

function sign(payload, expiresIn = '7d') {
  return jwt.sign(payload, getSecret(), { expiresIn });
}

function requireAuth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
      const decoded = jwt.verify(token, getSecret());
      if (role && decoded.role !== role) return res.status(403).json({ error: 'Forbidden' });
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = { sign, requireAuth };
