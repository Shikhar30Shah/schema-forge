const { getSession, getUserById } = require('../services/authStore');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const session = await getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  req.user = user;
  next();
}

module.exports = authMiddleware;
