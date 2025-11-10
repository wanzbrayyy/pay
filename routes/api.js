const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated, ensureAccountActive } = require('../middleware/authMiddleware');
const config = require('../config');
router.all('/v1/*', ensureAuthenticated, ensureAccountActive, async (req, res) => {
    const endpoint = req.params[0];
    const targetUrl = `${config.rdash.apiUrl}/${endpoint}`;
    const { rdash_reseller_id, rdash_api_key } = req.user;

    if (!rdash_reseller_id || !rdash_api_key) {
        return res.status(403).json({ message: 'RDASH Reseller ID and API Key are not set in your profile.' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${rdash_reseller_id}:${rdash_api_key}`).toString('base64');

    try {
        const response = await axios({
            method: req.method,
            url: targetUrl,
            params: req.query,
            data: req.body,
            headers: { 'Authorization': authHeader, 'Accept': 'application/json' }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : { message: 'Proxy server error' };
        res.status(status).json(data);
    }
});

module.exports = router;