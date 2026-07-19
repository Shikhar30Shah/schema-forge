const express = require('express');
const generateController = require('../controllers/generateController');
const { generateValidation, imageValidation } = require('../validators/generateValidator');

const router = express.Router();

router.post('/', generateValidation, generateController.generate);
router.post('/image', imageValidation, generateController.generateFromImageHandler);

module.exports = router;
