const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const historyValidation = [
  body('source').optional().isString().withMessage('source must be a string.'),
  body('models').optional().isString().withMessage('models must be a string.'),
  body('routes').optional().isString().withMessage('routes must be a string.'),
  body('validators').optional().isString().withMessage('validators must be a string.'),
  body('summary').optional().isString().withMessage('summary must be a string.'),
  body('sourceType')
    .optional()
    .isIn(['schema', 'openapi', 'graphql', 'ai', 'local'])
    .withMessage('sourceType must be one of: schema, openapi, graphql, ai, local.'),
  handleValidation,
];

module.exports = {
  historyValidation,
};
