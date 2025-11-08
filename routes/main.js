const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/profile');
  }
  res.render('pages/home');
});

router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/profile');
  }
  res.render('pages/login');
});

router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/profile');
  }
  res.render('pages/register');
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Gagal logout:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;