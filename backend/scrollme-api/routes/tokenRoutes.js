const express = require('express');
const { requestTokens, getPendingRequests, approveRequest } = require('../controllers/tokenController');

const router = express.Router();

router.post('/request', requestTokens);
router.get('/pending', getPendingRequests);
router.post('/approve', approveRequest);

module.exports = router;