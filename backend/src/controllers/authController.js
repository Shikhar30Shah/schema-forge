const {
  createUser,
  findUserByEmail,
  verifyPassword,
  createSession,
  clearSession,
  saveHistoryEntry,
  getHistory,
} = require('../services/authStore');

async function signup(req, res, next) {
  try {
    const user = await createUser(req.body);
    const token = await createSession(user);
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res) {
  const user = await findUserByEmail(req.body.email);
  if (!user || !(await verifyPassword(user, req.body.password))) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = await createSession(user);
  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
}

async function logout(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  await clearSession(token);
  res.json({ success: true });
}

function me(req, res) {
  res.json({
    user: { id: req.user.id, name: req.user.name, email: req.user.email },
  });
}

async function addHistory(req, res) {
  const entry = await saveHistoryEntry(req.user.id, req.body);
  res.status(201).json(entry);
}

async function listHistory(req, res) {
  res.json(await getHistory(req.user.id));
}

module.exports = { signup, login, logout, me, addHistory, listHistory };
