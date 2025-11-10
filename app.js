const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const config = require('./config');
const User = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(config.db.uri)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: config.db.uri })
}));

app.use(async (req, res, next) => {
    res.locals.isAuthenticated = !!req.session.userId;
    if (req.session.userId) {
        try {
            res.locals.user = await User.findById(req.session.userId);
            req.user = res.locals.user;
        } catch (error) {
            console.error('Error fetching user from session:', error);
            res.locals.user = null;
            req.user = null;
        }
    } else {
        res.locals.user = null;
        req.user = null;
    }
    next();
});

app.get('/', (req, res) => res.render('index', { title: 'Home' }));
app.get('/endpoints', (req, res) => res.render('endpoints', { title: 'API Endpoints' }));
app.get('/getting-started', (req, res) => res.render('getting-started', { title: 'Getting Started' }));

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/', require('./routes/payment'));
app.use('/', require('./routes/api'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});