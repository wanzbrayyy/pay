require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const path = require('path');
const mongoose = require('mongoose');
const https = require('https');

const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const User = require('./models/User');

// Koneksi MongoDB
mongoose.connect(process.env.MONGODB_URI).catch(err => {
  console.error('❌ Gagal koneksi MongoDB:', err.message);
  process.exit(1);
});

const app = express();
const requestLog = [];

// === HTTPS REDIRECT (WAJIB UNTUK VERCEL) ===
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.hostname}${req.originalUrl}`);
    }
  }
  next();
});

// Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session dengan MongoDB
const store = new MongoStore({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Logger & Live Traffic
app.use((req, res, next) => {
  const fullUrl = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  console.log(`[${new Date().toISOString()}] ${req.method} ${fullUrl}`);
  requestLog.unshift({ method: req.method, url: req.originalUrl, time: Date.now() });
  if (requestLog.length > 50) requestLog.pop();
  next();
});

// Routes
app.use('/', mainRoutes);
app.use('/', authRoutes);

// Profile
app.get('/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.session.userId).select('name email apiKey');
  if (!user) return res.redirect('/logout');
  res.render('pages/profile', { user });
});

// Endpoints Docs
app.get('/endpoints', (req, res) => {
  res.render('pages/endpoints');
});

// Live Traffic API
app.get('/api/live-traffic', authMiddleware, (req, res) => {
  res.json({ logs: requestLog });
});

// === /result: Eksekusi API ke Pakasir atau PayPal ===
app.get('/result', authMiddleware, async (req, res) => {
  const { url, method, apikey, body: bodyStr } = req.query;
  if (!url || !method) {
    return res.render('error', { message: 'Parameter tidak lengkap.' });
  }

  const requestData = {
    url,
    method: method.toUpperCase(),
    apikey: apikey || '—',
    body: bodyStr || null
  };

  let responseData = {
    status: 500,
    statusText: 'Internal Error',
    headers: {},
    body: { error: 'Gagal menghubungi API' }
  };

  try {
    let targetBase = 'https://app.pakasir.com';
    if (url.includes('paypal.com')) {
      targetBase = 'https://api.paypal.com';
    }

    const fullUrl = url.startsWith('http') ? url : `${targetBase}${url}`;
    const urlObj = new URL(fullUrl);
    const isPost = method.toUpperCase() === 'POST';
    const requestBody = bodyStr ? decodeURIComponent(bodyStr) : null;

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Wanzofc-API-Client/1.0'
      }
    };

    if (apikey) {
      if (url.includes('paypal.com')) {
        const b64 = Buffer.from(apikey).toString('base64');
        options.headers['Authorization'] = `Basic ${b64}`;
      } else {
        options.headers['X-API-KEY'] = apikey;
      }
    }

    if (requestBody && isPost) {
      options.headers['Content-Length'] = Buffer.byteLength(requestBody);
    }

    const apiResponse = await new Promise((resolve, reject) => {
      const reqPay = https.request(options, (resPay) => {
        let data = '';
        resPay.on('data', (chunk) => data += chunk);
        resPay.on('end', () => {
          resolve({
            statusCode: resPay.statusCode,
            statusMessage: resPay.statusMessage || 'OK',
            headers: resPay.headers,
            body: data
          });
        });
      });
      reqPay.on('error', reject);
      if (requestBody && isPost) reqPay.write(requestBody);
      reqPay.end();
    });

    let parsedBody = apiResponse.body;
    const contentType = apiResponse.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        parsedBody = JSON.parse(apiResponse.body);
      } catch (e) {
        // Biarkan sebagai string jika gagal parse
      }
    }

    responseData = {
      status: apiResponse.statusCode,
      statusText: apiResponse.statusMessage,
      headers: apiResponse.headers,
      body: parsedBody
    };
  } catch (err) {
    console.error('API Call Error:', err.message);
    responseData.body = { error: err.message };
  }

  res.render('pages/result', { request: requestData, response: responseData });
});

// Redirect root dash.wanzofc.site ke /dash
app.use((req, res, next) => {
  if (req.hostname === 'dash.wanzofc.site' && req.path === '/') {
    return res.redirect('/dash');
  }
  next();
});

// Dashboard
app.get('/dash', authMiddleware, (req, res) => {
  const stats = { totalRequests: requestLog.length };
  res.render('pages/dashboard', { stats });
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Halaman tidak ditemukan.' });
});

// Jalankan di Termux
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Wanzofc API berjalan di http://localhost:${PORT}`);
  });
}

// Ekspor untuk Vercel
module.exports = app;