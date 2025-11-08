const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.render('pages/login', { errorMessage: 'Email atau password salah.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.render('pages/login', { errorMessage: 'Email atau password salah.' });
  }
  req.session.userId = user._id;
  req.session.save(() => res.redirect('/profile'));
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    return res.render('pages/register', { errorMessage: 'Email sudah digunakan.' });
  }
  const hash = await bcrypt.hash(password, 12);
  const apiKey = crypto.randomBytes(32).toString('hex');
  const user = new User({ name, email, password: hash, apiKey });
  await user.save();
  req.session.userId = user._id;
  req.session.save(() => res.redirect('/profile'));
});

module.exports = router;