// routes/api.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('https://wanzofc.com/login');
  }
  next();
};
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('name email apiKey');
    if (!user) {
      return res.redirect('/logout');
    }
    res.render('pages/profile', { user });
  } catch (err) {
    console.error(err);
    res.redirect('/logout');
  }
});
router.get('/endpoints', (req, res) => {
  res.render('pages/endpoints');
});

router.get('/api/v1/status', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key diperlukan' });
  }
  res.json({ status: 'OK', message: 'API key valid' });
});

module.exports = router;