const { generateFromSource, generateFromImage } = require('../services/aiService');
const { getSession, getUserById, saveHistoryEntry } = require('../services/authStore');

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return null;
  }

  const session = await getSession(token);
  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}

async function generate(req, res, next) {
  console.log('Received generate request with body:', req.body);
  try {
    const { source } = req.body;
    const result = await generateFromSource(source);

    const authUser = await getAuthenticatedUser(req);
    if (authUser) {
      await saveHistoryEntry(authUser.id, {
        source,
        models: result.models,
        routes: result.routes,
        validators: result.validators,
        summary: result.summary,
        sourceType: result.sourceType,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function generateFromImageHandler(req, res, next) {
  console.log('Received generate-from-image request');
  try {
    const { image, mimeType } = req.body;
    const result = await generateFromImage(image, mimeType);

    const authUser = await getAuthenticatedUser(req);
    if (authUser) {
      await saveHistoryEntry(authUser.id, {
        source: result.summary || 'Generated from uploaded image',
        models: result.models,
        routes: result.routes,
        validators: result.validators,
        summary: result.summary,
        sourceType: result.sourceType,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { generate, generateFromImageHandler, getAuthenticatedUser };
