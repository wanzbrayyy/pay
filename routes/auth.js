const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { forwardAuthenticated } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

router.get('/login', forwardAuthenticated, (req, res) => res.render('login', { title: 'Login' }));

router.get('/register', forwardAuthenticated, (req, res) => res.render('register', { title: 'Register' }));

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email: email });
    if (userExists) {
        return res.render('register', { error: 'Email is already registered', name, email, title: 'Register' });
    }

    const newUser = new User({ name, email, password, paymentOrderId: uuidv4() });
    await newUser.save();

    req.session.userId = newUser._id;
    res.redirect('/checkout');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
        return res.render('login', { error: 'Invalid credentials', title: 'Login' });
    }

    req.session.userId = user._id;
    
    if (user.paymentStatus === 'completed') {
        res.redirect('/dashboard');
    } else {
        res.redirect('/checkout');
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/');
    });
});

module.exports = router;