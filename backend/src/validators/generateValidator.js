const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      error: 'validation_error',
      errorFields: errors.array(),
    });
  }
  next();
};

const generateValidation = [
  body('source')
    .exists().withMessage('source is required')
    .bail()
    .isString().withMessage('source must be a string')
    .bail()
    .notEmpty().withMessage('source cannot be empty'),
  handleValidation,
];

const imageValidation = [
  body('image')
    .exists().withMessage('image is required')
    .bail()
    .isString().withMessage('image must be a base64 string')
    .bail()
    .notEmpty().withMessage('image cannot be empty'),
  body('mimeType')
    .exists().withMessage('mimeType is required')
    .bail()
    .isIn(['image/png', 'image/jpeg', 'image/webp']).withMessage('mimeType must be image/png, image/jpeg, or image/webp'),
  handleValidation,
];

module.exports = {
  generateValidation,
  imageValidation,
};
