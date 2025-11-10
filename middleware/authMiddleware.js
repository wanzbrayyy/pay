module.exports = {
    ensureAuthenticated: (req, res, next) => {
        if (req.session.userId) {
            return next();
        }
        res.redirect('/login');
    },
    forwardAuthenticated: (req, res, next) => {
        if (!req.session.userId) {
            return next();
        }
        res.redirect('/dashboard');
    },
    ensureAccountActive: (req, res, next) => {
        if (req.user && req.user.paymentStatus === 'completed') {
            return next();
        }
        res.redirect('/checkout');
    }
};