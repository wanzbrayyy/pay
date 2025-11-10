const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAccountActive } = require('../middleware/authMiddleware');

router.get('/dashboard', ensureAuthenticated, ensureAccountActive, (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.user
    });
});

module.exports = router;
