const express = require('express');
const https = require('https');
const { URL } = require('url');
const router = express.Router();

// Helper: Proxy ke eksternal
function proxyRequest(targetBase, isPost = true) {
  return (req, res) => {
    const { url, body: bodyStr } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
      const fullUrl = new URL(url, targetBase);
      const options = {
        hostname: fullUrl.hostname,
        port: 443,
        path: fullUrl.pathname + fullUrl.search,
        method: isPost ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Wanzofc-API-Client/1.0'
        }
      };

      let requestBody = null;
      if (isPost && bodyStr) {
        requestBody = decodeURIComponent(bodyStr);
        options.headers['Content-Length'] = Buffer.byteLength(requestBody);
      }

      const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          res.json({
            status: proxyRes.statusCode,
            statusText: proxyRes.statusMessage || 'OK',
            headers: proxyRes.headers,
            body: parsed
          });
        });
      });

      proxyReq.on('error', err => {
        res.status(502).json({ error: 'Gateway error', message: err.message });
      });

      if (requestBody) proxyReq.write(requestBody);
      proxyReq.end();
    } catch (err) {
      res.status(500).json({ error: 'Invalid URL', message: err.message });
    }
  };
}

// ===== PAKASIR =====
router.post('/api/transactioncreate/:method', proxyRequest('https://app.pakasir.com', true));
router.post('/api/paymentsimulation', proxyRequest('https://app.pakasir.com', true));
router.get('/api/transactiondetail', proxyRequest('https://app.pakasir.com', false));

// ===== PAYPAL =====
router.all('/paypal/*', proxyRequest('https://api.paypal.com', true));

module.exports = router;