const express = require('express');
const { getScores, updateScore } = require('../controllers/userController');

const router = express.Router();

router.get('/get-scores', getScores);
router.post('/update-score', updateScore);

module.exports = router;